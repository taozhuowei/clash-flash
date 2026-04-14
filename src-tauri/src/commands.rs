use crate::db::Subscription;
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
pub fn get_subscriptions() -> Result<Vec<Subscription>, String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, url, is_default, created_at, updated_at FROM subscriptions")
        .map_err(|e| e.to_string())?;

    let subs = stmt
        .query_map([], |row| {
            Ok(Subscription {
                id: row.get(0)?,
                name: row.get(1)?,
                url: row.get(2)?,
                is_default: row.get::<_, i32>(3)? == 1,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
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

    conn.execute(
        "INSERT INTO subscriptions (name, url) VALUES (?1, ?2)",
        params![name, url],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Subscription {
        id,
        name,
        url,
        is_default: false,
        created_at: chrono_now(),
        updated_at: chrono_now(),
    })
}

#[tauri::command]
pub fn delete_subscription(id: i64) -> Result<(), String> {
    let db = DB.get().ok_or("Database not initialized")?;
    let conn = db.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM subscriptions WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

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

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_secs())
}
