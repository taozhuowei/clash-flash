use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Subscription {
    pub id: i64,
    pub name: String,
    pub url: String,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
}

pub fn init_tables(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS configs (
            id INTEGER PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    init_default_configs(conn)?;

    Ok(())
}

fn init_default_configs(conn: &Connection) -> Result<()> {
    let defaults = vec![
        ("theme", "light"),
        ("auto_start", "false"),
        ("auto_system_proxy", "true"),
        ("minimize_to_tray", "true"),
        ("proxy_port", "7890"),
        ("mixed_port", "7891"),
        ("allow_lan", "false"),
        ("is_first_launch", "true"),
    ];

    for (key, value) in defaults {
        conn.execute(
            "INSERT OR IGNORE INTO configs (key, value) VALUES (?1, ?2)",
            [key, value],
        )?;
    }

    Ok(())
}

pub fn get_subscription_by_id(conn: &Connection, id: i64) -> Result<Option<Subscription>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, is_default, created_at, updated_at FROM subscriptions WHERE id = ?1"
    )?;

    let sub = stmt.query_row([id], |row| {
        Ok(Subscription {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            is_default: row.get::<_, i32>(3)? == 1,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    }).ok();

    Ok(sub)
}
