import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setFirstLaunch } = useAppStore();
  const [step, setStep] = useState(1);

  const handleComplete = () => {
    setFirstLaunch(false);
    navigate('/home');
  };

  const handleSkip = () => {
    handleComplete();
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
              onNext={() => setStep(2)}
              onSkip={handleSkip}
            />
          )}
          {step === 2 && (
            <Step2Nodes
              key="step2"
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

function Step1Airport({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
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

      <Button onClick={onNext} className="w-full" size="lg">
        使用内置机场，进入下一步
      </Button>

      <button
        onClick={onSkip}
        className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
      >
        已有机场，稍后导入
      </button>
    </motion.div>
  );
}

function Step2Nodes({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [nodes, setNodes] = useState([
    { name: '香港 01', latency: 32 },
    { name: '香港 02', latency: 45 },
    { name: '日本 01', latency: 120 },
    { name: '新加坡 01', latency: 150 },
    { name: '美国 01', latency: 280 },
  ]);

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500';
    if (latency < 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleTestAll = () => {
    setIsTesting(true);
    setTimeout(() => {
      setNodes(nodes.map(node => ({
        ...node,
        latency: Math.floor(Math.random() * 300) + 10
      })).sort((a, b) => a.latency - b.latency));
      setIsTesting(false);
    }, 1500);
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

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {nodes.map((node) => (
          <button
            key={node.name}
            onClick={() => setSelectedNode(node.name)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              selectedNode === node.name
                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-gray-800 dark:text-white">
              {node.name}
              {selectedNode === node.name && ' ✓'}
            </span>
            <span className={`font-medium ${getLatencyColor(node.latency)}`}>
              {node.latency}ms
            </span>
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={handleTestAll}
        disabled={isTesting}
        className="w-full"
      >
        {isTesting ? '⏳ 测试中...' : '⚡ 测试所有节点延迟'}
      </Button>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          上一步
        </Button>
        <Button onClick={onNext} className="flex-1">
          下一步
        </Button>
      </div>
    </motion.div>
  );
}

function Step3Config({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [tunEnabled, setTunEnabled] = useState(true);
  const [systemProxy, setSystemProxy] = useState(true);
  const [autoStart, setAutoStart] = useState(false);

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
        <Button onClick={onComplete} className="flex-1">
          完成 ✓
        </Button>
      </div>
    </motion.div>
  );
}
