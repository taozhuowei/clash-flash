use reqwest::blocking::Client;
use std::fs;
use std::path::PathBuf;
use std::process::{Child, Command};

const MIHOMO_VERSION: &str = "1.19.0";
const MIHOMO_BASE_URL: &str = "https://github.com/MetaCubeX/mihomo/releases/download";

pub fn get_clash_dir() -> Result<PathBuf, String> {
    let app_dir = dirs::data_local_dir()
        .ok_or("Failed to get app data directory")?
        .join("clash-flash")
        .join("core");

    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create core directory: {}", e))?;

    Ok(app_dir)
}

pub fn get_clash_binary_path() -> Result<PathBuf, String> {
    let dir = get_clash_dir()?;
    let binary_name = if cfg!(windows) {
        "mihomo-windows-amd64.exe"
    } else if cfg!(target_os = "macos") {
        "mihomo-darwin-amd64"
    } else {
        "mihomo-linux-amd64"
    };
    Ok(dir.join(binary_name))
}

pub fn get_config_dir() -> Result<PathBuf, String> {
    let dir = dirs::data_local_dir()
        .ok_or("Failed to get app data directory")?
        .join("clash-flash")
        .join("configs");

    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(dir)
}

pub fn is_clash_binary_exists() -> bool {
    get_clash_binary_path()
        .map(|p| p.exists())
        .unwrap_or(false)
}

pub fn download_clash_binary() -> Result<PathBuf, String> {
    let binary_path = get_clash_binary_path()?;

    if binary_path.exists() {
        return Ok(binary_path);
    }

    let dir = get_clash_dir()?;
    let archive_name = if cfg!(windows) {
        format!("mihomo-windows-amd64-{}.zip", MIHOMO_VERSION)
    } else if cfg!(target_os = "macos") {
        format!("mihomo-darwin-amd64-{}.gz", MIHOMO_VERSION)
    } else {
        format!("mihomo-linux-amd64-{}.gz", MIHOMO_VERSION)
    };

    let url = format!("{}/v{}/{}", MIHOMO_BASE_URL, MIHOMO_VERSION, archive_name);
    let archive_path = dir.join(&archive_name);

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(&url)
        .send()
        .map_err(|e| format!("Failed to download mihomo: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Download failed with status: {}",
            response.status()
        ));
    }

    let bytes = response
        .bytes()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    fs::write(&archive_path, &bytes)
        .map_err(|e| format!("Failed to write archive: {}", e))?;

    extract_archive(&archive_path, &dir, &binary_path)?;

    fs::remove_file(&archive_path).ok();

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&binary_path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("Failed to set permissions: {}", e))?;
    }

    Ok(binary_path)
}

#[cfg(windows)]
fn extract_archive(archive_path: &PathBuf, dest_dir: &PathBuf, _binary_path: &PathBuf) -> Result<(), String> {
    extract_zip(archive_path, dest_dir)
}

#[cfg(not(windows))]
fn extract_archive(archive_path: &PathBuf, _dest_dir: &PathBuf, binary_path: &PathBuf) -> Result<(), String> {
    extract_gz(archive_path, binary_path)
}

