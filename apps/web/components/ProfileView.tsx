import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Key, Clock, User as UserIcon, Lock } from 'lucide-react';
import { useTranslations } from '../src/i18n/i18n-react';
import { TwoFactorSetup } from './TwoFactorSetup';
import { useToast } from '../hooks/useToast';
import { User as UserType } from '../types';

export const ProfileView: React.FC = () => {
  const LL = useTranslations();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [show2FASetup, setShow2FASetup] = useState(false);

  useEffect(() => {
    // Load user from local storage
    const storedUser = localStorage.getItem('openpanel_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
    
    // TODO: Fetch fresh user data from /api/auth/me
  }, []);

  const handle2FAStatusChange = (enabled: boolean) => {
    if (user) {
      const updatedUser = { ...user, twoFactorEnabled: enabled };
      setUser(updatedUser);
      localStorage.setItem('openpanel_user', JSON.stringify(updatedUser));
      
      showToast({
        type: 'success',
        title: enabled ? '2FA Ativado' : '2FA Desativado',
        message: enabled 
          ? 'Sua conta agora está mais segura.' 
          : 'Autenticação de dois fatores foi removida.'
      });
    }
  };

  if (!user) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{LL.profile.title()}</h2>
        <p className="text-gray-500 mt-1">{LL.profile.subtitle()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-4 border-4 border-white shadow-sm">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{user.email}</p>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100 uppercase">
                {user.role || 'User'}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock size={14} />
                  Último Login
                </span>
                <span className="font-medium text-gray-900">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Shield size={14} />
                  Status
                </span>
                <span className="text-green-600 font-medium">Ativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Security Section */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Lock className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-900">{LL.profile.security()}</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 2FA Toggle */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${user.twoFactorEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{LL.profile.twoFactorAuth()}</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-md">
                        {LL.profile.twoFactorDesc()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShow2FASetup(!show2FASetup)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      user.twoFactorEnabled
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {user.twoFactorEnabled ? 'Gerenciar' : 'Ativar'}
                  </button>
                </div>

                {(show2FASetup || user.twoFactorEnabled) && (
                  <div className="mt-4 pl-0 md:pl-14 animate-in fade-in slide-in-from-top-2">
                    <TwoFactorSetup 
                      isEnabled={!!user.twoFactorEnabled}
                      onStatusChange={handle2FAStatusChange}
                      onClose={() => setShow2FASetup(false)}
                    />
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Password Change (Placeholder) */}
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{LL.profile.changePassword()}</h4>
                    <p className="text-sm text-gray-500">Atualize sua senha de acesso.</p>
                  </div>
                </div>
                <button disabled className="text-sm text-gray-400 cursor-not-allowed px-3 py-1.5 border border-gray-200 rounded">
                  Em breve
                </button>
              </div>
            </div>
          </section>

          {/* Sessions Section (Placeholder) */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Clock className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-900">{LL.profile.sessions()}</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sessão Atual</p>
                    <p className="text-xs text-gray-500">Chrome em Windows • Agora</p>
                  </div>
                </div>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">Ativa</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
