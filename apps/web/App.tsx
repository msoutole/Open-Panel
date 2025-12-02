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
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToast';
import { useSidebar } from './hooks/useSidebar';
import { useTranslations } from './src/i18n/i18n-react';
import { ViewState, Project } from './types';
import { I18nProvider } from './src/i18n/i18n-react';

console.log('App.tsx loaded');

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
  const [isMobile, setIsMobile] = useState(false);
  
  // Sidebar state management
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  // All hooks must be called before any early returns
  const LL = useTranslations();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      if (isLoggedIn) {
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
            // Show onboarding if not completed OR if user must change password
            setShowOnboarding(!data.onboardingCompleted || data.mustChangePassword === true);
          }
        } catch (error) {
          console.error('Erro ao verificar status de onboarding:', error);
        }
      }
    };

    checkOnboarding();
  }, [isLoggedIn]);

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

  // Wrapper function to convert string to ViewState for Header navigation
  const handleNavigate = (view: string) => {
    handleViewChange(view as ViewState);
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
        return LL.appTitles.dashboard();
      case 'monitor':
        return LL.appTitles.systemMonitor();
      case 'settings':
        return LL.appTitles.systemSettings();
      case 'users':
        return LL.appTitles.identityManagement();
      case 'backups':
        return LL.appTitles.backupRecovery();
      case 'project_details':
        return LL.appTitles.projects();
      case 'security':
        return LL.appTitles.securityLogs();
      default:
        return LL.appTitles.panel();
    }
  };

  const sidebarWidth = isCollapsed ? 'ml-16' : 'ml-64';
  const contentMargin = isMobile ? 'ml-0' : sidebarWidth;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onChangeView={handleViewChange}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />

      <div className={`flex-1 ${contentMargin} flex flex-col min-w-0 relative transition-all duration-300 ease-in-out`}>
        <Header 
          title={getPageTitle(currentView)} 
          onLogout={handleLogout}
          onMenuToggle={toggleSidebar}
          onNavigate={handleNavigate}
          isMobile={isMobile}
        />

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
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;