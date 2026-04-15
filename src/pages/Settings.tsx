import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConfigStore, useSubscriptionStore } from '@/store';
import * as api from '@/api';

export function SettingsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('airport');

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">设置</h1>
      </header>

      <div className="flex">
        <aside className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-56px)]">
          <nav className="p-2 space-y-1">
            {[
              { id: 'airport', label: '🛩️ 机场管理' },
              { id: 'config', label: '💾 配置管理' },
              { id: 'appearance', label: '🎨 外观设置' },
              { id: 'other', label: '⚙️ 其他设置' },
              { id: 'about', label: 'ℹ️ 关于' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4">
          {activeSection === 'airport' && <AirportSection />}
          {activeSection === 'config' && <ConfigSection />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'other' && <OtherSection />}
          {activeSection === 'about' && <AboutSection />}
        </main>
      </div>
    </div>
  );
}

function AirportSection() {
  const { subscriptions, setSubscriptions, setDefaultSubscription } = useSubscriptionStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const subs = await api.getSubscriptions();
      setSubscriptions(subs);
      const def = subs.find(s => s.is_default) || subs[0];
      if (def) setDefaultSubscription(def);
    } catch {}
  };

  const handleAdd = async () => {
    if (!newUrl.trim()) {
      setError('请输入订阅链接');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const name = newName.trim() || '新机场';
      await api.addSubscription(name, newUrl.trim());
      setNewName('');
      setNewUrl('');
      setShowAddForm(false);
      await loadSubscriptions();
    } catch (e: any) {
      setError(e?.toString() || '添加失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = async (id: number) => {
    try {
      await api.setDefaultSubscription(id);
      await loadSubscriptions();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteSubscription(id);
      await loadSubscriptions();
    } catch {}
  };

  const handleRefresh = async (id: number) => {
    try {
      await api.updateSubscription(id);
      await loadSubscriptions();
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">机场管理</h2>

      <div className="space-y-2">
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p>暂无机场</p>
            <p className="text-sm mt-1">请添加订阅链接</p>
          </div>
        ) : (
          subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✈️</span>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{sub.name}</p>
                    {sub.is_default && (
                      <span className="text-xs text-blue-500">当前使用</span>
                    )}
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{sub.url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefresh(sub.id)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    🔄 刷新
                  </button>
                  {!sub.is_default && (
                    <>
                      <button
                        onClick={() => handleSwitch(sub.id)}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors text-blue-700 dark:text-blue-400"
                      >
                        切换
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors text-red-700 dark:text-red-400"
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          + 添加新机场
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm space-y-3">
          <h3 className="font-medium text-gray-800 dark:text-white">添加新机场</h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="机场名称（可选）"
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => { setNewUrl(e.target.value); setError(''); }}
            placeholder="订阅链接"
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isLoading || !newUrl.trim()}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '添加中...' : '添加'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); setNewUrl(''); setError(''); }}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ConfigSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const configs = await api.getAllConfigs();
      const blob = new Blob([JSON.stringify(configs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clash-flash-config.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setIsExporting(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setIsImporting(true);
      try {
        const text = await file.text();
        const configs = JSON.parse(text);
        for (const [key, value] of Object.entries(configs)) {
          await api.setConfig(key, value as string);
        }
      } catch {}
      setIsImporting(false);
    };
    input.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">配置管理</h2>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">📤</span>
          <span className="text-gray-700 dark:text-gray-300">{isExporting ? '导出中...' : '导出配置'}</span>
        </button>
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">📥</span>
          <span className="text-gray-700 dark:text-gray-300">{isImporting ? '导入中...' : '导入配置'}</span>
        </button>
      </div>

      <button className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <span className="text-2xl">🔄</span>
        <span className="text-gray-700 dark:text-gray-300">覆盖规则（恢复默认）</span>
      </button>
    </motion.div>
  );
}

function AppearanceSection() {
  const { config, setConfig } = useConfigStore();

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    setConfig({ theme });
    try {
      await api.setConfig('theme', theme);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">外观设置</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
              config.theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <span className="text-2xl mb-1 block">☀️</span>
            <span className={`text-sm ${config.theme === 'light' ? 'text-blue-500' : 'text-gray-500'}`}>
              浅色模式
            </span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
              config.theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <span className="text-2xl mb-1 block">🌙</span>
            <span className={`text-sm ${config.theme === 'dark' ? 'text-blue-500' : 'text-gray-500'}`}>
              深色模式
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function OtherSection() {
  const { config, setConfig } = useConfigStore();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const configs = await api.getAllConfigs();
      setConfig({
        auto_start: configs.auto_start === 'true',
        auto_system_proxy: configs.auto_system_proxy === 'true',
        minimize_to_tray: configs.minimize_to_tray === 'true',
        proxy_port: parseInt(configs.proxy_port || '7890'),
        mixed_port: parseInt(configs.mixed_port || '7891'),
        allow_lan: configs.allow_lan === 'true',
        theme: (configs.theme as 'light' | 'dark') || 'light',
      });
    } catch {}
  };

  const handleToggle = async (key: string, value: boolean) => {
    setConfig({ [key]: value });
    try {
      await api.setConfig(key, value ? 'true' : 'false');
    } catch {}
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">其他设置</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
        {[
          { key: 'auto_start', label: '开机自启', desc: '开机自动启动 Clash Flash' },
          { key: 'auto_system_proxy', label: '自动系统代理', desc: '连接 VPN 时自动设置系统代理' },
          { key: 'minimize_to_tray', label: '最小化到托盘', desc: '关闭窗口时最小化到系统托盘' },
          { key: 'allow_lan', label: '允许局域网', desc: '允许局域网设备连接代理' },
        ].map((item) => (
          <div key={item.key} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">{item.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
            <ToggleSwitch
              checked={config[item.key as keyof typeof config] as boolean}
              onChange={(v) => handleToggle(item.key, v)}
            />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-white">代理端口</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">HTTP 代理监听端口</p>
          </div>
          <input
            type="number"
            value={config.proxy_port}
            onChange={async (e) => {
              const port = parseInt(e.target.value) || 7890;
              setConfig({ proxy_port: port });
              try { await api.setConfig('proxy_port', port.toString()); } catch {}
            }}
            className="w-20 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-white">混合端口</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">SOCKS5 + HTTP 混合端口</p>
          </div>
          <input
            type="number"
            value={config.mixed_port}
            onChange={async (e) => {
              const port = parseInt(e.target.value) || 7891;
              setConfig({ mixed_port: port });
              try { await api.setConfig('mixed_port', port.toString()); } catch {}
            }}
            className="w-20 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </motion.div>
  );
}

function AboutSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">关于</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm text-center">
        <div className="text-4xl mb-3">⚡</div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Clash Flash</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">版本 1.0.0</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          简单、快速、易用的 VPN 客户端
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          检查更新
        </button>
      </div>
    </motion.div>
  );
}
