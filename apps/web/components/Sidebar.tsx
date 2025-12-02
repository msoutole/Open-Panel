import React, { useState } from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Users, 
  Box,
  HardDrive,
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useTranslations } from '../src/i18n/i18n-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  isCollapsed, 
  onToggle,
  isMobile = false 
}) => {
  const LL = useTranslations();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { id: 'dashboard', label: LL.sidebar.cluster(), icon: LayoutDashboard, view: 'dashboard' as ViewState },
    { id: 'monitor', label: LL.sidebar.monitoring(), icon: Activity, view: 'monitor' as ViewState },
    { id: 'users', label: LL.sidebar.identity(), icon: Users, view: 'users' as ViewState },
    { id: 'security', label: LL.sidebar.security(), icon: ShieldCheck, view: 'security' as ViewState },
    { id: 'backups', label: LL.sidebar.backups(), icon: HardDrive, view: 'backups' as ViewState },
    { id: 'settings', label: LL.sidebar.settings(), icon: Settings, view: 'settings' as ViewState },
  ];

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';
  const sidebarClasses = `
    ${sidebarWidth}
    bg-card 
    border-r 
    border-border 
    flex 
    flex-col 
    h-full 
    fixed 
    left-0 
    top-0 
    z-30
    transition-all 
    duration-300 
    ease-in-out
    ${isMobile && isCollapsed ? '-translate-x-full' : ''}
  `;

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <div className={sidebarClasses}>
        {/* Logo e Branding */}
        <div className={`p-4 sm:p-6 flex items-center gap-3 border-b border-border ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="bg-primary p-2 rounded-xl text-white shadow-sm flex-shrink-0">
            <Box size={24} strokeWidth={2} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-xl text-textPrimary tracking-tight block leading-none">Open Panel</span>
              <span className="text-xs text-textSecondary font-medium">by Soullabs</span>
            </div>
          )}
        </div>

        {/* Botão Toggle */}
        <div className={`px-4 pt-4 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={onToggle}
            className={`
              w-full 
              flex 
              items-center 
              justify-center
              gap-2
              px-3 
              py-2 
              rounded-lg 
              text-sm 
              font-medium 
              text-textSecondary 
              hover:bg-background 
              hover:text-textPrimary 
              transition-all 
              duration-200
              ${isCollapsed ? 'px-2' : 'justify-between'}
            `}
            aria-label={isCollapsed ? LL.sidebar.expandSidebar() : LL.sidebar.collapseSidebar()}
          >
            {isCollapsed ? (
              <Menu size={20} strokeWidth={1.5} />
            ) : (
              <>
                <span className="text-xs font-medium text-textSecondary uppercase tracking-wider">{LL.sidebar.menu()}</span>
                <ChevronLeft size={16} strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>

        {/* Seção de navegação */}
        {!isCollapsed && (
          <div className="px-6 pt-4 pb-2">
            <p className="text-xs font-medium text-textSecondary uppercase tracking-wider">{LL.sidebar.infrastructure()}</p>
          </div>
        )}

        <nav className={`flex-1 px-2 sm:px-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : ''}`}>
          {menuItems.map((item) => {
            const isActive = currentView === item.view || (currentView === 'project_details' && item.view === 'dashboard');
            const isHovered = hoveredItem === item.id;
            
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => item.view && onChangeView(item.view)}
                  className={`
                    w-full 
                    flex 
                    items-center 
                    gap-3 
                    px-4 
                    py-3 
                    rounded-lg 
                    text-sm 
                    font-medium 
                    transition-all 
                    duration-200 
                    mb-1
                    ${isCollapsed ? 'justify-center px-2' : ''}
                    ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-textSecondary hover:bg-background hover:text-textPrimary'
                    }
                  `}
                  aria-label={isCollapsed ? item.label : undefined}
                >
                  {React.createElement(item.icon, {
                    size: 20,
                    strokeWidth: 1.5,
                    className: `flex-shrink-0 ${isActive ? 'text-white' : 'text-textSecondary'}`
                  })}
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>

                {/* Tooltip quando colapsado */}
                {isCollapsed && isHovered && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg z-50 whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">
                    <span className="text-sm font-medium text-textPrimary">{item.label}</span>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-card border-l border-b border-border rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer com status */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-xs text-textPrimary font-medium truncate">Traefik Proxy</p>
                <p className="text-xs text-textSecondary truncate">v3.0.0 (Healthy)</p>
              </div>
            </div>
          </div>
        )}

        {/* Status compacto quando colapsado */}
        {isCollapsed && (
          <div className="p-4 border-t border-border bg-background flex justify-center">
            <div className="w-2 h-2 rounded-full bg-success"></div>
          </div>
        )}
      </div>
    </>
  );
};