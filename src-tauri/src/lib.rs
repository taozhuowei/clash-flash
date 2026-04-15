use once_cell::sync::OnceCell;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

mod db;
mod commands;
mod subscription;
mod clash;
mod clash_api;

pub static DB: OnceCell<Mutex<Connection>> = OnceCell::new();

fn init_database() -> Result<(), String> {
    let app_dir = dirs::data_local_dir()
        .ok_or("Failed to get app data directory")?
        .join("clash-flash");

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;

    let db_path = app_dir.join("clash_flash.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    db::init_tables(&conn).map_err(|e| format!("Failed to init tables: {}", e))?;

    DB.set(Mutex::new(conn))
        .map_err(|_| "Database already initialized".to_string())?;

    Ok(())
}

fn init_clash_process() -> Result<(), String> {
    use clash::ClashProcess;

    let clash_proc = ClashProcess::new(9090, "clash-flash".to_string());
    commands::CLASH_PROCESS
        .set(Mutex::new(clash_proc))
        .map_err(|_| "Clash process already initialized".to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();

    if let Err(e) = init_database() {
        eprintln!("Database initialization failed: {}", e);
    }

    if let Err(e) = init_clash_process() {
        eprintln!("Clash process initialization failed: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::set_config,
            commands::get_all_configs,
            commands::get_subscriptions,
            commands::add_subscription,
            commands::update_subscription,
            commands::delete_subscription,
            commands::set_default_subscription,
            commands::get_logs,
            commands::complete_onboarding,
            commands::download_clash_core,
            commands::check_clash_core,
            commands::start_clash,
            commands::stop_clash,
            commands::restart_clash,
            commands::get_clash_status,
            commands::get_clash_proxies,
            commands::switch_clash_proxy,
            commands::test_proxy_delay,
            commands::get_clash_traffic,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
                use tauri::menu::{Menu, MenuItem};

                let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
                let show = MenuItem::with_id(app, "show", "打开主窗口", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show, &quit])?;

                let _tray = TrayIconBuilder::new()
                    .menu(&menu)
                    .tooltip("Clash Flash")
                    .on_menu_event(|app, event| {
                        match event.id.as_ref() {
                            "quit" => {
                                app.exit(0);
                            }
                            "show" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                            _ => {}
                        }
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
