import { invoke } from '@tauri-apps/api/core';
import type { Subscription, SubscriptionInfo, LogEntry } from '@/types';

export async function getConfig(key: string): Promise<string | null> {
  return invoke<string | null>('get_config', { key });
}

export async function setConfig(key: string, value: string): Promise<void> {
  return invoke('set_config', { key, value });
}

export async function getAllConfigs(): Promise<Record<string, string>> {
  return invoke('get_all_configs');
}

export async function getSubscriptions(): Promise<Subscription[]> {
  return invoke<Subscription[]>('get_subscriptions');
}

export async function addSubscription(name: string, url: string): Promise<Subscription> {
  return invoke<Subscription>('add_subscription', { name, url });
}

export async function updateSubscription(id: number): Promise<SubscriptionInfo> {
  return invoke<SubscriptionInfo>('update_subscription', { id });
}

export async function deleteSubscription(id: number): Promise<void> {
  return invoke('delete_subscription', { id });
}

export async function setDefaultSubscription(id: number): Promise<void> {
  return invoke('set_default_subscription', { id });
}

export async function getLogs(limit?: number): Promise<LogEntry[]> {
  return invoke<LogEntry[]>('get_logs', { limit });
}

export async function completeOnboarding(): Promise<void> {
  return invoke('complete_onboarding');
}

export async function downloadClashCore(): Promise<string> {
  return invoke<string>('download_clash_core');
}

export async function checkClashCore(): Promise<boolean> {
  return invoke<boolean>('check_clash_core');
}

export async function startClash(): Promise<void> {
  return invoke('start_clash');
}

export async function stopClash(): Promise<void> {
  return invoke('stop_clash');
}

export async function restartClash(): Promise<void> {
  return invoke('restart_clash');
}

export async function getClashStatus(): Promise<{ is_running: boolean; is_tun_enabled: boolean }> {
  return invoke('get_clash_status');
}

export interface ClashProxy {
  name: string;
  type: string;
  group?: string;
}

export interface ClashProxiesResponse {
  proxies: Record<string, ClashProxy>;
  groups: string[];
}

export async function getClashProxies(): Promise<ClashProxiesResponse> {
  return invoke<ClashProxiesResponse>('get_clash_proxies');
}

export async function switchClashProxy(group: string, name: string): Promise<void> {
  return invoke('switch_clash_proxy', { group, name });
}

export async function testProxyDelay(name: string): Promise<number> {
  return invoke<number>('test_proxy_delay', { name });
}

export async function getClashTraffic(): Promise<{ up: number; down: number }> {
  return invoke<{ up: number; down: number }>('get_clash_traffic');
}

export async function getClashConnectionInfo(): Promise<{ ip: string; location: string; delay: number }> {
  return invoke<{ ip: string; location: string; delay: number }>('get_clash_connection_info');
}
