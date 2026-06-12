use crate::config::{Config, PairingInfo};
use crate::state::AppState;
use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

pub fn spawn_sidecar(app: &AppHandle) -> Result<(), String> {
    let matter_storage = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("matter");

    std::fs::create_dir_all(&matter_storage).map_err(|e| e.to_string())?;

    let sidecar = app
        .shell()
        .sidecar("matter-sidecar")
        .map_err(|e| e.to_string())?
        .env("MATTER_PATH_ROOT", matter_storage.to_string_lossy().to_string());

    let (mut rx, child) = sidecar.spawn().map_err(|e| e.to_string())?;

    {
        let state = app.state::<AppState>();
        *state.sidecar_child.lock().unwrap() = Some(child);
    }

    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    dispatch_sidecar_message(&app_handle, &line);
                }
                CommandEvent::Terminated(_) => {
                    let state = app_handle.state::<AppState>();
                    *state.sidecar_online.lock().unwrap() = false;
                    let _ = app_handle.emit("sidecar-offline", ());
                }
                _ => {}
            }
        }
    });

    Ok(())
}

pub fn send_config_update(child: &mut CommandChild, config: &Config) -> Result<(), String> {
    let payload = serde_json::json!({
        "endpoints": config.endpoints,
        "macros": config.macros,
        "developer_mode": config.system.developer_mode,
    });
    send_to_sidecar(child, "config_update", payload)
}

pub fn send_shutdown(child: &mut CommandChild) -> Result<(), String> {
    send_to_sidecar(child, "shutdown", serde_json::json!({}))
}

fn send_to_sidecar(child: &mut CommandChild, msg_type: &str, payload: Value) -> Result<(), String> {
    let msg = serde_json::json!({ "type": msg_type, "payload": payload });
    let line = msg.to_string() + "\n";
    child.write(line.as_bytes()).map_err(|e| e.to_string())
}

fn dispatch_sidecar_message(app: &AppHandle, line: &[u8]) {
    let msg: Value = match serde_json::from_slice(line) {
        Ok(v) => v,
        Err(_) => return,
    };

    let msg_type = msg.get("type").and_then(|v| v.as_str());
    let payload = msg.get("payload").cloned().unwrap_or(Value::Null);

    match msg_type {
        Some("ready") => {
            let state = app.state::<AppState>();
            *state.sidecar_online.lock().unwrap() = true;

            if let Some(commissioned) = payload.get("commissioned").and_then(|v| v.as_bool()) {
                *state.commissioned.lock().unwrap() = commissioned;
            }

            let config = state.config.lock().unwrap().clone();
            let mut child_guard = state.sidecar_child.lock().unwrap();
            if let Some(ref mut child) = *child_guard {
                let _ = send_config_update(child, &config);
            }
        }
        Some("qr_code") => {
            let pairing = PairingInfo {
                qr_payload: payload
                    .get("qr_payload")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .to_string(),
                manual_code: payload
                    .get("manual_code")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .to_string(),
                discriminator: payload
                    .get("discriminator")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0) as u16,
                pin: payload
                    .get("pin")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0) as u32,
            };
            let state = app.state::<AppState>();
            *state.pairing_info.lock().unwrap() = Some(pairing);
        }
        Some("device_status") => {
            let _ = app.emit("device-status-changed", payload);
        }
        Some("action_result") => {
            let success = payload
                .get("success")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            if !success {
                let endpoint_id = payload
                    .get("endpoint_id")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0);
                let error = payload
                    .get("error")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Unknown error")
                    .to_string();
                let _ = app.emit(
                    "action-error",
                    serde_json::json!({ "endpoint_id": endpoint_id, "error": error }),
                );
            }
        }
        _ => {}
    }
}

pub fn shutdown_sidecar(state: &AppState) {
    if let Some(mut child) = state.sidecar_child.lock().unwrap().take() {
        let _ = send_shutdown(&mut child);
    }
}
