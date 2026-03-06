import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import Dashboard from './components/Dashboard';
import ErrorPopup from './components/ErrorPopup';
import type { AppErrorType } from './components/ErrorPopup';
import AuthModal from './components/AuthModal';
import InstructionsModal from './components/InstructionsModal';
import FloatingActions from './components/FloatingActions';
import { startAppMusic, stopAppMusic } from './lib/sounds';
import { Routes, Route, Navigate } from 'react-router-dom';

// Main App Component
function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [apiError, setApiError] = useState<AppErrorType>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      startAppMusic();
    }
    return () => stopAppMusic();
  }, [showSplash]);

  useEffect(() => {
    const errorHandler = (e: Event) => setApiError((e as CustomEvent<AppErrorType>).detail);
    const settingsHandler = () => setSettingsOpen(true);
    const authHandler = () => setAuthModalOpen(true);

    window.addEventListener('app-api-error', errorHandler);
    window.addEventListener('open-settings', settingsHandler);
    window.addEventListener('open-auth-modal', authHandler);

    return () => {
      window.removeEventListener('app-api-error', errorHandler);
      window.removeEventListener('open-settings', settingsHandler);
      window.removeEventListener('open-auth-modal', authHandler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-cyber-dark)] text-white selection:bg-[#0ff]/30 selection:text-[#0ff]">
      {showSplash
        ? <SplashScreen onComplete={() => setShowSplash(false)} />
        : (
          <Routes>
            <Route path="/" element={
              <Dashboard
                forceSettingsOpen={settingsOpen}
                onSettingsClosed={() => setSettingsOpen(false)}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            } />
            <Route path="/workspace" element={
              <Dashboard
                forceSettingsOpen={settingsOpen}
                onSettingsClosed={() => setSettingsOpen(false)}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )
      }

      <ErrorPopup
        type={apiError}
        onClose={() => setApiError(null)}
        onOpenSettings={() => { setApiError(null); setSettingsOpen(true); }}
        onAction={() => window.dispatchEvent(new CustomEvent('show-rewritten-tab'))}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <InstructionsModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <FloatingActions onOpenHelp={() => setHelpOpen(true)} />
    </div>
  );
}

export default App;
