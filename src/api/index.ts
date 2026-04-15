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
