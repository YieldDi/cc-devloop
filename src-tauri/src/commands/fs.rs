use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
}

fn should_skip(name: &str) -> bool {
    matches!(
        name,
        "node_modules"
            | ".git"
            | "target"
            | "__pycache__"
            | ".next"
            | "dist"
            | "build"
            | ".DS_Store"
    )
}

fn read_tree(path: &Path, depth: usize) -> Result<Vec<FileNode>, String> {
    if depth > 8 {
        return Ok(vec![]);
    }
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut nodes: Vec<FileNode> = Vec::new();

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if should_skip(&name) {
            continue;
        }
        let entry_path = entry.path();
        let is_dir = entry_path.is_dir();
        let children = if is_dir {
            Some(read_tree(&entry_path, depth + 1)?)
        } else {
            None
        };
        nodes.push(FileNode {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
            children,
        });
    }

    nodes.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(nodes)
}

#[tauri::command]
pub async fn read_project_tree(path: String) -> Result<Vec<FileNode>, String> {
    let path = Path::new(&path);
    if !path.is_dir() {
        return Err("Not a directory".to_string());
    }
    read_tree(path, 0)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write {}: {}", path, e))
}

#[tauri::command]
pub async fn select_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dir = app
        .dialog()
        .file()
        .blocking_pick_folder();
    Ok(dir.map(|p| p.to_string()))
}
