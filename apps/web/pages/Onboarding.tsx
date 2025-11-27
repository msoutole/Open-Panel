import React, { useState, useMemo } from 'react';
import { Sparkles, Key, Palette, Lock, Check, AlertCircle, Loader2, ExternalLink, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface OnboardingProps {
  onComplete: () => void;
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresApiKey: boolean;
  requiresUrl?: boolean;
  helpUrl: string;
  helpText?: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Modelos avançados de IA do Google',
    icon: '🔷',
    requiresApiKey: true,
    helpUrl: 'https://makersuite.google.com/app/apikey',
    helpText: 'Obtenha sua API key no Google AI Studio'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Assistente de IA conversacional avançado',
    icon: '🤖',
    requiresApiKey: true,
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpText: 'Crie uma API key no Anthropic Console'
  },
  {
    id: 'github',
    name: 'GitHub Copilot',
    description: 'Assistente de código da GitHub',
    icon: '🐙',
    requiresApiKey: true,
    helpUrl: 'https://github.com/settings/tokens',
    helpText: 'Use um Personal Access Token do GitHub'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local/Cloud)',
    description: 'Modelos locais e cloud gratuitos',
    icon: '🦙',
    requiresApiKey: false,
    requiresUrl: true,
    helpUrl: 'https://ollama.com',
    helpText: 'Modelos cloud gratuitos serão habilitados automaticamente'
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Record<string, { apiKey?: string; apiUrl?: string; validated: boolean }>>({});
  const [defaultProvider, setDefaultProvider] = useState<string>('');
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Calcular força da senha
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '' };

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

    if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500', icon: ShieldAlert };
    if (score <= 3) return { score, label: 'Média', color: 'bg-yellow-500', icon: Shield };
    if (score <= 4) return { score, label: 'Forte', color: 'bg-green-500', icon: ShieldCheck };
    return { score, label: 'Muito Forte', color: 'bg-green-600', icon: ShieldCheck };
  }, [newPassword]);

  const validateProvider = async (providerId: string) => {
    setValidating(providerId);
    setError('');

    const toastId = toast.loading(`Validando ${AI_PROVIDERS.find(p => p.id === providerId)?.name}...`);

    try {
      const provider = selectedProviders[providerId];
      const token = localStorage.getItem('openpanel_access_token');

      const response = await fetch(`${API_URL}/api/onboarding/validate-provider`, {
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
        toast.success(`${AI_PROVIDERS.find(p => p.id === providerId)?.name} validado com sucesso!`, { id: toastId });
      } else {
        const errorMsg = `${AI_PROVIDERS.find(p => p.id === providerId)?.name}: ${data.error || 'Validação falhou'}`;
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
      }
    } catch (err) {
      const errorMsg = `Erro ao validar ${providerId}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`;
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setValidating(null);
    }
  };

  const handleComplete = async () => {
    setError('');

    // Validar senha
    if (newPassword !== confirmPassword) {
      const errorMsg = 'As senhas não coincidem';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (newPassword && newPassword.length < 8) {
      const errorMsg = 'A senha deve ter pelo menos 8 caracteres';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (passwordStrength.score < 4) {
      const errorMsg = 'Por favor, use uma senha mais forte (deve conter maiúsculas, minúsculas, números e caracteres especiais)';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!newPassword) {
      const errorMsg = 'Por segurança, você deve alterar a senha padrão';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Verificar se há pelo menos um provedor validado
    const validatedProviders = Object.entries(selectedProviders).filter(([_, v]) => v.validated);
    if (validatedProviders.length === 0) {
      const errorMsg = 'Configure pelo menos um provedor de IA';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!defaultProvider) {
      const errorMsg = 'Selecione um provedor padrão';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Finalizando configuração...');

    try {
      const token = localStorage.getItem('openpanel_access_token');

      const response = await fetch(`${API_URL}/api/onboarding/complete`, {
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
        throw new Error(errorData.error || 'Falha ao completar onboarding');
      }

      // Aplicar tema imediatamente
      document.documentElement.classList.toggle('dark', theme === 'dark');

      toast.success('Configuração concluída com sucesso! 🎉', { id: toastId, duration: 4000 });

      // Pequeno delay para mostrar o toast de sucesso
      setTimeout(() => onComplete(), 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao completar onboarding';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo ao Open Panel! 🎉</h1>
          <p className="text-gray-600">Vamos configurar seu ambiente em poucos passos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              } font-semibold transition-all`}>
                {step > s ? <Check size={20} /> : s}
              </div>
              {s < 3 && <div className={`w-12 md:w-16 h-1 ${step > s ? 'bg-blue-500' : 'bg-gray-200'} transition-all`} />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Step 1: Tema */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Palette size={24} /> Escolha seu tema
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">☀️</div>
                  <div className="font-semibold">Claro</div>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🌙</div>
                  <div className="font-semibold">Escuro</div>
                </button>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
            >
              Próximo
            </button>
          </div>
        )}

        {/* Step 2: Provedores de IA */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Key size={24} /> Configure provedores de IA
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecione e configure pelo menos um provedor. Você pode adicionar mais depois no chatbot.
              </p>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {AI_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{provider.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                          <p className="text-sm text-gray-600">{provider.description}</p>
                        </div>
                      </div>
                      {selectedProviders[provider.id]?.validated && (
                        <Check size={24} className="text-green-500" />
                      )}
                    </div>

                    {provider.requiresApiKey && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="password"
                          placeholder="API Key"
                          value={selectedProviders[provider.id]?.apiKey || ''}
                          onChange={(e) => setSelectedProviders(prev => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], apiKey: e.target.value, validated: false },
                          }))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <button
                            onClick={() => validateProvider(provider.id)}
                            disabled={!selectedProviders[provider.id]?.apiKey || validating === provider.id}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                          >
                            {validating === provider.id && <Loader2 size={16} className="animate-spin" />}
                            Validar
                          </button>
                          <a
                            href={provider.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                          >
                            {provider.helpText} <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    )}

                    {provider.requiresUrl && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="url"
                          placeholder="URL do Ollama (ex: http://localhost:11434)"
                          value={selectedProviders[provider.id]?.apiUrl || 'http://localhost:11434'}
                          onChange={(e) => setSelectedProviders(prev => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], apiUrl: e.target.value, validated: false },
                          }))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => validateProvider(provider.id)}
                          disabled={validating === provider.id}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                          {validating === provider.id && <Loader2 size={16} className="animate-spin" />}
                          Validar Conexão
                        </button>
                        <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                          💡 <strong>Ollama local é opcional mas recomendado para reduzir custos.</strong> Modelos cloud gratuitos serão habilitados automaticamente. Você pode remover o container do Ollama depois se quiser.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {Object.keys(selectedProviders).filter(k => selectedProviders[k].validated).length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provedor padrão *
                  </label>
                  <select
                    value={defaultProvider}
                    onChange={(e) => setDefaultProvider(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {Object.keys(selectedProviders)
                      .filter(k => selectedProviders[k].validated)
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
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={Object.keys(selectedProviders).filter(k => selectedProviders[k].validated).length === 0 || !defaultProvider}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Alterar Senha */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Lock size={24} /> Alterar senha (obrigatório)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Por segurança, você deve alterar a senha padrão agora.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova senha *
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nova senha *
                  </label>
                  <input
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Força da senha:</span>
                      <div className="flex items-center gap-2">
                        {React.createElement(passwordStrength.icon, {
                          size: 20,
                          className: passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 3 ? 'text-yellow-500' : 'text-green-500'
                        })}
                        <span className={`text-sm font-semibold ${
                          passwordStrength.score <= 2 ? 'text-red-600' :
                          passwordStrength.score <= 3 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>

                    {/* Requirements Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        {newPassword.length >= 8 ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>8+ caracteres</span>
                      </div>
                      <div className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[A-Z]/.test(newPassword) ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>Letra maiúscula</span>
                      </div>
                      <div className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[a-z]/.test(newPassword) ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>Letra minúscula</span>
                      </div>
                      <div className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[0-9]/.test(newPassword) ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>Número</span>
                      </div>
                      <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[^A-Za-z0-9]/.test(newPassword) ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>Caractere especial</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>A nova senha será utilizada no próximo login.</strong> Você não será deslogado agora, mas lembre-se da nova senha para o próximo acesso!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Voltar
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Começar a usar Open Panel
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>💡 Você pode alterar essas configurações a qualquer momento no chatbot ou nas configurações</p>
        </div>
      </div>
    </div>
  );
};
