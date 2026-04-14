export interface Subscription {
  id: number;
  name: string;
  url: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProxyNode {
  name: string;
  type: string;
  latency: number;
  is_selected: boolean;
}

export interface ClashStatus {
  is_running: boolean;
  is_tun_enabled: boolean;
  current_proxy: string;
  upload_speed: number;
  download_speed: number;
  delay: number;
  ip: string;
  location: string;
}

export interface AppConfig {
  theme: 'light' | 'dark';
  auto_start: boolean;
  auto_system_proxy: boolean;
  minimize_to_tray: boolean;
  proxy_port: number;
  mixed_port: number;
  allow_lan: boolean;
}

export interface TrafficInfo {
  used: number;
  total: number;
  expire_date: string;
  days_left: number;
}
