import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { OnboardingPage } from './pages/Onboarding';
import { HomePage } from './pages/Home';
import { SettingsPage } from './pages/Settings';
import { useAppStore } from './store';

function App() {
  const { isFirstLaunch } = useAppStore();

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
