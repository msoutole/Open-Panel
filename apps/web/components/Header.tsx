import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, LogOut, Settings, UserCircle, CheckCheck, Menu, Trash2 } from 'lucide-react';
import { useTranslations } from '../src/i18n/i18n-react';

interface HeaderProps {
  title: string;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  onNavigate?: (view: string) => void;
  isMobile?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onLogout, onMenuToggle, onNavigate, isMobile = false }) => {
  const LL = useTranslations();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Falha no Deploy', message: 'O projeto "chatwoot" falhou ao construir.', time: 'há 2 minutos', read: false },
    { id: '2', title: 'Backup Bem-sucedido', message: 'Backup do banco de dados concluído (124MB).', time: 'há 1 hora', read: false }
  ]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLButtonElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node) && 
          notifPanelRef.current && !notifPanelRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        if (searchValue.trim()) {
            alert(`Searching for: "${searchValue}"... \n(In a real app, this would route to a global search results page)`);
        }
    }
  };
  
  const handleMarkAllRead = () => {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
      setNotifications([]);
      setIsNotifOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = 'Admin User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Menu Button */}
        {isMobile && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-background transition-colors duration-200 lg:hidden"
            aria-label={LL.header.toggleMenu()}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        )}
        <h1 className="text-lg sm:text-xl font-semibold text-textPrimary truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} strokeWidth={1.5} />
          <input
            type="text"
            placeholder={LL.header.searchPlaceholder()}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-10 pr-4 py-2 w-64 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
            <button
                ref={notifRef}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-label={LL.header.notifications()}
                className={`relative text-textSecondary hover:text-textPrimary transition-colors duration-200 p-2 rounded-lg hover:bg-background ${isNotifOpen ? 'text-primary bg-background' : ''}`}
            >
                <Bell size={20} strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-card"></span>
                )}
            </button>

            {isNotifOpen && (
                <div 
                  ref={notifPanelRef} 
                  className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-card rounded-xl shadow-lg border border-border py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="px-4 py-3 border-b border-border flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">{LL.header.notifications()}</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button 
                                  onClick={handleMarkAllRead} 
                                  className="text-[10px] text-primary font-medium hover:underline flex items-center gap-1 transition-colors"
                                  aria-label={LL.header.markAllRead()}
                                >
                                    <CheckCheck size={12} strokeWidth={2} /> {LL.header.markAllRead()}
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button 
                                  onClick={handleClearAll} 
                                  className="text-[10px] text-error font-medium hover:underline flex items-center gap-1 transition-colors"
                                  aria-label={LL.header.clearAll()}
                                  title={LL.header.clearAll()}
                                >
                                    <Trash2 size={12} strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto scroll-smooth">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-textSecondary text-sm">
                                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                <p>{LL.header.noNotifications()}</p>
                            </div>
                        ) : (
                            notifications.map((notif, index) => (
                                <div 
                                  key={notif.id} 
                                  className={`px-4 py-3 hover:bg-background cursor-pointer transition-colors duration-150 ${
                                    index < notifications.length - 1 ? 'border-b border-border' : ''
                                  } ${notif.read ? 'opacity-70' : 'bg-primary/5'}`}
                                >
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${notif.read ? 'text-textSecondary' : 'text-textPrimary'}`}>
                                                {notif.title}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-textSecondary leading-relaxed mb-1">{notif.message}</p>
                                    <p className="text-[10px] text-textSecondary font-medium">{notif.time}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-6 border-l border-border relative" ref={profileRef}>
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label={LL.header.userMenu()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsProfileOpen(!isProfileOpen);
              }
            }}
          >
            <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-textPrimary group-hover:text-primary transition-colors">umoniem</p>
                <p className="text-xs text-textSecondary">admin@openpanel.dev</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white border-2 border-card shadow-sm group-hover:shadow-md transition-all duration-200">
                <span className="text-xs sm:text-sm font-semibold">{getUserInitials()}</span>
            </div>
            <ChevronDown 
              size={16} 
              strokeWidth={1.5} 
              className={`text-textSecondary transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''} hidden sm:block`} 
            />
          </div>

          {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-card rounded-xl shadow-lg border border-border py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Profile Header */}
                  <div className="px-4 py-4 border-b border-border">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white border-2 border-card shadow-sm">
                              <span className="text-base font-semibold">{getUserInitials()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-textPrimary truncate">Admin User</p>
                              <p className="text-xs text-textSecondary truncate">admin@openpanel.dev</p>
                          </div>
                      </div>
                      <div className="px-2 py-1.5 bg-background rounded-lg">
                          <p className="text-xs font-medium text-textSecondary">{LL.header.administrator()}</p>
                      </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1.5">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          onNavigate?.('users');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-textSecondary hover:bg-background hover:text-primary flex items-center gap-3 transition-colors duration-150"
                        aria-label={LL.header.profileSettings()}
                      >
                          <UserCircle size={18} strokeWidth={1.5} /> 
                          <span>{LL.header.profileSettings()}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          onNavigate?.('settings');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-textSecondary hover:bg-background hover:text-primary flex items-center gap-3 transition-colors duration-150"
                        aria-label={LL.header.preferences()}
                      >
                          <Settings size={18} strokeWidth={1.5} /> 
                          <span>{LL.header.preferences()}</span>
                      </button>
                  </div>
                  
                  {/* Separator */}
                  <div className="h-px bg-border my-1"></div>
                  
                  {/* Logout */}
                  <div className="px-1.5 py-1">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 flex items-center gap-3 transition-colors duration-150 rounded-lg"
                        aria-label={LL.header.signOut()}
                      >
                        <LogOut size={18} strokeWidth={1.5} /> 
                        <span>{LL.header.signOut()}</span>
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};