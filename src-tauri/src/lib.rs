mod commands;

use commands::agent::{AgentState, AppState};
use commands::terminal::{TerminalAppState, TerminalState};
use commands::git::GitState;
use commands::watcher::WatcherState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .manage(AppState {
            agent: tokio::sync::Mutex::new(AgentState {
                child: None,
                shutdown_tx: None,
                ready: false,
            }),
        })
        .manage(TerminalAppState {
            terminal: std::sync::Mutex::new(TerminalState::default()),
        })
        .manage(GitState {
            project_path: std::sync::Mutex::new(None),
        })
        .manage(WatcherState {
            watcher: std::sync::Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::fs::read_project_tree,
            commands::fs::read_dir_children,
            commands::fs::read_project_tree_full,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::select_directory,
            commands::fs::search_files,
            commands::fs::create_file,
            commands::fs::rename_path,
            commands::fs::delete_path,
            commands::agent::start_agent,
            commands::agent::send_agent_message,
            commands::agent::stop_agent,
            commands::agent::is_agent_running,
            commands::terminal::start_terminal,
            commands::terminal::write_terminal,
            commands::terminal::close_terminal,
            commands::terminal::resize_terminal,
            commands::git::git_status,
            commands::git::git_commit,
            commands::git::git_set_project,
            commands::watcher::watch_project,
            commands::watcher::stop_watcher,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
