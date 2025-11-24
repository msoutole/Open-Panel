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
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg text-white shadow-lg shadow-blue-200">
           <Box size={24} strokeWidth={2.5} />
        </div>
        <div>
           <span className="font-bold text-xl text-slate-800 tracking-tight block leading-none">OpenPanel</span>
           <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Orchestrator V2</span>
        </div>
      </div>

      <div className="px-6 mb-2">
         <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Infrastructure</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.view || (currentView === 'project_details' && item.view === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => item.view && onChangeView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Traefik Proxy</p>
            <p className="text-xs text-slate-400">v3.0.0 (Healthy)</p>
          </div>
        </div>
      </div>
    </div>
  );
};