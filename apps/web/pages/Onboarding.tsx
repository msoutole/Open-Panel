import React, { useState, useMemo } from 'react';
import { Settings, Key, Lock, Check, AlertCircle, Loader2, ExternalLink, ShieldCheck, ShieldAlert, Shield, Sun, Moon, Palette, Sparkles, Box, Github, Server } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslations } from '../src/i18n/i18n-react';
import { LanguageSelector } from '../components/LanguageSelector';

interface OnboardingProps {
  onComplete: () => void;
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  requiresApiKey: boolean;
  optionalApiKey?: boolean;
  requiresUrl?: boolean;
  helpUrl: string;
  helpText?: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const LL = useTranslations();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Record<string, { apiKey?: string; apiUrl?: string; validated: boolean }>>({});
  const [defaultProvider, setDefaultProvider] = useState<string>('');
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Use relative paths in development to leverage Vite proxy, absolute URLs in production if needed
  const getApiBaseUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_URL;
    const isDev = import.meta.env.DEV;
    return isDev ? '' : (envUrl || '');
  };

  // AI Providers usando i18n
  const AI_PROVIDERS: AIProvider[] = useMemo(() => [
    {
      id: 'gemini',
      name: LL.onboarding.step2.providers.gemini.name(),
      description: LL.onboarding.step2.providers.gemini.description(),
      icon: Sparkles,
      requiresApiKey: true,
      helpUrl: 'https://makersuite.google.com/app/apikey',
      helpText: LL.onboarding.step2.providers.gemini.helpText()
    },
    {
      id: 'claude',
      name: LL.onboarding.step2.providers.claude.name(),
      description: LL.onboarding.step2.providers.claude.description(),
      icon: Box,
      requiresApiKey: true,
      helpUrl: 'https://console.anthropic.com/settings/keys',
      helpText: LL.onboarding.step2.providers.claude.helpText()
    },
    {
      id: 'github',
      name: LL.onboarding.step2.providers.github.name(),
      description: LL.onboarding.step2.providers.github.description(),
      icon: Github,
      requiresApiKey: true,
      helpUrl: 'https://github.com/settings/tokens',
      helpText: LL.onboarding.step2.providers.github.helpText()
    },
    {
      id: 'ollama',
      name: LL.onboarding.step2.providers.ollama.name(),
      description: LL.onboarding.step2.providers.ollama.description(),
      icon: Server,
      requiresApiKey: false,
      optionalApiKey: true,
      requiresUrl: true,
      helpUrl: 'https://ollama.com',
      helpText: LL.onboarding.step2.providers.ollama.helpText()
    },
  ], [LL]);

  // Calcular força da senha
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '', icon: Shield };

    let score = 0;
    const checks = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };

    score += checks.length ? 1 : 0;
    score += checks.uppercase ? 1 : 0;
    score += checks.lowercase ? 1 : 0;
    score += checks.number ? 1 : 0;
    score += checks.special ? 1 : 0;

    if (score <= 2) return { score, label: LL.onboarding.step3.strengthWeak(), color: 'bg-error', icon: ShieldAlert };
    if (score <= 3) return { score, label: LL.onboarding.step3.strengthMedium(), color: 'bg-warning', icon: Shield };
    if (score <= 4) return { score, label: LL.onboarding.step3.strengthStrong(), color: 'bg-success', icon: ShieldCheck };
    return { score, label: LL.onboarding.step3.strengthVeryStrong(), color: 'bg-success', icon: ShieldCheck };
  }, [newPassword, LL]);

  // Validação completa para habilitar o botão
  const isFormValid = useMemo(() => {
    // Verificar senha
    if (!newPassword || newPassword.length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    if (passwordStrength.score < 4) return false;

    // Verificar provedores de IA
    const validatedProviders = Object.entries(selectedProviders).filter(([_, v]) => v.validated);
    if (validatedProviders.length === 0) return false;
    if (!defaultProvider) return false;

    return true;
  }, [newPassword, confirmPassword, passwordStrength.score, selectedProviders, defaultProvider]);

  const validateProvider = async (providerId: string) => {
    setValidating(providerId);
    setError('');

    const providerName = AI_PROVIDERS.find(p => p.id === providerId)?.name || providerId;
    const toastId = toast.loading(LL.onboarding.step2.validating({ provider: providerName }));

    try {
      let provider = selectedProviders[providerId];

      // Initialize provider with defaults if not yet added
      if (!provider) {
        const providerConfig = AI_PROVIDERS.find(p => p.id === providerId);
        if (!providerConfig) {
          throw new Error('Provider configuration not found.');
        }
        provider = {
          apiKey: providerConfig.requiresApiKey ? '' : undefined,
          apiUrl: providerConfig.requiresUrl ? 'http://localhost:11434' : undefined,
          validated: false
        };
        setSelectedProviders(prev => {
          const updated: Record<string, { apiKey?: string; apiUrl?: string; validated: boolean }> = { ...prev };
          if (provider) {
            updated[providerId] = provider;
          }
          return updated;
        });
      }

      const token = localStorage.getItem('openpanel_access_token');

      const response = await fetch(`${getApiBaseUrl()}/api/onboarding/validate-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: providerId,
          apiKey: provider.apiKey,
          apiUrl: provider.apiUrl,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setSelectedProviders(prev => ({
          ...prev,
          [providerId]: { ...prev[providerId], validated: true },
        }));
        toast.success(LL.onboarding.step2.validationSuccess({ provider: providerName }), { id: toastId });
      } else {
        const errorMsg = LL.onboarding.step2.validationError({ provider: providerName, error: data.error || 'Validation failed' });
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
      }
    } catch (err) {
      const errorMsg = LL.onboarding.step2.validationError({ provider: providerName, error: err instanceof Error ? err.message : 'Unknown error' });
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setValidating(null);
    }
  };

  const handleComplete = async () => {
    setError('');

    // Validar senha (ordem deve corresponder à lógica do isFormValid)
    // 1. Verificar se senha está vazia primeiro
    if (!newPassword) {
      const errorMsg = LL.onboarding.errors.passwordRequired();
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // 2. Verificar comprimento mínimo
    if (newPassword.length < 8) {
      const errorMsg = LL.onboarding.errors.passwordTooShort();
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // 3. Verificar se senhas coincidem
    if (newPassword !== confirmPassword) {
      const errorMsg = LL.onboarding.errors.passwordMismatch();
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // 4. Verificar força da senha (apenas se senha não estiver vazia)
    if (passwordStrength.score < 4) {
      const errorMsg = LL.onboarding.errors.passwordWeak();
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Verificar se há pelo menos um provedor validado
    const validatedProviders = Object.entries(selectedProviders).filter(([_, v]) => v.validated);
    if (validatedProviders.length === 0) {
      const errorMsg = LL.onboarding.errors.noProvider();
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!defaultProvider) {
      const errorMsg = LL.onboarding.errors.noDefaultProvider();
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(LL.onboarding.completing());

    try {
      const token = localStorage.getItem('openpanel_access_token');

      const response = await fetch(`${getApiBaseUrl()}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          theme,
          newPassword: newPassword || undefined,
          defaultProvider,
          aiProviders: validatedProviders.map(([provider, config]) => ({
            provider,
            apiKey: config.apiKey,
            apiUrl: config.apiUrl,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || LL.onboarding.errors.completionFailed());
      }

      // Aplicar tema imediatamente
      document.documentElement.classList.toggle('dark', theme === 'dark');

      toast.success(LL.onboarding.success(), { id: toastId, duration: 4000 });

      // Pequeno delay para mostrar o toast de sucesso
      setTimeout(() => onComplete(), 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : LL.onboarding.errors.completionFailed();
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-3xl bg-card rounded-xl shadow-lg border border-border p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1" />
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
                <Settings size={24} strokeWidth={2} className="text-white" />
              </div>
              <div className="flex-1 flex justify-end">
                <LanguageSelector variant="dropdown" showLabel={false} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-textPrimary mb-2">{LL.onboarding.title()}</h1>
            <p className="text-sm text-textSecondary">{LL.onboarding.subtitle()}</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= s ? 'bg-primary text-white' : 'bg-background border-2 border-border text-textSecondary'
                } font-semibold text-sm transition-all duration-200`}>
                  {step > s ? <Check size={16} strokeWidth={2} /> : s}
                </div>
                {s < 3 && <div className={`w-12 md:w-16 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'} transition-all duration-200`} />}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} strokeWidth={1.5} className="text-error shrink-0 mt-0.5" />
              <span className="text-sm text-error">{error}</span>
            </div>
          )}

          {/* Step 1: Tema */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                  <Palette size={20} strokeWidth={1.5} /> {LL.onboarding.step1.title()}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-6 border-2 rounded-lg transition-all text-left ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-textSecondary hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        theme === 'light' ? 'bg-primary text-white' : 'bg-background text-textSecondary'
                      }`}>
                        <Sun size={20} strokeWidth={1.5} />
                      </div>
                      <div className="font-semibold text-textPrimary">{LL.onboarding.step1.light()}</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-6 border-2 rounded-lg transition-all text-left ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-textSecondary hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        theme === 'dark' ? 'bg-primary text-white' : 'bg-background text-textSecondary'
                      }`}>
                        <Moon size={20} strokeWidth={1.5} />
                      </div>
                      <div className="font-semibold text-textPrimary">{LL.onboarding.step1.dark()}</div>
                    </div>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-2.5 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                {LL.common.next()}
              </button>
            </div>
          )}

          {/* Step 2: Provedores de IA */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-textPrimary mb-2 flex items-center gap-2">
                  <Key size={20} strokeWidth={1.5} /> {LL.onboarding.step2.title()}
                </h2>
                <p className="text-sm text-textSecondary mb-4">
                  {LL.onboarding.step2.subtitle()}
                </p>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {AI_PROVIDERS.map((provider) => (
                    <div key={provider.id} className="border border-border rounded-lg p-4 bg-background">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-textSecondary">
                            <provider.icon size={20} strokeWidth={1.5} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-textPrimary">{provider.name}</h3>
                            <p className="text-xs text-textSecondary">{provider.description}</p>
                          </div>
                        </div>
                        {selectedProviders[provider.id]?.validated && (
                          <Check size={20} className="text-success" strokeWidth={2} />
                        )}
                      </div>

                      {provider.requiresApiKey && (
                        <div className="mt-3 space-y-2">
                          <input
                            type="password"
                            placeholder={LL.onboarding.step2.apiKeyPlaceholder()}
                            value={selectedProviders[provider.id]?.apiKey || ''}
                            onChange={(e) => setSelectedProviders(prev => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], apiKey: e.target.value, validated: false },
                            }))}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-card text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                          />
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <button
                              onClick={() => validateProvider(provider.id)}
                              disabled={!selectedProviders[provider.id]?.apiKey || validating === provider.id}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover active:bg-primaryActive shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary/10"
                            >
                              {validating === provider.id && <Loader2 size={16} strokeWidth={2} className="animate-spin" />}
                              {LL.onboarding.step2.validate()}
                            </button>
                            <a
                              href={provider.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                              {provider.helpText} <ExternalLink size={14} strokeWidth={1.5} />
                            </a>
                          </div>
                        </div>
                      )}

                      {provider.requiresUrl && (
                        <div className="mt-3 space-y-2">
                          <input
                            type="url"
                            placeholder={LL.onboarding.step2.urlPlaceholder()}
                            value={selectedProviders[provider.id]?.apiUrl || 'http://localhost:11434'}
                            onChange={(e) => setSelectedProviders(prev => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], apiUrl: e.target.value, validated: false },
                            }))}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-card text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                          />
                          <button
                            onClick={() => validateProvider(provider.id)}
                            disabled={validating === provider.id}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover active:bg-primaryActive shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary/10"
                          >
                            {validating === provider.id && <Loader2 size={16} className="animate-spin" />}
                            {LL.onboarding.step2.validateConnection()}
                          </button>
                          <p className="text-xs text-textSecondary bg-background p-2 rounded border border-border" dangerouslySetInnerHTML={{ __html: LL.onboarding.step2.ollamaNote() }} />
                        </div>
                      )}

                      {provider.optionalApiKey && (
                        <div className="mt-3 space-y-2 pt-3 border-t border-border">
                          <label className="block text-sm font-medium text-textPrimary mb-1">
                            {LL.onboarding.step2.apiKeyPlaceholder()} (opcional)
                          </label>
                          <input
                            type="password"
                            placeholder={LL.onboarding.step2.apiKeyPlaceholder()}
                            value={selectedProviders[provider.id]?.apiKey || ''}
                            onChange={(e) => setSelectedProviders(prev => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], apiKey: e.target.value, validated: false },
                            }))}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-card text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                          />
                          <p className="text-xs text-textSecondary">Deixe em branco para usar localmente, ou adicione a API key se usar um serviço em nuvem</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {Object.keys(selectedProviders).filter(k => selectedProviders[k]?.validated).length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      {LL.onboarding.step2.defaultProvider()} *
                    </label>
                    <select
                      value={defaultProvider}
                      onChange={(e) => setDefaultProvider(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-card text-textPrimary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    >
                      <option value="">{LL.onboarding.step2.selectDefault()}</option>
                      {Object.keys(selectedProviders)
                        .filter(k => selectedProviders[k]?.validated)
                        .map(k => (
                          <option key={k} value={k}>
                            {AI_PROVIDERS.find(p => p.id === k)?.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border-2 border-border text-textSecondary font-medium rounded-lg hover:bg-background transition-all"
                >
                  {LL.common.back()}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={Object.keys(selectedProviders).filter(k => selectedProviders[k]?.validated).length === 0 || !defaultProvider}
                  className="flex-1 py-2.5 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  {LL.common.next()}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Alterar Senha */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-textPrimary mb-2 flex items-center gap-2">
                  <Lock size={20} strokeWidth={1.5} /> {LL.onboarding.step3.title()}
                </h2>
                <p className="text-sm text-textSecondary mb-4">
                  {LL.onboarding.step3.subtitle()}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-1.5">
                      {LL.onboarding.step3.newPassword()} *
                    </label>
                    <input
                      type="password"
                      placeholder={LL.onboarding.step3.newPasswordPlaceholder()}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-card text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-1.5">
                      {LL.onboarding.step3.confirmPassword()} *
                    </label>
                    <input
                      type="password"
                      placeholder={LL.onboarding.step3.confirmPasswordPlaceholder()}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-card text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-4 p-4 bg-background border border-border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-textPrimary">{LL.onboarding.step3.passwordStrength()}</span>
                        <div className="flex items-center gap-2">
                          {passwordStrength.icon && React.createElement(passwordStrength.icon, {
                            size: 18,
                            strokeWidth: 1.5,
                            className: passwordStrength.score <= 2 ? 'text-error' : passwordStrength.score <= 3 ? 'text-warning' : 'text-success'
                          })}
                          <span className={`text-sm font-semibold ${
                            passwordStrength.score <= 2 ? 'text-error' :
                            passwordStrength.score <= 3 ? 'text-warning' :
                            'text-success'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>

                      {/* Requirements Checklist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-success' : 'text-textSecondary'}`}>
                          {newPassword.length >= 8 ? <Check size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={1.5} />}
                          <span>{LL.onboarding.step3.requirements.minLength()}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-success' : 'text-textSecondary'}`}>
                          {/[A-Z]/.test(newPassword) ? <Check size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={1.5} />}
                          <span>{LL.onboarding.step3.requirements.uppercase()}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-success' : 'text-textSecondary'}`}>
                          {/[a-z]/.test(newPassword) ? <Check size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={1.5} />}
                          <span>{LL.onboarding.step3.requirements.lowercase()}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-success' : 'text-textSecondary'}`}>
                          {/[0-9]/.test(newPassword) ? <Check size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={1.5} />}
                          <span>{LL.onboarding.step3.requirements.number()}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-success' : 'text-textSecondary'}`}>
                          {/[^A-Za-z0-9]/.test(newPassword) ? <Check size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={1.5} />}
                          <span>{LL.onboarding.step3.requirements.special()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning" dangerouslySetInnerHTML={{ __html: LL.onboarding.step3.warning() }} />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 border-2 border-border text-textSecondary font-medium rounded-lg hover:bg-background transition-all"
                >
                  {LL.common.back()}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isLoading || !isFormValid}
                  className="flex-1 py-2.5 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                      {LL.onboarding.completing()}
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={2} />
                      {LL.onboarding.complete()}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center text-xs text-textSecondary">
            <p>© 2024 Soullabs. {LL.onboarding.footer()}</p>
          </div>
        </div>
      </div>
    </>
  );
};
