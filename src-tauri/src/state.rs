use crate::config::{Config, PairingInfo};
use std::sync::Mutex;
use tauri_plugin_shell::process::CommandChild;

pub struct AppState {
    pub config: Mutex<Config>,
    pub pairing_info: Mutex<Option<PairingInfo>>,
    pub sidecar_online: Mutex<bool>,
    pub sidecar_child: Mutex<Option<CommandChild>>,
}

impl AppState {
    pub fn new(config: Config) -> Self {
        Self {
            config: Mutex::new(config),
            pairing_info: Mutex::new(None),
            sidecar_online: Mutex::new(false),
            sidecar_child: Mutex::new(None),
        }
    }
}
