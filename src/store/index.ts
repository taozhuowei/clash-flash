import { create } from 'zustand';
import type { Subscription, ClashStatus, AppConfig, ProxyNode } from '@/types';

interface AppStore {
  isFirstLaunch: boolean;
  currentPage: 'home' | 'settings';
  setFirstLaunch: (value: boolean) => void;
  setCurrentPage: (page: 'home' | 'settings') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isFirstLaunch: true,
  currentPage: 'home',
  setFirstLaunch: (value) => set({ isFirstLaunch: value }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));

interface ClashStore {
  isRunning: boolean;
  isTunEnabled: boolean;
  currentProxy: string;
  proxies: ProxyNode[];
  status: ClashStatus;
  setIsRunning: (value: boolean) => void;
  setIsTunEnabled: (value: boolean) => void;
  setCurrentProxy: (proxy: string) => void;
  setProxies: (proxies: ProxyNode[]) => void;
  setStatus: (status: Partial<ClashStatus>) => void;
}

export const useClashStore = create<ClashStore>((set) => ({
  isRunning: false,
  isTunEnabled: false,
  currentProxy: '',
  proxies: [],
  status: {
    is_running: false,
    is_tun_enabled: false,
    current_proxy: '',
    upload_speed: 0,
    download_speed: 0,
    delay: 0,
    ip: '',
    location: '',
  },
  setIsRunning: (value) => set({ isRunning: value }),
  setIsTunEnabled: (value) => set({ isTunEnabled: value }),
  setCurrentProxy: (proxy) => set({ currentProxy: proxy }),
  setProxies: (proxies) => set({ proxies }),
  setStatus: (status) => set((state) => ({ status: { ...state.status, ...status } })),
}));

interface SubscriptionStore {
  subscriptions: Subscription[];
  defaultSubscription: Subscription | null;
  setSubscriptions: (subs: Subscription[]) => void;
  setDefaultSubscription: (sub: Subscription | null) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscriptions: [],
  defaultSubscription: null,
  setSubscriptions: (subs) => set({ subscriptions: subs }),
  setDefaultSubscription: (sub) => set({ defaultSubscription: sub }),
}));

interface ConfigStore {
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: {
    theme: 'light',
    auto_start: false,
    auto_system_proxy: true,
    minimize_to_tray: true,
    proxy_port: 7890,
    mixed_port: 7891,
    allow_lan: false,
  },
  setConfig: (newConfig) => set((state) => ({ config: { ...state.config, ...newConfig } })),
}));
