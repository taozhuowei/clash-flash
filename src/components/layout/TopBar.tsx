import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useClashStore, useAppStore } from '@/store';
import * as api from '@/api';

export function TopBar() {
  const navigate = useNavigate();
  const { isRunning, isTunEnabled, setIsRunning, setIsTunEnabled } = useClashStore();
  const { setCurrentPage } = useAppStore();
  const [isToggling, setIsToggling] = useState(false);

  const handleSettingsClick = () => {
    setCurrentPage('settings');
    navigate('/settings');
  };

  const handleVPNToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (isRunning) {
        await api.stopClash();
        setIsRunning(false);
      } else {
        await api.startClash();
        setIsRunning(true);
      }
    } catch (e) {
      console.error('Failed to toggle VPN:', e);
    } finally {
      setIsToggling(false);
    }
  };

  const handleTunToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      setIsTunEnabled(!isTunEnabled);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shadow-sm">
      <button
        onClick={handleSettingsClick}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleVPNToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
            isRunning
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-white animate-pulse' : 'bg-white'}`} />
          {isRunning ? 'VPN 已连接' : 'VPN 未连接'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleTunToggle}
          className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-all border-2 ${
            isTunEnabled
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'border-gray-300 text-gray-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isTunEnabled ? 'bg-blue-500' : 'bg-gray-300'}`} />
          TUN
        </motion.button>
      </div>
    </header>
  );
}
