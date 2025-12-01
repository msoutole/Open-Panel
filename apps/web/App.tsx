import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProjectDetails } from './components/ProjectDetails';
import { SettingsView } from './components/SettingsView';
import { SecurityView } from './components/SecurityView';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { GeminiChat } from './components/GeminiChat';
import { ViewState, Project } from './types';
import { I18nProvider } from './src/i18n/i18n-react';

const AppContent: React.FC = () => {
  // Initialize state from localStorage to persist session across refreshes
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openpanel_session') === 'true';
    }
    return false;
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Sync session state changes to localStorage
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('openpanel_session', 'true');
    } else {
      localStorage.removeItem('openpanel_session');
    }
  }, [isLoggedIn]);

  // Check onboarding status after login
  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoggedIn && !showOnboarding) {
        try {
          // Use relative paths in development to leverage Vite proxy
          const getApiBaseUrl = (): string => {
            const envUrl = import.meta.env.VITE_API_URL;
            const isDev = import.meta.env.DEV;
            return isDev ? '' : (envUrl || '');
          };
          const token = localStorage.getItem('openpanel_access_token');

          const response = await fetch(`${getApiBaseUrl()}/api/onboarding/status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setShowOnboarding(!data.onboardingCompleted);
          }
        } catch (error) {
          console.error('Erro ao verificar status de onboarding:', error);
        }
      }
    };

    checkOnboarding();
  }, [isLoggedIn, showOnboarding]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    if (view !== 'project_details') {
      setSelectedProject(null);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('project_details');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const getPageTitle = (view: ViewState) => {
    switch (view) {
      case 'dashboard':
        return 'Dashboard';
      case 'monitor':
        return 'System Monitor';
      case 'settings':
        return 'System Settings';
      case 'users':
        return 'Identity Management';
      case 'backups':
        return 'Backup & Recovery';
      case 'project_details':
        return 'Projects';
      case 'security':
        return 'Security & Logs';
      default:
        return 'Panel';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onChangeView={handleViewChange}
      />

      <div className="flex-1 ml-64 flex flex-col min-w-0 relative">
        <Header title={getPageTitle(currentView)} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto bg-background">
          {(currentView === 'dashboard' || currentView === 'monitor') && (
            <DashboardView
              onProjectSelect={handleProjectSelect}
              view={currentView as 'dashboard' | 'monitor'}
            />
          )}

          {currentView === 'project_details' && selectedProject && (
            <ProjectDetails
              project={selectedProject}
              onBack={() => handleViewChange('dashboard')}
            />
          )}

          {(currentView === 'settings' || currentView === 'users' || currentView === 'backups') && (
            <SettingsView view={currentView as 'settings' | 'users' | 'backups'} />
          )}

          {currentView === 'security' && (
             <SecurityView />
          )}
        </main>

        <GeminiChat />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;