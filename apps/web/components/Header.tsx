import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, LogOut, Settings, UserCircle, CheckCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  onLogout?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Deployment Failed', message: 'Project "chatwoot" failed to build.', time: '2 minutes ago', read: false },
    { id: '2', title: 'Backup Successful', message: 'Database backup completed (124MB).', time: '1 hour ago', read: false }
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
      // setTimeout(() => setIsNotifOpen(false), 300);
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <h1 className="text-xl font-semibold text-textPrimary">{title}</h1>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-10 pr-4 py-2 w-64 bg-background border border-border rounded-lg text-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
            <button
                ref={notifRef}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative text-textSecondary hover:text-textPrimary transition-colors p-2 rounded-lg hover:bg-background ${isNotifOpen ? 'text-primary bg-background' : ''}`}
            >
                <Bell size={20} strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-card animate-pulse"></span>
                )}
            </button>

            {isNotifOpen && (
                <div ref={notifPanelRef} className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-xl border border-border py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                        <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-[10px] text-primary font-medium hover:underline flex items-center gap-1">
                                <CheckCheck size={12} strokeWidth={2} /> Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-textSecondary text-xs">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className={`px-4 py-3 hover:bg-background border-b border-border cursor-pointer transition-colors ${notif.read ? 'opacity-60' : ''}`}>
                                    <div className="flex justify-between items-start mb-0.5">
                                        <p className="text-sm font-medium text-textPrimary">{notif.title}</p>
                                        {!notif.read && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></span>}
                                    </div>
                                    <p className="text-xs text-textSecondary">{notif.message}</p>
                                    <p className="text-[10px] text-textSecondary mt-1.5">{notif.time}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-border relative" ref={profileRef}>
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-textPrimary group-hover:text-primary transition-colors">umoniem</p>
                <p className="text-xs text-textSecondary">admin@openpanel.dev</p>
            </div>
            <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-textSecondary border border-border group-hover:border-primary/50 transition-colors">
                <User size={20} strokeWidth={1.5} />
            </div>
            <ChevronDown size={16} strokeWidth={1.5} className={`text-textSecondary transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl shadow-xl border border-border py-1.5 animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-border mb-1">
                      <p className="text-sm font-bold text-textPrimary">Admin User</p>
                      <p className="text-xs text-textSecondary">Administrator</p>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-textSecondary hover:bg-background hover:text-primary flex items-center gap-2 transition-colors">
                      <UserCircle size={16} strokeWidth={1.5} /> Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-textSecondary hover:bg-background hover:text-primary flex items-center gap-2 transition-colors">
                      <Settings size={16} strokeWidth={1.5} /> Preferences
                  </button>
                  <div className="h-px bg-border my-1"></div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 flex items-center gap-2 transition-colors"
                  >
                      <LogOut size={16} strokeWidth={1.5} /> Sign Out
                  </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};