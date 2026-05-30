use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

struct TermInstance {
    writer: Box<dyn Write + Send>,
}

pub struct TerminalState {
    instances: HashMap<String, TermInstance>,
    next_id: usize,
}

impl Default for TerminalState {
    fn default() -> Self {
        Self {
            instances: HashMap::new(),
            next_id: 1,
        }
    }
}

pub struct TerminalAppState {
    pub terminal: Mutex<TerminalState>,
}

#[tauri::command]
pub async fn start_terminal(
    app: AppHandle,
    state: State<'_, TerminalAppState>,
    cwd: Option<String>,
) -> Result<String, String> {
    let pty_system = native_pty_system();

    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new_default_prog();
    if let Some(dir) = cwd {
        cmd.cwd(dir);
    }

    let _child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| e.to_string())?;

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Allocate an ID
    let id = {
        let mut term = state.terminal.lock().map_err(|e| e.to_string())?;
        let id = format!("term-{}", term.next_id);
        term.next_id += 1;
        term.instances.insert(id.clone(), TermInstance { writer });
        id
    };

    // Read output in background and emit events with terminal ID
    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let app_handle = app.clone();
    let emit_id = id.clone();
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_handle.emit(
                        "terminal:output",
                        serde_json::json!({ "id": emit_id, "data": data }),
                    );
                }
                Err(_) => break,
            }
        }
        // Signal that this terminal has exited
        let _ = app_handle.emit(
            "terminal:exit",
            serde_json::json!({ "id": emit_id }),
        );
    });

    Ok(id)
}

#[tauri::command]
pub async fn write_terminal(
    state: State<'_, TerminalAppState>,
    id: String,
    data: String,
) -> Result<(), String> {
    let mut term = state.terminal.lock().map_err(|e| e.to_string())?;
    let instance = term
        .instances
        .get_mut(&id)
        .ok_or_else(|| format!("Terminal {} not found", id))?;
    instance
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    instance.writer.flush().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn close_terminal(
    state: State<'_, TerminalAppState>,
    id: String,
) -> Result<(), String> {
    let mut term = state.terminal.lock().map_err(|e| e.to_string())?;
    term.instances.remove(&id);
    Ok(())
}

#[tauri::command]
pub async fn resize_terminal(
    state: State<'_, TerminalAppState>,
    id: String,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    // portable-pty resize requires the master handle, but we moved it out.
    // For now, this is a no-op until we restructure to keep the master.
    let _ = (state, id, rows, cols);
    Ok(())
}
