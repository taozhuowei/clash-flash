import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '@/store';

export function SettingsPage() {
  const navigate = useNavigate();
  const { config, setConfig } = useConfigStore();
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
              { id: 'airport', label: '🛩️ 机场管理', icon: '✈️' },
              { id: 'config', label: '💾 配置管理', icon: '📦' },
              { id: 'appearance', label: '🎨 外观设置', icon: '🎨' },
              { id: 'other', label: '⚙️ 其他设置', icon: '⚙️' },
              { id: 'about', label: 'ℹ️ 关于', icon: 'ℹ️' },
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
          {activeSection === 'appearance' && <AppearanceSection config={config} setConfig={setConfig} />}
          {activeSection === 'other' && <OtherSection config={config} setConfig={setConfig} />}
          {activeSection === 'about' && <AboutSection />}
        </main>
      </div>
    </div>
  );
}

function AirportSection() {
  const airports = [
    { id: 1, name: '我的超级机场', isDefault: true },
    { id: 2, name: '备用机场 1', isDefault: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">机场管理</h2>

      <div className="space-y-2">
        {airports.map((airport) => (
          <div
            key={airport.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">✈️</span>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{airport.name}</p>
                {airport.isDefault && (
                  <span className="text-xs text-blue-500">当前使用</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!airport.isDefault && (
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300">
                  切换
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
        + 添加新机场
      </button>
    </motion.div>
  );
}

function ConfigSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">配置管理</h2>

      <div className="grid grid-cols-2 gap-3">
        <button className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <span className="text-2xl">📤</span>
          <span className="text-gray-700 dark:text-gray-300">导出配置</span>
        </button>
        <button className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <span className="text-2xl">📥</span>
          <span className="text-gray-700 dark:text-gray-300">导入配置</span>
        </button>
      </div>

      <button className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <span className="text-2xl">🔄</span>
        <span className="text-gray-700 dark:text-gray-300">覆盖规则（恢复默认）</span>
      </button>
    </motion.div>
  );
}

function AppearanceSection({ config, setConfig }: { config: any; setConfig: any }) {
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
            onClick={() => setConfig({ theme: 'light' })}
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
            onClick={() => setConfig({ theme: 'dark' })}
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

function OtherSection({ config, setConfig }: { config: any; setConfig: any }) {
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
        ].map((item) => (
          <div key={item.key} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">{item.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
            <ToggleSwitch
              checked={config[item.key as keyof typeof config] as boolean}
              onChange={(v) => setConfig({ [item.key]: v })}
            />
          </div>
        ))}
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
