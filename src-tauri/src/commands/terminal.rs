use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

pub struct TerminalState {
    pub writer: Option<Box<dyn Write + Send>>,
}

pub struct TerminalAppState {
    pub terminal: Mutex<TerminalState>,
}

#[tauri::command]
pub async fn start_terminal(
    app: AppHandle,
    state: State<'_, TerminalAppState>,
    cwd: Option<String>,
) -> Result<(), String> {
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

    // Store writer
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    {
        let mut term = state.terminal.lock().map_err(|e| e.to_string())?;
        term.writer = Some(writer);
    }

    // Read output in background and emit events
    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let app_handle = app.clone();
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_handle.emit("terminal:output", data);
                }
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn write_terminal(
    state: State<'_, TerminalAppState>,
    data: String,
) -> Result<(), String> {
    let mut term = state.terminal.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut writer) = term.writer {
        writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn resize_terminal(
    state: State<'_, TerminalAppState>,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    // portable-pty resize requires the master handle, but we moved it out.
    // For now, this is a no-op until we restructure to keep the master.
    let _ = (state, rows, cols);
    Ok(())
}
