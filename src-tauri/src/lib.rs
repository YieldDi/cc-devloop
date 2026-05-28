mod commands;

use commands::agent::{AgentState, AppState};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            agent: tokio::sync::Mutex::new(AgentState {
                child: None,
                shutdown_tx: None,
            }),
        })
        .invoke_handler(tauri::generate_handler![
            commands::fs::read_project_tree,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::select_directory,
            commands::agent::start_agent,
            commands::agent::send_agent_message,
            commands::agent::stop_agent,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
