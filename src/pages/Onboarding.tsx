import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore, useClashStore, useConfigStore } from '@/store';
import * as api from '@/api';
import type { ProxyNode } from '@/types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setFirstLaunch } = useAppStore();
  const [step, setStep] = useState(1);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [subscriptionName, setSubscriptionName] = useState('');
  const [nodes, setNodes] = useState<ProxyNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    try {
      await api.completeOnboarding();
      setFirstLaunch(false);
      navigate('/home');
    } catch (e) {
      setFirstLaunch(false);
      navigate('/home');
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleAddSubscription = async () => {
    if (!subscriptionUrl.trim()) {
      setError('请输入订阅链接');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const name = subscriptionName.trim() || '我的机场';
      const sub = await api.addSubscription(name, subscriptionUrl.trim());

      try {
        const info = await api.updateSubscription(sub.id);
        setNodes(info.nodes);
      } catch {
        setNodes([]);
      }

      setStep(2);
    } catch (e: any) {
      setError(e?.toString() || '添加订阅失败，请检查链接是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseBuiltinAirport = () => {
    handleAddSubscription();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-5xl mb-4"
          >
            🚀
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            欢迎使用 Clash Flash
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            简单、快速、易用的 VPN 客户端
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1Airport
              key="step1"
              onNext={handleUseBuiltinAirport}
              onSkip={handleSkip}
              subscriptionUrl={subscriptionUrl}
              setSubscriptionUrl={setSubscriptionUrl}
              subscriptionName={subscriptionName}
              setSubscriptionName={setSubscriptionName}
              isLoading={isLoading}
              error={error}
              setError={setError}
              onAddSubscription={handleAddSubscription}
            />
          )}
          {step === 2 && (
            <Step2Nodes
              key="step2"
              nodes={nodes}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3Config
              key="step3"
              onComplete={handleComplete}
              onBack={() => setStep(2)}
            />
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Step1Airport({
  onNext,
  onSkip,
  subscriptionUrl,
  setSubscriptionUrl,
  subscriptionName,
  setSubscriptionName,
  isLoading,
  error,
  setError,
  onAddSubscription,
}: {
  onNext: () => void;
  onSkip: () => void;
  subscriptionUrl: string;
  setSubscriptionUrl: (v: string) => void;
  subscriptionName: string;
  setSubscriptionName: (v: string) => void;
  isLoading: boolean;
  error: string;
  setError: (v: string) => void;
  onAddSubscription: () => void;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-48 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">内置机场网页嵌入区域</p>
      </div>

      {!showCustomInput ? (
        <>
          <Button onClick={onNext} className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? '⏳ 正在导入...' : '使用内置机场，进入下一步'}
          </Button>

          <button
            onClick={() => setShowCustomInput(true)}
            className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
          >
            我自己有机场，输入订阅链接
          </button>

          <button
            onClick={onSkip}
            className="w-full text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors text-xs"
          >
            稍后导入，跳过此步
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              机场名称（可选）
            </label>
            <input
              type="text"
              value={subscriptionName}
              onChange={(e) => setSubscriptionName(e.target.value)}
              placeholder="例如：我的机场"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              订阅链接
            </label>
            <input
              type="url"
              value={subscriptionUrl}
              onChange={(e) => {
                setSubscriptionUrl(e.target.value);
                setError('');
              }}
              placeholder="请输入订阅链接"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button
            onClick={onAddSubscription}
            className="w-full"
            size="lg"
            disabled={isLoading || !subscriptionUrl.trim()}
          >
            {isLoading ? '⏳ 正在导入...' : '导入订阅'}
          </Button>

          <button
            onClick={() => setShowCustomInput(false)}
            className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
          >
            返回使用内置机场
          </button>
        </div>
      )}
    </motion.div>
  );
}

function Step2Nodes({
  nodes,
  onNext,
  onBack,
}: {
  nodes: ProxyNode[];
  onNext: () => void;
  onBack: () => void;
}) {
  const { setCurrentProxy } = useClashStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const displayNodes = nodes.length > 0 ? nodes : [
    { name: '香港 01', node_type: 'ss', server: '', port: 0, group: '' },
    { name: '香港 02', node_type: 'ss', server: '', port: 0, group: '' },
    { name: '日本 01', node_type: 'ss', server: '', port: 0, group: '' },
    { name: '新加坡 01', node_type: 'ss', server: '', port: 0, group: '' },
    { name: '美国 01', node_type: 'ss', server: '', port: 0, group: '' },
  ];

  const handleNext = () => {
    if (selectedNode) {
      setCurrentProxy(selectedNode);
    }
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        选择节点
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        共 {displayNodes.length} 个可用节点{nodes.length === 0 ? '（示例数据）' : ''}
      </p>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayNodes.map((node) => (
          <button
            key={node.name}
            onClick={() => setSelectedNode(node.name)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              selectedNode === node.name
                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-800 dark:text-white">
                {node.name}
              </span>
              <span className="text-xs text-gray-400">{node.node_type}</span>
              {selectedNode === node.name && <span className="text-blue-500">✓</span>}
            </div>
            {node.group && (
              <span className="text-xs text-gray-400">{node.group}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          上一步
        </Button>
        <Button onClick={handleNext} className="flex-1">
          下一步
        </Button>
      </div>
    </motion.div>
  );
}

function Step3Config({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) {
  const { setConfig } = useConfigStore();
  const [tunEnabled, setTunEnabled] = useState(true);
  const [systemProxy, setSystemProxy] = useState(true);
  const [autoStart, setAutoStart] = useState(false);

  const handleComplete = async () => {
    try {
      await api.setConfig('auto_system_proxy', systemProxy ? 'true' : 'false');
      await api.setConfig('auto_start', autoStart ? 'true' : 'false');
      setConfig({
        auto_system_proxy: systemProxy,
        auto_start: autoStart,
      });
    } catch {}
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        其他配置
      </h2>

      <div className="space-y-3">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">TUN 模式</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                💡 TUN 模式：虚拟网卡模式，让所有应用流量都经过 VPN。
              </p>
            </div>
            <button
              onClick={() => setTunEnabled(!tunEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                tunEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  tunEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">系统代理</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                自动设置系统代理
              </p>
            </div>
            <button
              onClick={() => setSystemProxy(!systemProxy)}
              className={`w-12 h-6 rounded-full transition-colors ${
                systemProxy ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  systemProxy ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">开机自启</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                开机自动启动 Clash Flash
              </p>
            </div>
            <button
              onClick={() => setAutoStart(!autoStart)}
              className={`w-12 h-6 rounded-full transition-colors ${
                autoStart ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoStart ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          上一步
        </Button>
        <Button onClick={handleComplete} className="flex-1">
          完成 ✓
        </Button>
      </div>
    </motion.div>
  );
}
