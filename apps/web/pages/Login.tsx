import React, { useState, useEffect } from 'react';
import { Box, AlertCircle, Loader2, Shield, Key } from 'lucide-react';
import { useTranslations } from '../src/i18n/i18n-react';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { Button } from '../components/ui/Button';

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
              <Box size={24} strokeWidth={1.5} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-textPrimary tracking-tight leading-none">Open Panel</h1>
              <p className="text-xs text-textSecondary font-medium">by Soullabs</p>
            </div>
          </div>
          <h2 className="text-center text-base font-semibold text-textPrimary mb-1">{LL.auth.loginTitle()}</h2>
          <p className="text-center text-sm text-textSecondary">{LL.auth.loginSubtitle()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-sm animate-in fade-in duration-200">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            type="email"
            name="email"
            label={LL.common.email()}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={LL.auth.emailPlaceholder()}
            required
          />

          <Input
            type="password"
            name="password"
            label={LL.common.password()}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={LL.auth.passwordPlaceholder()}
            required
          />

          <div className="flex items-center justify-between">
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              label={LL.auth.rememberMe()}
            />
          </div>

          {/* 2FA Code Input */}
          {requires2FA && (
            <div className="p-4 bg-primaryLight border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} strokeWidth={1.5} className="text-primary" />
                <span className="font-medium text-textPrimary">Autenticação de Dois Fatores</span>
              </div>
              
              {!useBackupCode ? (
                <div className="space-y-3">
                  <Input
                    type="text"
                    label="Código do Autenticador"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTwoFactorCode(value);
                    }}
                    placeholder="000000"
                    className="text-center font-mono text-lg tracking-widest"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(true)}
                    className="text-sm text-primary hover:text-primaryHover flex items-center gap-2 transition-colors duration-200"
                  >
                    <Key size={14} strokeWidth={1.5} />
                    Usar código de backup
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    type="text"
                    label="Código de Backup"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    placeholder="12345678"
                    className="text-center font-mono text-lg tracking-widest"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(false)}
                    className="text-sm text-primary hover:text-primaryHover flex items-center gap-2 transition-colors duration-200"
                  >
                    <Shield size={14} strokeWidth={1.5} />
                    Usar código do autenticador
                  </button>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            isLoading={isLoading}
            className="w-full"
          >
            {LL.auth.login()}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-textSecondary">
          <p>© 2025 Soullabs. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};