#[cfg(windows)]
fn extract_zip(archive_path: &PathBuf, dest_dir: &PathBuf) -> Result<(), String> {
    let output = Command::new("powershell")
        .args([
            "-Command",
            &format!(
                "Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
                archive_path.display(),
                dest_dir.display()
            ),
        ])
        .output()
        .map_err(|e| format!("Failed to extract zip: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Failed to extract: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}

#[cfg(not(windows))]
fn extract_gz(archive_path: &PathBuf, dest_path: &PathBuf) -> Result<(), String> {
    let output = Command::new("gunzip")
        .args(["-c", &archive_path.to_string_lossy()])
        .output()
        .map_err(|e| format!("Failed to extract gz: {}", e))?;

    if !output.status.success() {
        return Err("Failed to extract gz file".to_string());
    }

    fs::write(dest_path, &output.stdout)
        .map_err(|e| format!("Failed to write binary: {}", e))?;

    Ok(())
}

pub struct ClashProcess {
    child: Option<Child>,
    api_port: u16,
    api_secret: String,
}

impl ClashProcess {
    pub fn new(api_port: u16, api_secret: String) -> Self {
        ClashProcess {
            child: None,
            api_port,
            api_secret,
        }
    }

    pub fn start(&mut self, config_path: &str) -> Result<(), String> {
        if self.is_running() {
            return Ok(());
        }

        let binary_path = get_clash_binary_path()?;
        if !binary_path.exists() {
            return Err("Clash binary not found. Please download it first.".to_string());
        }

        let child = Command::new(&binary_path)
            .args(["-f", config_path, "-d", &get_config_dir()?.to_string_lossy()])
            .spawn()
            .map_err(|e| format!("Failed to start clash process: {}", e))?;

        self.child = Some(child);
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), String> {
        if let Some(ref mut child) = self.child {
            child.kill().map_err(|e| format!("Failed to kill process: {}", e))?;
            child.wait().ok();
            self.child = None;
        }
        Ok(())
    }

    pub fn restart(&mut self, config_path: &str) -> Result<(), String> {
        self.stop()?;
        std::thread::sleep(std::time::Duration::from_millis(500));
        self.start(config_path)
    }

    pub fn is_running(&mut self) -> bool {
        if let Some(ref mut child) = self.child {
            match child.try_wait() {
                Ok(Some(_)) => {
                    self.child = None;
                    false
                }
                Ok(None) => true,
                Err(_) => {
                    self.child = None;
                    false
                }
            }
        } else {
            false
        }
    }

    pub fn api_base_url(&self) -> String {
        format!("http://127.0.0.1:{}", self.api_port)
    }

    pub fn api_secret(&self) -> &str {
        &self.api_secret
    }
}

impl Drop for ClashProcess {
    fn drop(&mut self) {
        self.stop().ok();
    }
}

pub fn generate_clash_config(
    proxy_port: u16,
    mixed_port: u16,
    allow_lan: bool,
    tun_enabled: bool,
    subscription_content: &str,
) -> Result<String, String> {
    let mut config = serde_yaml::from_str::<serde_yaml::Value>(subscription_content)
        .map_err(|e| format!("Failed to parse subscription config: {}", e))?;

    if let Some(mapping) = config.as_mapping_mut() {
        mapping.insert(
            serde_yaml::Value::String("port".into()),
            serde_yaml::Value::Number(proxy_port.into()),
        );
        mapping.insert(
            serde_yaml::Value::String("mixed-port".into()),
            serde_yaml::Value::Number(mixed_port.into()),
        );
        mapping.insert(
            serde_yaml::Value::String("allow-lan".into()),
            serde_yaml::Value::Bool(allow_lan),
        );
        mapping.insert(
            serde_yaml::Value::String("bind-address".into()),
            serde_yaml::Value::String("*".into()),
        );
        mapping.insert(
            serde_yaml::Value::String("mode".into()),
            serde_yaml::Value::String("rule".into()),
        );
        mapping.insert(
            serde_yaml::Value::String("log-level".into()),
            serde_yaml::Value::String("info".into()),
        );
        mapping.insert(
            serde_yaml::Value::String("external-controller".into()),
            serde_yaml::Value::String("127.0.0.1:9090".into()),
        );
        mapping.insert(
            serde_yaml::Value::String("secret".into()),
            serde_yaml::Value::String("clash-flash".into()),
        );

        if tun_enabled {
            let mut tun_config = serde_yaml::Mapping::new();
            tun_config.insert(
                serde_yaml::Value::String("enable".into()),
                serde_yaml::Value::Bool(true),
            );
            tun_config.insert(
                serde_yaml::Value::String("stack".into()),
                serde_yaml::Value::String("gvisor".into()),
            );
            tun_config.insert(
                serde_yaml::Value::String("auto-route".into()),
                serde_yaml::Value::Bool(true),
            );
            tun_config.insert(
                serde_yaml::Value::String("auto-detect-interface".into()),
                serde_yaml::Value::Bool(true),
            );
            mapping.insert(
                serde_yaml::Value::String("tun".into()),
                serde_yaml::Value::Mapping(tun_config),
            );
        }
    }

    serde_yaml::to_string(&config).map_err(|e| format!("Failed to serialize config: {}", e))
}
