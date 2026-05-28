use std::io::Write;
use std::sync::Mutex;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::oneshot;

pub struct AgentState {
    child: Option<Child>,
    stdin: Option<Box<dyn Write + Send>>,
    shutdown_tx: Option<oneshot::Sender<()>>,
}

pub struct AppState {
    pub agent: Mutex<AgentState>,
}

#[tauri::command]
pub async fn start_agent(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    project_path: String,
) -> Result<String, String> {
    let mut guard = state.agent.lock().map_err(|e| e.to_string())?;

    // Kill existing agent if any
    if let Some(ref mut child) = guard.child {
        let _ = child.kill().await;
    }

    let agent_script = std::env::current_dir()
        .map(|d| d.join("agent/index.ts"))
        .unwrap_or_else(|_| "agent/index.ts".into());

    let mut child = Command::new("node")
        .arg("--loader")
        .arg("ts-node/esm")
        .arg(&agent_script)
        .arg(&project_path)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start agent: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let mut stdin = child.stdin.take().ok_or("Failed to capture stdin")?;
    let app_clone = app.clone();

    // Read agent stdout and emit Tauri events
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel();
    tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        loop {
            tokio::select! {
                result = lines.next_line() => {
                    match result {
                        Ok(Some(line)) => {
                            if !line.trim().is_empty() {
                                let _ = app_clone.emit("agent:message", &line);
                            }
                        }
                        Ok(None) => break,
                        Err(e) => {
                            let _ = app_clone.emit("agent:message", format!("{{\"type\":\"error\",\"content\":\"{e}\"}}"));
                            break;
                        }
                    }
                }
                _ = &mut shutdown_rx => break,
            }
        }
    });

    guard.child = Some(child);
    guard.stdin = Some(Box::new(stdin));
    guard.shutdown_tx = Some(shutdown_tx);

    Ok("started".to_string())
}

#[tauri::command]
pub async fn send_agent_message(
    state: tauri::State<'_, AppState>,
    content: String,
) -> Result<(), String> {
    let mut guard = state.agent.lock().map_err(|e| e.to_string())?;
    let stdin = guard.stdin.as_mut().ok_or("Agent not running")?;
    let msg = serde_json::json!({"type": "user_message", "content": content});
    writeln!(stdin, "{}", msg).map_err(|e| format!("Write failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn stop_agent(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut guard = state.agent.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut child) = guard.child {
        let _ = child.kill().await;
    }
    if let Some(tx) = guard.shutdown_tx.take() {
        let _ = tx.send(());
    }
    guard.child = None;
    guard.stdin = None;
    Ok(())
}
