import React, { useState, useEffect } from 'react';
import { Box, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
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
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

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
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-10">
        {/* Logo e Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary p-2.5 rounded-xl text-white shadow-md">
              <Box size={32} strokeWidth={2} />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-textPrimary tracking-tight leading-none">Open Panel</h1>
              <p className="text-xs text-textSecondary font-medium">by Soullabs</p>
            </div>
          </div>
          <h2 className="text-center text-base font-medium text-textSecondary mt-4">Sign In to your account</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-sm animate-in fade-in duration-200">
              <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
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
              <span className="text-textSecondary">Remember Me</span>
            </label>
            <a href="#" className="text-primary hover:underline font-medium">Forgot your password?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primaryHover active:bg-primaryActive text-white font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all transform active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-textSecondary">
          <p>© 2024 Soullabs. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-textPrimary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-textPrimary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
};