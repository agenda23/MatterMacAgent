use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Action {
    #[serde(rename = "shortcut")]
    Shortcut { name: String, input: String },
    #[serde(rename = "open")]
    Open { target: String },
    #[serde(rename = "shell")]
    Shell { command: String },
    #[serde(rename = "applescript")]
    AppleScript { script: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Macro {
    pub id: String,
    pub name: String,
    pub on_actions: Vec<Action>,
    pub off_actions: Vec<Action>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndpointConfig {
    pub id: u8,
    pub name: String,
    pub matter_type: String,
    pub assigned_macro_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfig {
    pub developer_mode: bool,
    pub auto_start: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub system: SystemConfig,
    pub endpoints: Vec<EndpointConfig>,
    pub macros: Vec<Macro>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairingInfo {
    pub qr_payload: String,
    pub manual_code: String,
    pub discriminator: u16,
    pub pin: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionStatus {
    pub accessibility: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            system: SystemConfig {
                developer_mode: false,
                auto_start: true,
            },
            endpoints: (1..=10)
                .map(|id| EndpointConfig {
                    id,
                    name: format!("仮想スイッチ {id}"),
                    matter_type: "OnOffPluginUnitDevice".to_string(),
                    assigned_macro_id: None,
                })
                .collect(),
            macros: vec![],
        }
    }
}

pub fn config_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("config.json")
}

pub fn load_or_create(path: &PathBuf) -> Result<Config, String> {
    if path.exists() {
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        let config = Config::default();
        save(path, &config)?;
        Ok(config)
    }
}

pub fn save(path: &PathBuf, config: &Config) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}
