use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub path: String,
    pub line: usize,
    pub column: usize,
    pub text: String,
}

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

fn is_binary_ext(name: &str) -> bool {
    matches!(
        name.rsplit('.').next().unwrap_or(""),
        "png" | "jpg" | "jpeg" | "gif" | "ico" | "svg" | "woff" | "woff2" | "ttf" | "eot"
            | "zip" | "tar" | "gz" | "lock" | "wasm" | "exe" | "dll" | "so" | "dylib"
            | "mp3" | "mp4" | "webp" | "pdf"
    )
}

/// Read a single directory level (lazy loading)
fn read_dir_single(path: &Path) -> Result<Vec<FileNode>, String> {
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut nodes: Vec<FileNode> = Vec::new();

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if should_skip(&name) {
            continue;
        }
        let entry_path = entry.path();
        let is_dir = entry_path.is_dir();
        nodes.push(FileNode {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
            children: None, // No pre-loading — will be loaded on expand
        });
    }

    // Directories first, then alphabetical
    nodes.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(nodes)
}

/// Read full tree recursively (with depth limit, for search/export)
fn read_tree_recursive(path: &Path, depth: usize, max_depth: usize) -> Result<Vec<FileNode>, String> {
    if depth > max_depth {
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
            Some(read_tree_recursive(&entry_path, depth + 1, max_depth)?)
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

/// Read only the top-level contents of a directory (lazy loading)
#[tauri::command]
pub async fn read_project_tree(path: String) -> Result<Vec<FileNode>, String> {
    let path = Path::new(&path);
    if !path.is_dir() {
        return Err("Not a directory".to_string());
    }
    read_dir_single(path)
}

/// Read children of a specific directory (used when expanding a folder)
#[tauri::command]
pub async fn read_dir_children(path: String) -> Result<Vec<FileNode>, String> {
    let path = Path::new(&path);
    if !path.is_dir() {
        return Err("Not a directory".to_string());
    }
    read_dir_single(path)
}

/// Read full tree recursively (for search or export)
#[tauri::command]
pub async fn read_project_tree_full(path: String) -> Result<Vec<FileNode>, String> {
    let path = Path::new(&path);
    if !path.is_dir() {
        return Err("Not a directory".to_string());
    }
    read_tree_recursive(path, 0, 4)
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

/// Search for a text pattern across all project files
#[tauri::command]
pub async fn search_files(path: String, query: String) -> Result<Vec<SearchResult>, String> {
    if query.is_empty() {
        return Ok(vec![]);
    }
    let root = Path::new(&path);
    if !root.is_dir() {
        return Err("Not a directory".to_string());
    }
    let query_lower = query.to_lowercase();
    let mut results: Vec<SearchResult> = Vec::new();
    let max_results = 100;

    fn walk(dir: &Path, query_lower: &str, results: &mut Vec<SearchResult>, max: usize) {
        if results.len() >= max { return; }
        let Ok(entries) = fs::read_dir(dir) else { return };
        for entry in entries.flatten() {
            if results.len() >= max { return; }
            let name = entry.file_name().to_string_lossy().to_string();
            if should_skip(&name) || is_binary_ext(&name) { continue; }
            let entry_path = entry.path();
            if entry_path.is_dir() {
                walk(&entry_path, query_lower, results, max);
            } else {
                let Ok(content) = fs::read_to_string(&entry_path) else { continue };
                for (i, line) in content.lines().enumerate() {
                    if results.len() >= max { return; }
                    if line.to_lowercase().contains(query_lower) {
                        let col = line.to_lowercase().find(query_lower).unwrap_or(0);
                        results.push(SearchResult {
                            path: entry_path.to_string_lossy().to_string(),
                            line: i + 1,
                            column: col + 1,
                            text: line.trim().chars().take(200).collect(),
                        });
                    }
                }
            }
        }
    }

    walk(root, &query_lower, &mut results, max_results);
    Ok(results)
}
