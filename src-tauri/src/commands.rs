use crate::clash::{self, ClashProcess};
use crate::clash_api::{self, ClashApiClient, ProxyItem, ProxiesResponse};
use crate::db::{self, Subscription};
use crate::subscription::{self, SubscriptionInfo};
use crate::DB;
use once_cell::sync::OnceCell;
use rusqlite::params;
use std::sync::Mutex;

pub static CLASH_PROCESS: OnceCell<Mutex<ClashProcess>> = OnceCell::new();

fn get_clash_api() -> ClashApiClient {
    ClashApiClient::new(9090, "clash-flash")
}

#[tauri::command]
pub fn get_config(key: String) -> Result<Option<String>, String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT value FROM configs WHERE key = ?1")
        .map_err(|e| e.to_string())?;

    let result = stmt
        .query_row([&key], |row| row.get::<_, String>(0))
        .ok();

    Ok(result)
}

#[tauri::command]
pub fn set_config(key: String, value: String) -> Result<(), String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO configs (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_all_configs() -> Result<std::collections::HashMap<String, String>, String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT key, value FROM configs")
        .map_err(|e| e.to_string())?;

    let configs: std::collections::HashMap<String, String> = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(configs)
}

#[tauri::command]
pub fn get_subscriptions() -> Result<Vec<Subscription>, String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, url, is_default, traffic_used, traffic_total, expire_date, created_at, updated_at FROM subscriptions ORDER BY is_default DESC, updated_at DESC")
        .map_err(|e| e.to_string())?;

    let subs = stmt
        .query_map([], |row| {
            Ok(Subscription {
                id: row.get(0)?,
                name: row.get(1)?,
                url: row.get(2)?,
                is_default: row.get::<_, i32>(3)? == 1,
                traffic_used: row.get(4)?,
                traffic_total: row.get(5)?,
                expire_date: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(subs)
}

#[tauri::command]
pub fn add_subscription(name: String, url: String) -> Result<Subscription, String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let is_first = {
        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM subscriptions")
            .map_err(|e| e.to_string())?;
        let count: i64 = stmt.query_row([], |row| row.get(0)).map_err(|e| e.to_string())?;
        count == 0
    };

    let is_default = if is_first { 1 } else { 0 };

    conn.execute(
        "INSERT INTO subscriptions (name, url, is_default) VALUES (?1, ?2, ?3)",
        params![name, url, is_default],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    db::add_log(&conn, "info", &format!("Added subscription: {}", name)).ok();

    Ok(Subscription {
        id,
        name,
        url,
        is_default: is_default == 1,
        traffic_used: 0.0,
        traffic_total: 0.0,
        expire_date: None,
        created_at: String::new(),
        updated_at: String::new(),
    })
}

#[tauri::command]
pub fn update_subscription(id: i64) -> Result<SubscriptionInfo, String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT url FROM subscriptions WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let url: String = stmt
        .query_row([id], |row| row.get(0))
        .map_err(|e| format!("Subscription not found: {}", e))?;

    drop(stmt);

    let info = subscription::download_subscription(&url)?;

    conn.execute(
        "UPDATE subscriptions SET traffic_used = ?1, traffic_total = ?2, expire_date = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4",
        params![info.traffic_used, info.traffic_total, info.expire_date, id],
    )
    .map_err(|e| e.to_string())?;

    db::add_log(&conn, "info", &format!("Updated subscription id={}", id)).ok();

    Ok(info)
}

#[tauri::command]
pub fn delete_subscription(id: i64) -> Result<(), String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM subscriptions WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    db::add_log(&conn, "info", &format!("Deleted subscription id={}", id)).ok();

    Ok(())
}

#[tauri::command]
pub fn set_default_subscription(id: i64) -> Result<(), String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute("UPDATE subscriptions SET is_default = 0", [])
        .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE subscriptions SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
        [id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_logs(limit: Option<i64>) -> Result<Vec<db::LogEntry>, String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let limit = limit.unwrap_or(100);
    db::get_recent_logs(&conn, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn complete_onboarding() -> Result<(), String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO configs (key, value, updated_at) VALUES ('is_first_launch', 'false', CURRENT_TIMESTAMP)",
        [],
    )
    .map_err(|e| e.to_string())?;

    db::add_log(&conn, "info", "Onboarding completed").ok();

    Ok(())
}

#[tauri::command]
pub fn download_clash_core() -> Result<String, String> {
    let path = clash::download_clash_binary()?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn check_clash_core() -> Result<bool, String> {
    Ok(clash::is_clash_binary_exists())
}

#[tauri::command]
pub fn start_clash() -> Result<(), String> {
    let clash_proc = CLASH_PROCESS
        .get()
        .ok_or("Clash process not initialized")?;
    let mut proc = clash_proc.lock().map_err(|e| e.to_string())?;

    if proc.is_running() {
        return Ok(());
    }

    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT url FROM subscriptions WHERE is_default = 1 LIMIT 1")
        .map_err(|e| e.to_string())?;

    let url: String = stmt
        .query_row([], |row| row.get(0))
        .map_err(|e| format!("No default subscription: {}", e))?;

    drop(stmt);

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("ClashFlash/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(&url)
        .send()
        .map_err(|e| format!("Failed to download subscription: {}", e))?;

    let content = response
        .text()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let proxy_port: u16 = conn
        .query_row(
            "SELECT value FROM configs WHERE key = 'proxy_port'",
            [],
            |row| row.get::<_, String>(0),
        )
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(7890);

    let mixed_port: u16 = conn
        .query_row(
            "SELECT value FROM configs WHERE key = 'mixed_port'",
            [],
            |row| row.get::<_, String>(0),
        )
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(7891);

    let allow_lan: bool = conn
        .query_row(
            "SELECT value FROM configs WHERE key = 'allow_lan'",
            [],
            |row| row.get::<_, String>(0),
        )
        .ok()
        .map(|v| v == "true")
        .unwrap_or(false);

    let tun_enabled: bool = conn
        .query_row(
            "SELECT value FROM configs WHERE key = 'tun_enabled'",
            [],
            |row| row.get::<_, String>(0),
        )
        .ok()
        .map(|v| v == "true")
        .unwrap_or(true);

    let config_content = clash::generate_clash_config(
        proxy_port,
        mixed_port,
        allow_lan,
        tun_enabled,
        &content,
    )?;

    let config_dir = clash::get_config_dir()?;
    let config_path = config_dir.join("clash_flash_config.yaml");

    std::fs::write(&config_path, &config_content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    proc.start(&config_path.to_string_lossy())?;

    db::add_log(&conn, "info", "Clash core started").ok();

    Ok(())
}

#[tauri::command]
pub fn stop_clash() -> Result<(), String> {
    let clash_proc = CLASH_PROCESS
        .get()
        .ok_or("Clash process not initialized")?;
    let mut proc = clash_proc.lock().map_err(|e| e.to_string())?;

    proc.stop()?;

    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;
    db::add_log(&conn, "info", "Clash core stopped").ok();

    Ok(())
}

#[tauri::command]
pub fn restart_clash() -> Result<(), String> {
    stop_clash()?;
    std::thread::sleep(std::time::Duration::from_millis(500));
    start_clash()
}

#[derive(serde::Serialize)]
pub struct ClashStatusResponse {
    pub is_running: bool,
    pub is_tun_enabled: bool,
}

#[tauri::command]
pub fn get_clash_status() -> Result<ClashStatusResponse, String> {
    let api = get_clash_api();
    Ok(ClashStatusResponse {
        is_running: api.is_running(),
        is_tun_enabled: false,
    })
}

#[tauri::command]
pub fn get_clash_proxies() -> Result<ProxiesResponse, String> {
    let api = get_clash_api();
    api.get_proxies()
}

#[tauri::command]
pub fn switch_clash_proxy(group: String, name: String) -> Result<(), String> {
    let api = get_clash_api();
    api.switch_proxy(&group, &name)
}

#[tauri::command]
pub fn test_proxy_delay(name: String) -> Result<i64, String> {
    let api = get_clash_api();
    api.get_delay(&name, "http://www.gstatic.com/generate_204", 5000)
}
