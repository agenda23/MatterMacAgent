mod config;
mod sidecar;
mod state;
mod tray;

use config::{config_path, load_or_create, save, Config, PairingInfo, PermissionStatus};
use state::AppState;
use tauri::{Manager, RunEvent, State, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

#[tauri::command]
fn get_config(state: State<'_, AppState>) -> Result<Config, String> {
    Ok(state.config.lock().unwrap().clone())
}

#[tauri::command]
async fn save_config(
    config: Config,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let path = config_path(
        &app.path()
            .app_data_dir()
            .map_err(|e| e.to_string())?,
    );
    save(&path, &config)?;

    *state.config.lock().unwrap() = config.clone();

    {
        let mut child_guard = state.sidecar_child.lock().unwrap();
        if let Some(ref mut child) = *child_guard {
            sidecar::send_config_update(child, &config)?;
        }
    }

    sync_autostart(&app, config.system.auto_start).await?;

    Ok(())
}

#[tauri::command]
fn get_pairing_info(state: State<'_, AppState>) -> Result<Option<PairingInfo>, String> {
    Ok(state.pairing_info.lock().unwrap().clone())
}

#[tauri::command]
fn get_commissioning_status(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(*state.commissioned.lock().unwrap())
}

#[tauri::command]
fn get_sidecar_status(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(*state.sidecar_online.lock().unwrap())
}

#[tauri::command]
fn get_permissions() -> PermissionStatus {
    PermissionStatus {
        accessibility: check_accessibility(),
    }
}

#[tauri::command]
fn open_accessibility_settings() -> Result<(), String> {
    std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn show_dashboard(app: tauri::AppHandle) {
    tray::show_dashboard(&app);
}

#[cfg(target_os = "macos")]
fn check_accessibility() -> bool {
    unsafe { accessibility_sys::AXIsProcessTrusted() }
}

#[cfg(not(target_os = "macos"))]
fn check_accessibility() -> bool {
    false
}

async fn sync_autostart(app: &tauri::AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;

    let autostart = app.autolaunch();
    if enabled {
        autostart.enable().map_err(|e| e.to_string())?;
    } else {
        autostart.disable().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn should_start_hidden() -> bool {
    std::env::args().any(|arg| arg == "--minimized")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let path = config_path(&app_data_dir);
            let config = load_or_create(&path)?;

            let auto_start = config.system.auto_start;
            app.manage(AppState::new(config));

            tray::setup_tray(app).map_err(|e| e.to_string())?;

            sidecar::spawn_sidecar(&app.handle())?;

            if should_start_hidden() {
                tray::hide_dashboard(&app.handle());
            } else {
                tray::show_dashboard(&app.handle());
            }

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = sync_autostart(&app_handle, auto_start).await;
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            get_pairing_info,
            get_commissioning_status,
            get_sidecar_status,
            get_permissions,
            open_accessibility_settings,
            show_dashboard,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                let state = app_handle.state::<AppState>();
                sidecar::shutdown_sidecar(&state);
            }
        });
}
