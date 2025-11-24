import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProjectDetails } from './components/ProjectDetails';
import { SettingsView } from './components/SettingsView';
import { SecurityView } from './components/SecurityView';
import { Login } from './pages/Login';
import { GeminiChat } from './components/GeminiChat';
import { ViewState, Project } from './types';

const App: React.FC = () => {
  // Initialize state from localStorage to persist session across refreshes
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openpanel_session') === 'true';
    }
    return false;
  });
  
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

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('dashboard');
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
    <div className="flex h-screen bg-[#f8f9fa]">
      <Sidebar 
        currentView={currentView} 
        onChangeView={handleViewChange} 
      />
      
      <div className="flex-1 ml-64 flex flex-col min-w-0 relative">
        <Header title={getPageTitle(currentView)} onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto">
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

export default App;