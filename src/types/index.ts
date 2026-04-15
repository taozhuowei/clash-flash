export interface Subscription {
  id: number;
  name: string;
  url: string;
  is_default: boolean;
  traffic_used: number;
  traffic_total: number;
  expire_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProxyNode {
  name: string;
  node_type: string;
  server: string;
  port: number;
  group: string;
  latency?: number;
  is_selected?: boolean;
}

export interface SubscriptionInfo {
  name: string;
  traffic_used: number;
  traffic_total: number;
  expire_date: string | null;
  nodes: ProxyNode[];
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

export interface LogEntry {
  id: number;
  level: string;
  message: string;
  created_at: string;
}
