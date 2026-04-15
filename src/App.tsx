import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { OnboardingPage } from './pages/Onboarding';
import { HomePage } from './pages/Home';
import { SettingsPage } from './pages/Settings';
import { useAppStore, useClashStore } from './store';
import * as api from './api';

function App() {
  const { isFirstLaunch, setFirstLaunch } = useAppStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
    initClash();
  }, []);

  const initClash = async () => {
    try {
      const hasCore = await api.checkClashCore();
      if (!hasCore) {
        console.log('Downloading Clash Core...');
        await api.downloadClashCore();
      }
      const status = await api.getClashStatus();
      useClashStore.getState().setIsRunning(status.is_running);
      useClashStore.getState().setIsTunEnabled(status.is_tun_enabled);
    } catch (e) {
      console.error('Failed to init Clash:', e);
    }
  };

  const checkFirstLaunch = async () => {
    try {
      const value = await api.getConfig('is_first_launch');
      if (value === 'false') {
        setFirstLaunch(false);
      }
    } catch {}
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚡</div>
          <p className="text-gray-500 dark:text-gray-400">Clash Flash 加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {isFirstLaunch ? (
        <>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/home"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;
