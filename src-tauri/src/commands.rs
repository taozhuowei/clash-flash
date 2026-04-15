use crate::db::{self, Subscription};
use crate::subscription::{self, SubscriptionInfo};
use crate::DB;
use rusqlite::params;

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
