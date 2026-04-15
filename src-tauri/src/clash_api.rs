use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProxyItem {
    pub name: String,
    #[serde(rename = "type")]
    pub proxy_type: String,
    pub now: Option<String>,
    pub all: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProxiesResponse {
    pub proxies: std::collections::HashMap<String, ProxyItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClashStatus {
    pub hello: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrafficData {
    pub up: f64,
    pub down: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DelayResult {
    pub delay: i64,
}

pub struct ClashApiClient {
    base_url: String,
    secret: String,
    client: Client,
}

impl ClashApiClient {
    pub fn new(port: u16, secret: &str) -> Self {
        ClashApiClient {
            base_url: format!("http://127.0.0.1:{}", port),
            secret: secret.to_string(),
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(5))
                .build()
                .unwrap_or_else(|_| Client::new()),
        }
    }

    fn request(&self, method: &str, path: &str) -> Result<reqwest::blocking::RequestBuilder, String> {
        let url = format!("{}{}", self.base_url, path);
        let req = match method {
            "GET" => self.client.get(&url),
            "PUT" => self.client.put(&url),
            "PATCH" => self.client.patch(&url),
            "POST" => self.client.post(&url),
            "DELETE" => self.client.delete(&url),
            _ => return Err(format!("Unsupported method: {}", method)),
        };
        Ok(req.header("Authorization", format!("Bearer {}", self.secret)))
    }

    pub fn is_running(&self) -> bool {
        self.request("GET", "/version")
            .and_then(|req| req.send().map_err(|e| e.to_string()))
            .map(|resp| resp.status().is_success())
            .unwrap_or(false)
    }

    pub fn get_proxies(&self) -> Result<ProxiesResponse, String> {
        let resp = self
            .request("GET", "/proxies")?
            .send()
            .map_err(|e| format!("Failed to get proxies: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Get proxies failed: {}", resp.status()));
        }

        resp.json::<ProxiesResponse>()
            .map_err(|e| format!("Failed to parse proxies: {}", e))
    }

    pub fn switch_proxy(&self, group: &str, name: &str) -> Result<(), String> {
        let path = format!("/proxies/{}", urlencoding::encode(group));
        let body = serde_json::json!({ "name": name });

        let resp = self
            .request("PUT", &path)?
            .json(&body)
            .send()
            .map_err(|e| format!("Failed to switch proxy: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Switch proxy failed: {}", resp.status()));
        }

        Ok(())
    }

    pub fn get_delay(&self, name: &str, url: &str, timeout: u64) -> Result<i64, String> {
        let path = format!(
            "/proxies/{}/delay?timeout={}&url={}",
            urlencoding::encode(name),
            timeout,
            urlencoding::encode(url)
        );

        let resp = self
            .request("GET", &path)?
            .send()
            .map_err(|e| format!("Failed to test delay: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Delay test failed: {}", resp.status()));
        }

        let result: DelayResult = resp
            .json()
            .map_err(|e| format!("Failed to parse delay: {}", e))?;

        Ok(result.delay)
    }

    pub fn get_traffic(&self) -> Result<TrafficData, String> {
        let resp = self
            .request("GET", "/traffic")?
            .send()
            .map_err(|e| format!("Failed to get traffic: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Get traffic failed: {}", resp.status()));
        }

        resp.json::<TrafficData>()
            .map_err(|e| format!("Failed to parse traffic: {}", e))
    }

    pub fn get_version(&self) -> Result<String, String> {
        #[derive(Deserialize)]
        struct VersionResponse {
            version: Option<String>,
            meta: Option<bool>,
        }

        let resp = self
            .request("GET", "/version")?
            .send()
            .map_err(|e| format!("Failed to get version: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Get version failed: {}", resp.status()));
        }

        let result: VersionResponse = resp
            .json()
            .map_err(|e| format!("Failed to parse version: {}", e))?;

        Ok(result.version.unwrap_or_else(|| "unknown".to_string()))
    }

    pub fn reload_config(&self, path: &str) -> Result<(), String> {
        let body = serde_json::json!({ "path": path });

        let resp = self
            .request("PUT", "/configs")?
            .json(&body)
            .send()
            .map_err(|e| format!("Failed to reload config: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Reload config failed: {}", resp.status()));
        }

        Ok(())
    }
}
