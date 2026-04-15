use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subscription {
    pub id: i64,
    pub name: String,
    pub url: String,
    pub is_default: bool,
    pub traffic_used: f64,
    pub traffic_total: f64,
    pub expire_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: i64,
    pub level: String,
    pub message: String,
    pub created_at: String,
}

const DB_VERSION: i32 = 2;

pub fn init_tables(conn: &Connection) -> Result<()> {
    let current_version = get_db_version(conn);

    if current_version < 1 {
        create_v1_tables(conn)?;
    }

    if current_version < 2 {
        migrate_v1_to_v2(conn)?;
    }

    set_db_version(conn, DB_VERSION)?;

    init_default_configs(conn)?;

    Ok(())
}

fn get_db_version(conn: &Connection) -> i32 {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS db_meta (key TEXT PRIMARY KEY, value TEXT)",
        [],
    )
    .ok();

    conn.query_row(
        "SELECT value FROM db_meta WHERE key = 'version'",
        [],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|v| v.parse().ok())
    .unwrap_or(0)
}

fn set_db_version(conn: &Connection, version: i32) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO db_meta (key, value) VALUES ('version', ?1)",
        [version.to_string()],
    )?;
    Ok(())
}

fn create_v1_tables(conn: &Connection) -> Result<()> {
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

    Ok(())
}

fn migrate_v1_to_v2(conn: &Connection) -> Result<()> {
    let has_traffic = conn
        .prepare("SELECT traffic_used FROM subscriptions LIMIT 1")
        .is_ok();

    if !has_traffic {
        conn.execute(
            "ALTER TABLE subscriptions ADD COLUMN traffic_used REAL DEFAULT 0",
            [],
        )?;
        conn.execute(
            "ALTER TABLE subscriptions ADD COLUMN traffic_total REAL DEFAULT 0",
            [],
        )?;
        conn.execute(
            "ALTER TABLE subscriptions ADD COLUMN expire_date TEXT",
            [],
        )?;
    }

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
        ("clash_core_path", ""),
        ("clash_config_path", ""),
    ];

    for (key, value) in defaults {
        conn.execute(
            "INSERT OR IGNORE INTO configs (key, value) VALUES (?1, ?2)",
            [key, value],
        )?;
    }

    Ok(())
}

pub fn add_log(conn: &Connection, level: &str, message: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO logs (level, message) VALUES (?1, ?2)",
        [level, message],
    )?;
    Ok(())
}

pub fn get_recent_logs(conn: &Connection, limit: i64) -> Result<Vec<LogEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, level, message, created_at FROM logs ORDER BY id DESC LIMIT ?1",
    )?;

    let logs = stmt
        .query_map([limit], |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                level: row.get(1)?,
                message: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(logs)
}
