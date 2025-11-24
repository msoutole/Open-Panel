import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        alert(`Global search for: "${searchValue}" (Not implemented in demo)`);
    }
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notifications</span>
                        <button className="text-[10px] text-primary font-medium hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors">
                            <p className="text-sm font-medium text-slate-800">Deployment Failed</p>
                            <p className="text-xs text-slate-500 mt-0.5">Project "chatwoot" failed to build.</p>
                            <p className="text-[10px] text-slate-400 mt-1.5">2 minutes ago</p>
                        </div>
                        <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors">
                            <p className="text-sm font-medium text-slate-800">Backup Successful</p>
                            <p className="text-xs text-slate-500 mt-0.5">Database backup completed (124MB).</p>
                            <p className="text-[10px] text-slate-400 mt-1.5">1 hour ago</p>
                        </div>
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