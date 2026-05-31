use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::State;
use std::sync::Mutex;

pub struct GitState {
    pub project_path: Mutex<Option<String>>,
}

#[derive(Serialize, Clone)]
pub struct GitStatus {
    branch: String,
    staged: u32,
    unstaged: u32,
    untracked: u32,
    ahead: u32,
    behind: u32,
}

fn git_cmd(project_path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("git command failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Not a git repo is a common non-error case
        if stderr.contains("not a git repository") {
            return Err("not a git repo".to_string());
        }
        return Err(format!("git error: {}", stderr.trim()));
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim_end().to_string())
}

#[tauri::command]
pub async fn git_status(
    state: State<'_, GitState>,
) -> Result<GitStatus, String> {
    let path = state.project_path.lock().map_err(|e| e.to_string())?;
    let project_path = path.as_deref().ok_or("No project open")?;

    // Get branch
    let branch = git_cmd(project_path, &["rev-parse", "--abbrev-ref", "HEAD"])
        .unwrap_or_else(|_| "NO BRANCH".to_string());

    // Get porcelain status
    let status_output = git_cmd(project_path, &["status", "--porcelain=v1"])?;

    let mut staged = 0u32;
    let mut unstaged = 0u32;
    let mut untracked = 0u32;

    for line in status_output.lines() {
        let line = line.trim();
        if line.len() < 3 { continue; }
        let x = line.as_bytes()[0];
        let y = line.as_bytes()[1];

        // Staged: index has changes (M, A, D, R, C in X)
        match x {
            b'M' | b'A' | b'D' | b'R' | b'C' => staged += 1,
            _ => {}
        }

        // Unstaged: working tree has changes (M, D in Y, but not ?)
        match y {
            b'M' | b'D' => unstaged += 1,
            _ => {}
        }

        // Untracked
        if x == b'?' && y == b'?' {
            untracked += 1;
        }
    }

    // Ahead/behind
    let (ahead, behind) = if branch != "NO BRANCH" && !branch.starts_with("(") {
        let ab_output = git_cmd(
            project_path,
            &["rev-list", "--left-right", "--count", &format!("{}...@{{u}}", branch)],
        );
        match ab_output {
            Ok(s) => {
                let parts: Vec<&str> = s.split_whitespace().collect();
                let a = parts.first().and_then(|v| v.parse().ok()).unwrap_or(0);
                let b = parts.get(1).and_then(|v| v.parse().ok()).unwrap_or(0);
                (a, b)
            }
            Err(_) => (0, 0),
        }
    } else {
        (0, 0)
    };

    Ok(GitStatus {
        branch,
        staged,
        unstaged,
        untracked,
        ahead,
        behind,
    })
}

#[tauri::command]
pub async fn git_commit(
    state: State<'_, GitState>,
    message: String,
) -> Result<String, String> {
    let path = state.project_path.lock().map_err(|e| e.to_string())?;
    let project_path = path.as_deref().ok_or("No project open")?;

    // Stage all changes
    git_cmd(project_path, &["add", "-A"])?;

    // Commit
    let output = git_cmd(project_path, &["commit", "-m", &message])?;
    Ok(output)
}

#[tauri::command]
pub async fn git_set_project(
    state: State<'_, GitState>,
    project_path: String,
) -> Result<(), String> {
    let mut path = state.project_path.lock().map_err(|e| e.to_string())?;
    *path = Some(project_path);
    Ok(())
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DiffFile {
    pub path: String,
    pub status: String, // "M" modified, "A" added, "D" deleted, "?" untracked
    pub added: u32,
    pub deleted: u32,
}

#[tauri::command]
pub async fn git_diff_summary(
    state: State<'_, GitState>,
) -> Result<Vec<DiffFile>, String> {
    let path = state.project_path.lock().map_err(|e| e.to_string())?;
    let project_path = path.as_deref().ok_or("No project open")?;

    let output = git_cmd(project_path, &["status", "--porcelain=v1"])?;

    // Get line-level stats for tracked files via numstat
    let numstat = git_cmd(project_path, &["diff", "--numstat", "HEAD"]).unwrap_or_default();
    let mut stats_map: std::collections::HashMap<String, (u32, u32)> = std::collections::HashMap::new();
    for line in numstat.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 3 {
            let added: u32 = if parts[0] == "-" { 0 } else { parts[0].parse().unwrap_or(0) };
            let deleted: u32 = if parts[1] == "-" { 0 } else { parts[1].parse().unwrap_or(0) };
            stats_map.insert(parts[2].to_string(), (added, deleted));
        }
    }

    let mut files = Vec::new();

    for line in output.lines() {
        let line = line.trim_end();
        if line.len() < 4 { continue; }
        let x = line.as_bytes()[0] as char;
        let y = line.as_bytes()[1] as char;
        let file_path = &line[3..];

        if file_path.ends_with('/') { continue; }

        let status = if x == '?' && y == '?' {
            "?".to_string()
        } else if x == 'A' {
            "A".to_string()
        } else if x == 'D' || y == 'D' {
            "D".to_string()
        } else {
            "M".to_string()
        };

        let (added, deleted) = if status == "?" {
            // Untracked: all lines are "added"
            let full = format!("{}/{}", project_path, file_path);
            let lines = std::fs::read_to_string(&full).map(|s| s.lines().count() as u32).unwrap_or(0);
            (lines, 0)
        } else {
            stats_map.get(file_path).copied().unwrap_or((0, 0))
        };

        files.push(DiffFile { path: file_path.to_string(), status, added, deleted });
    }

    Ok(files)
}

#[derive(Serialize, Clone)]
pub struct FileDiff {
    pub original: String,
    pub modified: String,
}

#[tauri::command]
pub async fn git_diff_file(
    state: State<'_, GitState>,
    file_path: String,
) -> Result<Option<FileDiff>, String> {
    let path = state.project_path.lock().map_err(|e| e.to_string())?;
    let project_path = path.as_deref().ok_or("No project open")?;

    let full_path = format!("{}/{}", project_path, file_path);

    let original = git_cmd(project_path, &["show", &format!("HEAD:{}", file_path)])
        .unwrap_or_default();

    let modified = std::fs::read_to_string(&full_path).unwrap_or_default();

    if original == modified { return Ok(None); }

    Ok(Some(FileDiff { original, modified }))
}
