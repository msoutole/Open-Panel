import React, { useState, useEffect } from 'react';
import { Box, AlertCircle, Loader2, Shield, Key } from 'lucide-react';
import { useTranslations } from '../src/i18n/i18n-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const LL = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  // Recuperar email salvo ao carregar
  useEffect(() => {
    const savedEmail = localStorage.getItem('openpanel_email');
    const rememberFlag = localStorage.getItem('openpanel_remember');

    if (rememberFlag === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Funções de validação
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6; // Mínimo 6 caracteres
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!validateEmail(email)) {
      setError(LL.validation.email());
      return;
    }

    if (!validatePassword(password)) {
      setError(LL.validation.minLength({ field: LL.common.password(), min: 6 }));
      return;
    }

    setIsLoading(true);

    try {
      // Call real API - use relative paths in development to leverage Vite proxy
      const getApiBaseUrl = (): string => {
        const envUrl = import.meta.env.VITE_API_URL;
        const isDev = import.meta.env.DEV;
        return isDev ? '' : (envUrl || '');
      };
      
      // Build request body with optional 2FA code
      const requestBody: any = { email, password };
      if (requires2FA) {
        if (useBackupCode) {
          requestBody.backupCode = backupCode;
        } else {
          requestBody.twoFactorCode = twoFactorCode;
        }
      }
      
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if 2FA is required
        if (data.requires2FA) {
          setRequires2FA(true);
          setError('');
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens and user data
      localStorage.setItem('openpanel_access_token', data.accessToken);
      localStorage.setItem('openpanel_refresh_token', data.refreshToken);
      localStorage.setItem('openpanel_user', JSON.stringify(data.user));

      // Store credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('openpanel_remember', 'true');
        localStorage.setItem('openpanel_email', email);
      } else {
        localStorage.removeItem('openpanel_remember');
        localStorage.removeItem('openpanel_email');
      }

      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : LL.auth.invalidCredentials());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-8">
        {/* Logo e Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary p-2 rounded-lg text-white">
              <Box size={24} strokeWidth={2} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-textPrimary tracking-tight leading-none">Open Panel</h1>
              <p className="text-xs text-textSecondary font-medium">by Soullabs</p>
            </div>
          </div>
          <h2 className="text-center text-base font-semibold text-textPrimary mb-1">{LL.auth.loginTitle()}</h2>
          <p className="text-center text-sm text-textSecondary">{LL.auth.loginSubtitle()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-sm animate-in fade-in duration-200">
              <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-1.5">
              {LL.common.email()}
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={LL.auth.emailPlaceholder()}
              required
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-card text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-1.5">
              {LL.common.password()}
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={LL.auth.passwordPlaceholder()}
              required
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-card text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-border focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-textSecondary text-sm">{LL.auth.rememberMe()}</span>
            </label>
          </div>

          {/* 2FA Code Input */}
          {requires2FA && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-blue-600" />
                <span className="font-medium text-blue-900">Autenticação de Dois Fatores</span>
              </div>
              
              {!useBackupCode ? (
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1.5">
                    Código do Autenticador
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTwoFactorCode(value);
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-2.5 border border-blue-300 rounded-lg text-sm bg-white text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all text-center font-mono text-lg tracking-widest"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(true)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Key size={14} />
                    Usar código de backup
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1.5">
                    Código de Backup
                  </label>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    placeholder="12345678"
                    className="w-full px-4 py-2.5 border border-blue-300 rounded-lg text-sm bg-white text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all text-center font-mono text-lg tracking-widest"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(false)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Shield size={14} />
                    Usar código do autenticador
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primaryHover active:bg-primaryActive text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-primary/10"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                {LL.common.loading()}
              </>
            ) : (
              LL.auth.login()
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-textSecondary">
          <p>© 2025 Soullabs. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};