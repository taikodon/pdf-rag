#[tauri::command]
fn get_default_open_path() -> String {
    // WSL2 上で動作している場合は Windows のユーザーフォルダを返す
    if std::env::var("WSL_DISTRO_NAME").is_ok() {
        if let Ok(entries) = std::fs::read_dir("/mnt/c/Users") {
            let skip = ["Public", "Default", "Default User", "All Users"];
            let user_dirs: Vec<String> = entries
                .filter_map(|e| e.ok())
                .filter(|e| {
                    e.file_type().map(|t| t.is_dir()).unwrap_or(false)
                        && !skip.contains(&e.file_name().to_string_lossy().as_ref())
                })
                .map(|e| e.path().to_string_lossy().to_string())
                .collect();
            if user_dirs.len() == 1 {
                return format!("{}/Desktop", user_dirs[0]);
            }
            if !user_dirs.is_empty() {
                return "/mnt/c/Users".to_string();
            }
        }
    }
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_default_open_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
