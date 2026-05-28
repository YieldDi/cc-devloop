use tauri::{Emitter, Manager};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::{Mutex, oneshot};

pub struct AgentState {
    pub child: Option<Child>,
    pub shutdown_tx: Option<oneshot::Sender<()>>,
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
    // Kill existing agent
    {
        let mut guard = state.agent.lock().await;
        if let Some(ref mut child) = guard.child {
            let _ = child.start_kill();
        }
        guard.child = None;
        guard.shutdown_tx = None;
    }

    // Resolve agent script path relative to the app's resource dir
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Resource dir error: {}", e))?;
    let agent_script = resource_dir.join("../../../agent/index.ts");
    let agent_script = if agent_script.exists() {
        agent_script
    } else {
        // Fallback: try relative to current dir
        let fallback = std::env::current_dir()
            .map(|d| d.join("agent/index.ts"))
            .unwrap_or_else(|_| "agent/index.ts".into());
        if fallback.exists() {
            fallback
        } else {
            return Err(format!(
                "Agent script not found. Tried {:?} and {:?}",
                agent_script, fallback
            ));
        }
    };

    let mut child = Command::new("node")
        .arg("--experimental-strip-types")
        .arg(&agent_script)
        .arg(&project_path)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start agent: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    let app_clone = app.clone();

    // Read stdout and emit Tauri events
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel();
    let app_stdout = app_clone.clone();
    tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        loop {
            tokio::select! {
                result = lines.next_line() => {
                    match result {
                        Ok(Some(line)) => {
                            if !line.trim().is_empty() {
                                let _ = app_stdout.emit("agent:message", &line);
                            }
                        }
                        Ok(None) => break,
                        Err(e) => {
                            let _ = app_stdout.emit("agent:message", format!("{{\"type\":\"error\",\"content\":\"stdout: {e}\"}}"));
                            break;
                        }
                    }
                }
                _ = &mut shutdown_rx => break,
            }
        }
    });

    // Read stderr for debugging
    let app_stderr = app_clone;
    tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            eprintln!("[agent stderr] {}", line);
            let _ = app_stderr.emit("agent:message", format!("{{\"type\":\"error\",\"content\":\"stderr: {}\"}}", line));
        }
    });

    {
        let mut guard = state.agent.lock().await;
        guard.child = Some(child);
        guard.shutdown_tx = Some(shutdown_tx);
    }

    Ok("started".to_string())
}

#[tauri::command]
pub async fn send_agent_message(
    state: tauri::State<'_, AppState>,
    content: String,
) -> Result<(), String> {
    let stdin_line = serde_json::json!({"type": "user_message", "content": content});
    let line_str = format!("{}\n", stdin_line);

    let mut guard = state.agent.lock().await;
    if let Some(ref mut c) = guard.child {
        if let Some(ref mut stdin) = c.stdin {
            stdin.write_all(line_str.as_bytes()).await.map_err(|e| format!("Write failed: {}", e))?;
            stdin.flush().await.map_err(|e| format!("Flush failed: {}", e))?;
        }
    } else {
        return Err("Agent not running".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_agent(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut guard = state.agent.lock().await;

    if let Some(tx) = guard.shutdown_tx.take() {
        let _ = tx.send(());
    }

    if let Some(ref mut child) = guard.child {
        let _ = child.start_kill();
    }

    guard.child = None;
    Ok(())
}
