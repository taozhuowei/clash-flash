import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useClashStore, useSubscriptionStore } from '@/store';
import * as api from '@/api';
import type { ProxyNode } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function HomePage() {
  const { currentProxy, setCurrentProxy } = useClashStore();
  const { setSubscriptions, defaultSubscription, setDefaultSubscription } = useSubscriptionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNodes, setShowNodes] = useState(true);
  const [nodes, setNodes] = useState<ProxyNode[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const subs = await api.getSubscriptions();
      setSubscriptions(subs);
      const def = subs.find(s => s.is_default) || subs[0];
      if (def) {
        setDefaultSubscription(def);
        await refreshSubscriptionNodes(def.id);
      }
    } catch {}
  };

  const refreshSubscriptionNodes = async (subId: number) => {
    try {
      const info = await api.updateSubscription(subId);
      setNodes(info.nodes);
      const subs = await api.getSubscriptions();
      setSubscriptions(subs);
      const def = subs.find(s => s.is_default) || subs[0];
      if (def) setDefaultSubscription(def);
    } catch {
      setNodes([]);
    }
  };

  const handleRefresh = async () => {
    if (!defaultSubscription || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshSubscriptionNodes(defaultSubscription.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestAll = async () => {
    setIsTesting(true);
    try {
      const proxies = await api.getClashProxies();
      const testPromises = Object.keys(proxies.proxies)
        .filter(name => proxies.proxies[name].type !== 'Selector')
        .map(async (name) => {
          try {
            const delay = await api.testProxyDelay(name);
            return { name, delay };
          } catch {
            return { name, delay: 9999 };
          }
        });

      const results = await Promise.all(testPromises);
      setNodes(prev => prev.map(node => {
        const result = results.find(r => r.name === node.name);
        return result ? { ...node, latency: result.delay } : node;
      }).sort((a, b) => (a.latency || 999) - (b.latency || 999)));
    } catch {
    } finally {
      setIsTesting(false);
    }
  };

  const handleNodeSelect = async (nodeName: string) => {
    try {
      const proxies = await api.getClashProxies();
      const groups = Object.entries(proxies.proxies)
        .filter(([_, p]) => p.type === 'Selector' && p.group)
        .map(([name, p]) => ({ name, group: p.group }));

      if (groups.length > 0) {
        await api.switchClashProxy(groups[0].name, nodeName);
      }
      setCurrentProxy(nodeName);
    } catch (e) {
      console.error('Failed to switch proxy:', e);
      setCurrentProxy(nodeName);
    }
  };

  const currentSub = defaultSubscription;

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || node.name.includes(filter) || node.group.includes(filter);
    return matchesSearch && matchesFilter;
  });

  const groups = [...new Set(nodes.map(n => n.group).filter(g => g))];

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'bg-gray-400';
    if (latency < 100) return 'bg-green-500';
    if (latency < 200) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLatencyTextColor = (latency?: number) => {
    if (!latency) return 'text-gray-400';
    if (latency < 100) return 'text-green-500';
    if (latency < 200) return 'text-yellow-500';
    return 'text-red-500';
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
            {currentSub?.name || '我的机场'}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span>✅ 可用节点: {nodes.length}个</span>
          <span>📊 已用: {currentSub ? `${formatBytes(currentSub.traffic_used)} / ${formatBytes(currentSub.traffic_total)}` : '未知'}</span>
          <span>📅 到期: {currentSub?.expire_date || '未知'}</span>
          <span>⏰ 剩余: {currentSub?.expire_date || '未知'}</span>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <span>{isRefreshing ? '⏳' : '🔄'}</span> {isRefreshing ? '刷新中...' : '刷新'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleTestAll}
            disabled={isTesting}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <span>{isTesting ? '⏳' : '⚡'}</span> {isTesting ? '测速中...' : '测速'}
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
            📍 当前节点: {currentProxy || '未选择'}
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
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {filteredNodes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p>暂无节点数据</p>
              <p className="text-sm mt-1">请先导入订阅或刷新订阅</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredNodes.map((node) => (
                <motion.button
                  key={node.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNodeSelect(node.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    currentProxy === node.name
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getLatencyColor(node.latency)}`} />
                    <span className="text-gray-800 dark:text-white font-medium">
                      {node.name}
                    </span>
                    {currentProxy === node.name && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {node.group && (
                      <span className="text-xs text-gray-400">{node.group}</span>
                    )}
                    <span className={`font-medium ${getLatencyTextColor(node.latency)}`}>
                      {node.latency ? `${node.latency}ms` : '--'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
