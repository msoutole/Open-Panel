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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-10 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="relative">
            <button 
                ref={notifRef}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative text-slate-500 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-50 ${isNotifOpen ? 'text-primary bg-slate-50' : ''}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>
            
            {isNotifOpen && (
                <div ref={notifPanelRef} className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-[10px] text-primary font-medium hover:underline flex items-center gap-1">
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-slate-400 text-xs">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className={`px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors ${notif.read ? 'opacity-60' : ''}`}>
                                    <div className="flex justify-between items-start mb-0.5">
                                        <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                                        {!notif.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>}
                                    </div>
                                    <p className="text-xs text-slate-500">{notif.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1.5">{notif.time}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 relative" ref={profileRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors">umoniem</p>
                <p className="text-xs text-slate-500">admin@openpanel.dev</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200 group-hover:border-primary/50 transition-colors">
                <User size={20} />
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-sm font-bold text-slate-800">Admin User</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary flex items-center gap-2 transition-colors">
                      <UserCircle size={16} /> Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary flex items-center gap-2 transition-colors">
                      <Settings size={16} /> Preferences
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                      <LogOut size={16} /> Sign Out
                  </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};