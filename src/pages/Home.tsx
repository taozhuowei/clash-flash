import { useState } from 'react';
import { motion } from 'framer-motion';
import { useClashStore } from '@/store';
import type { ProxyNode } from '@/types';

export function HomePage() {
  const { currentProxy, setCurrentProxy } = useClashStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNodes, setShowNodes] = useState(true);

  const mockProxies: ProxyNode[] = [
    { name: '香港 01', type: 'ss', latency: 32, is_selected: true },
    { name: '香港 02', type: 'ss', latency: 45, is_selected: false },
    { name: '香港 03', type: 'ss', latency: 58, is_selected: false },
    { name: '日本 01', type: 'ss', latency: 120, is_selected: false },
    { name: '日本 02', type: 'ss', latency: 135, is_selected: false },
    { name: '新加坡 01', type: 'ss', latency: 150, is_selected: false },
    { name: '美国 01', type: 'ss', latency: 280, is_selected: false },
    { name: '美国 02', type: 'ss', latency: 310, is_selected: false },
  ];

  const filteredProxies = mockProxies.filter((proxy) => {
    const matchesSearch = proxy.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || proxy.name.includes(filter);
    return matchesSearch && matchesFilter;
  });

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'bg-green-500';
    if (latency < 200) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🛩️</span>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            我的机场
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span>✅ 可用节点: {mockProxies.length}个</span>
          <span>📊 已用: 58.2GB / 200GB</span>
          <span>📅 到期: 2024-12-31</span>
          <span>⏰ 剩余: 262天</span>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span>🔄</span> 刷新
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span>⚡</span> 测速
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNodes(!showNodes)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span>📋</span> {showNodes ? '收起' : '节点列表'}
          </motion.button>
        </div>
      </motion.div>

      {showNodes && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            📍 当前节点: {currentProxy || '香港 01'} (延迟: 32ms)
          </p>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜索节点..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white focus:outline-none"
            >
              <option value="all">全部</option>
              <option value="香港">香港</option>
              <option value="日本">日本</option>
              <option value="美国">美国</option>
            </select>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredProxies.map((proxy) => (
              <motion.button
                key={proxy.name}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentProxy(proxy.name)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  (currentProxy || '香港 01') === proxy.name
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getLatencyColor(proxy.latency)}`} />
                  <span className="text-gray-800 dark:text-white font-medium">
                    {proxy.name}
                  </span>
                  {(currentProxy || '香港 01') === proxy.name && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
                <span className={`font-medium ${
                  proxy.latency < 100 ? 'text-green-500' :
                  proxy.latency < 200 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {proxy.latency}ms
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
