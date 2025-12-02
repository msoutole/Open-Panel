import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Users, 
  Box,
  HardDrive,
  Activity
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Cluster', icon: LayoutDashboard, view: 'dashboard' as ViewState },
    { id: 'monitor', label: 'Monitoring', icon: Activity, view: 'monitor' as ViewState },
    { id: 'users', label: 'Identity (IAM)', icon: Users, view: 'users' as ViewState },
    { id: 'security', label: 'Security & Logs', icon: ShieldCheck, view: 'security' as ViewState },
    { id: 'backups', label: 'Backups', icon: HardDrive, view: 'backups' as ViewState },
    { id: 'settings', label: 'Settings', icon: Settings, view: 'settings' as ViewState },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full fixed left-0 top-0 z-20">
      {/* Logo e Branding */}
      <div className="p-6 flex items-center gap-3 border-b border-border">
        <div className="bg-primary p-2 rounded-xl text-white shadow-sm">
           <Box size={24} strokeWidth={2} />
        </div>
        <div>
           <span className="font-bold text-xl text-textPrimary tracking-tight block leading-none">Open Panel</span>
           <span className="text-xs text-textSecondary font-medium">by Soullabs</span>
        </div>
      </div>

      {/* Seção de navegação */}
      <div className="px-6 pt-6 pb-2">
         <p className="text-xs font-medium text-textSecondary uppercase tracking-wider">Infrastructure</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.view || (currentView === 'project_details' && item.view === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => item.view && onChangeView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textSecondary hover:bg-background hover:text-textPrimary'
              }`}
            >
              <item.icon size={20} strokeWidth={1.5} className={isActive ? 'text-white' : 'text-textSecondary'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer com status */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success"></div>
          <div>
            <p className="text-xs text-textPrimary font-medium">Traefik Proxy</p>
            <p className="text-xs text-textSecondary">v3.0.0 (Healthy)</p>
          </div>
        </div>
      </div>
    </div>
  );
};