use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubscriptionInfo {
    pub name: String,
    pub traffic_used: f64,
    pub traffic_total: f64,
    pub expire_date: Option<String>,
    pub nodes: Vec<ProxyNode>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProxyNode {
    pub name: String,
    pub node_type: String,
    pub server: String,
    pub port: u16,
    pub group: String,
}

#[derive(Debug, Deserialize)]
struct ClashConfig {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    proxies: Vec<ProxyConfig>,
    #[serde(default)]
    #[serde(rename = "proxy-groups")]
    proxy_groups: Vec<ProxyGroup>,
    #[serde(default)]
    #[serde(rename = "subscription-info")]
    subscription_info: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ProxyConfig {
    name: String,
    #[serde(rename = "type")]
    node_type: String,
    #[serde(default)]
    server: String,
    #[serde(default)]
    port: u16,
}

#[derive(Debug, Deserialize)]
struct ProxyGroup {
    name: String,
    #[serde(default)]
    proxies: Vec<String>,
}

pub fn download_subscription(url: &str) -> Result<SubscriptionInfo, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("ClashFlash/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(url)
        .send()
        .map_err(|e| format!("Failed to download subscription: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Subscription download failed with status: {}",
            response.status()
        ));
    }

    let content = response
        .text()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    parse_subscription_content(&content)
}

fn parse_subscription_content(content: &str) -> Result<SubscriptionInfo, String> {
    let trimmed = content.trim();

    if let Ok(decoded) = base64_decode(trimmed) {
        if !decoded.is_empty() && decoded.contains("proxies") {
            return parse_subscription_content(&decoded);
        }
    }

    parse_yaml_subscription(content)
}

fn base64_decode(input: &str) -> Result<String, String> {
    use base64::Engine;
    let cleaned = input
        .replace('\n', "")
        .replace('\r', "")
        .replace(' ', "");
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(&cleaned)
        .map_err(|e| format!("Base64 decode error: {}", e))?;
    String::from_utf8(decoded).map_err(|e| format!("UTF-8 decode error: {}", e))
}

fn parse_yaml_subscription(content: &str) -> Result<SubscriptionInfo, String> {
    let config: ClashConfig =
        serde_yaml::from_str(content).map_err(|e| format!("YAML parse error: {}", e))?;

    let name = config.name.unwrap_or_else(|| "Unknown".to_string());

    let mut nodes: Vec<ProxyNode> = config
        .proxies
        .into_iter()
        .map(|p| ProxyNode {
            name: p.name,
            node_type: p.node_type,
            server: p.server,
            port: p.port,
            group: String::new(),
        })
        .collect();

    for group in &config.proxy_groups {
        for node in nodes.iter_mut() {
            if group.proxies.contains(&node.name) && node.group.is_empty() {
                node.group = group.name.clone();
            }
        }
    }

    let (traffic_used, traffic_total, expire_date) = config
        .subscription_info
        .as_deref()
        .map(parse_subscription_info_header)
        .unwrap_or((0.0, 0.0, None));

    Ok(SubscriptionInfo {
        name,
        traffic_used,
        traffic_total,
        expire_date,
        nodes,
    })
}

fn parse_subscription_info_header(info: &str) -> (f64, f64, Option<String>) {
    let mut used = 0.0;
    let mut total = 0.0;
    let mut expire = None;

    for part in info.split(';') {
        let part = part.trim();
        if let Some(val) = part.strip_prefix("upload=") {
            used += val.parse::<f64>().unwrap_or(0.0);
        } else if let Some(val) = part.strip_prefix("download=") {
            used += val.parse::<f64>().unwrap_or(0.0);
        } else if let Some(val) = part.strip_prefix("total=") {
            total = val.parse::<f64>().unwrap_or(0.0);
        } else if let Some(val) = part.strip_prefix("expire=") {
            let ts = val.parse::<i64>().unwrap_or(0);
            if ts > 0 {
                expire = Some(format_expire_date(ts));
            }
        }
    }

    (used, total, expire)
}

fn format_expire_date(ts: i64) -> String {
    let now_ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let days_left = (ts - now_ts) / 86400;

    let days_since_epoch = ts / 86400;
    let year = 1970 + days_since_epoch / 365;
    let day_of_year = days_since_epoch % 365;
    let month = (day_of_year / 30 + 1).min(12);
    let day = (day_of_year % 30 + 1).min(28);

    format!(
        "{}-{:02}-{:02} (剩余{}天)",
        year, month, day,
        days_left.max(0)
    )
}

pub fn save_subscription_config(content: &str, sub_name: &str) -> Result<String, String> {
    let config_dir = dirs::data_local_dir()
        .ok_or("Failed to get app data directory")?
        .join("clash-flash")
        .join("configs");

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let safe_name = sub_name
        .replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "_");
    let file_path = config_dir.join(format!("{}.yaml", safe_name));

    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}
