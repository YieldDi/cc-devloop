use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

pub struct WatcherState {
    pub watcher: Mutex<Option<RecommendedWatcher>>,
}

#[tauri::command]
pub async fn watch_project(
    app: AppHandle,
    state: State<'_, WatcherState>,
    path: String,
) -> Result<(), String> {
    // Stop existing watcher
    {
        let mut w = state.watcher.lock().map_err(|e| e.to_string())?;
        *w = None;
    }

    let app_handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        match res {
            Ok(event) => {
                let paths: Vec<String> = event
                    .paths
                    .iter()
                    .map(|p| p.to_string_lossy().to_string())
                    .collect();

                let kind = match event.kind {
                    EventKind::Create(_) => "create",
                    EventKind::Modify(_) => "modify",
                    EventKind::Remove(_) => "remove",
                    EventKind::Any => "any",
                    _ => return,
                };

                let _ = app_handle.emit(
                    "project:filechange",
                    serde_json::json!({
                        "kind": kind,
                        "paths": paths,
                    }),
                );
            }
            Err(_) => {}
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(std::path::Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    let mut w = state.watcher.lock().map_err(|e| e.to_string())?;
    *w = Some(watcher);

    Ok(())
}

#[tauri::command]
pub async fn stop_watcher(state: State<'_, WatcherState>) -> Result<(), String> {
    let mut w = state.watcher.lock().map_err(|e| e.to_string())?;
    *w = None;
    Ok(())
}
