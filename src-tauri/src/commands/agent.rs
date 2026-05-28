use std::collections::HashMap;
use tauri::{Emitter, Manager};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::{Mutex, oneshot};

pub struct AgentState {
    pub child: Option<Child>,
    pub shutdown_tx: Option<oneshot::Sender<()>>,
    pub ready: bool,
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
        guard.ready = false;
    }

    // Resolve agent script: try multiple strategies
    let agent_script = resolve_agent_path(&app, &project_path)?;

    // Collect relevant env vars to pass to Node.js child process
    let env_vars = collect_agent_env(&project_path);

    let mut cmd = Command::new("node");
    cmd.arg("--experimental-strip-types")
        .arg(&agent_script)
        .arg(&project_path)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .stdin(std::process::Stdio::piped());

    // Pass environment variables
    for (k, v) in &env_vars {
        cmd.env(k, v);
    }

    let mut child = cmd
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
                            let _ = app_stdout.emit("agent:message", format!("{{\"type\":\"error\",\"content\":\"stdout read error: {e}\"}}"));
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
        guard.ready = true;
    }

    Ok("started".to_string())
}

/// Try multiple strategies to locate agent/index.ts
fn resolve_agent_path(app: &tauri::AppHandle, project_path: &str) -> Result<std::path::PathBuf, String> {
    let candidates: Vec<std::path::PathBuf> = vec![
        // Strategy 1: sibling of project root (cc-devloop/agent/)
        std::path::PathBuf::from(project_path).join("agent/index.ts"),
        // Strategy 2: relative to resource dir (works in dev mode)
        app.path().resource_dir()
            .map(|d| d.join("../../../agent/index.ts"))
            .unwrap_or_default(),
        // Strategy 3: current working directory
        std::env::current_dir()
            .map(|d| d.join("agent/index.ts"))
            .unwrap_or_default(),
    ];

    for path in &candidates {
        if path.exists() {
            return Ok(path.clone());
        }
    }

    Err(format!(
        "Agent script not found. Tried:\n{}",
        candidates.iter()
            .filter(|p| !p.as_os_str().is_empty())
            .map(|p| format!("  - {:?}", p))
            .collect::<Vec<_>>()
            .join("\n")
    ))
}

/// Collect environment variables needed by the agent process
fn collect_agent_env(project_path: &str) -> HashMap<String, String> {
    let mut env = HashMap::new();

    // Forward relevant env vars from parent process
    let keys_to_forward = [
        "ANTHROPIC_API_KEY",
        "ANTHROPIC_AUTH_TOKEN",
        "ANTHROPIC_BASE_URL",
        "ANTHROPIC_MODEL",
        "ANTHROPIC_DEFAULT_SONNET_MODEL",
        "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME",
        "HOME",
        "PATH",
        "USER",
    ];

    for key in &keys_to_forward {
        if let Ok(val) = std::env::var(key) {
            env.insert(key.to_string(), val);
        }
    }

    // Always set project path
    env.insert("CC_DEVLOOP_PROJECT_PATH".to_string(), project_path.to_string());

    env
}

#[tauri::command]
pub async fn send_agent_message(
    state: tauri::State<'_, AppState>,
    content: String,
) -> Result<(), String> {
    let mut guard = state.agent.lock().await;
    if let Some(ref mut c) = guard.child {
        if let Some(ref mut stdin) = c.stdin {
            let stdin_line = serde_json::json!({"type": "user_message", "content": content});
            let line_str = format!("{}\n", stdin_line);
            stdin.write_all(line_str.as_bytes()).await.map_err(|e| format!("Write failed: {}", e))?;
            stdin.flush().await.map_err(|e| format!("Flush failed: {}", e))?;
        } else {
            return Err("Agent stdin not available".to_string());
        }
    } else {
        return Err("Agent not running".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn is_agent_running(
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let guard = state.agent.lock().await;
    Ok(guard.child.is_some() && guard.ready)
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
