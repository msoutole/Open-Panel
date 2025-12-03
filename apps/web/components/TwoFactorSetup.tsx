import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { setup2FA, enable2FA, disable2FA, regenerateBackupCodes } from '../services/twoFactor';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
  onClose?: () => void;
}

type SetupStep = 'intro' | 'qrcode' | 'verify' | 'backup' | 'success';

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isEnabled,
  onStatusChange,
  onClose,
}) => {
  const [step, setStep] = useState<SetupStep>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup data
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Verification
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Disable 2FA
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleStartSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await setup2FA();
      
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setManualKey(response.manualEntryKey);
      setStep('qrcode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('O código deve ter 6 dígitos');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await enable2FA(verificationCode, secret);
      
      setBackupCodes(response.backupCodes);
      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setStep('success');
    onStatusChange(true);
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setError('Senha é obrigatória');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await disable2FA(disablePassword);
      
      setShowDisable(false);
      setDisablePassword('');
      onStatusChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao desativar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await regenerateBackupCodes();
      setBackupCodes(response.backupCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao regenerar códigos');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // If 2FA is already enabled, show status panel
  if (isEnabled && step === 'intro') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Shield className="text-green-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Autenticação de Dois Fatores</h3>
            <p className="text-sm text-gray-500 mt-1">
              2FA está ativado para sua conta. Você precisará do código do seu app autenticador ao fazer login.
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => void handleRegenerateBackupCodes()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Regenerar Backup Codes
              </button>
              <button
                onClick={() => setShowDisable(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Desativar 2FA
              </button>
            </div>

            {/* Backup codes display */}
            {backupCodes.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-yellow-800">Seus novos códigos de backup:</p>
                  <button
                    onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                    className="text-yellow-700 hover:text-yellow-800"
                  >
                    {copiedBackup ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm text-yellow-900">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-yellow-100 px-2 py-1 rounded">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-yellow-700">
                  Guarde estes códigos em um local seguro. Cada código só pode ser usado uma vez.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Disable 2FA Modal */}
        {showDisable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Desativar 2FA</h3>
              <p className="text-sm text-gray-500 mb-4">
                Para desativar a autenticação de dois fatores, confirme sua senha.
              </p>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDisable(false);
                    setDisablePassword('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleDisable2FA()}
                  disabled={loading || !disablePassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Desativar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erro</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Step: Intro */}
      {step === 'intro' && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Configurar Autenticação de Dois Fatores
          </h3>
          <p className="text-gray-500 mb-6">
            Adicione uma camada extra de segurança à sua conta usando um app autenticador.
          </p>

          <div className="text-left space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Smartphone className="text-gray-500" size={20} />
              <span className="text-sm text-gray-700">
                Instale um app autenticador (Google Authenticator, Authy, etc.)
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Key className="text-gray-500" size={20} />
              <span className="text-sm text-gray-700">
                Escaneie o QR code ou insira a chave manualmente
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="text-gray-500" size={20} />
              <span className="text-sm text-gray-700">
                Verifique com um código do app para ativar
              </span>
            </div>
          </div>

          <button
            onClick={() => void handleStartSetup()}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando...
              </>
            ) : (
              'Começar Configuração'
            )}
          </button>
        </div>
      )}

      {/* Step: QR Code */}
      {step === 'qrcode' && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Escaneie o QR Code
          </h3>
          <p className="text-gray-500 mb-4">
            Use seu app autenticador para escanear este código
          </p>

          {/* QR Code */}
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl mb-4">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
          </div>

          {/* Manual entry */}
          <div className="text-left p-4 bg-gray-50 rounded-lg mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Ou insira esta chave manualmente:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white border rounded font-mono text-sm break-all">
                {manualKey}
              </code>
              <button
                onClick={() => copyToClipboard(manualKey, 'secret')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                {copiedSecret ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Step: Verify */}
      {step === 'verify' && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verificar Código
          </h3>
          <p className="text-gray-500 mb-6">
            Digite o código de 6 dígitos do seu app autenticador
          </p>

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setVerificationCode(value);
            }}
            placeholder="000000"
            className="w-full max-w-xs mx-auto px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep('qrcode')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={() => void handleVerify()}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Backup Codes */}
      {step === 'backup' && (
        <div>
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              2FA Ativado com Sucesso!
            </h3>
            <p className="text-gray-500">
              Guarde seus códigos de backup em um local seguro
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-yellow-800">Códigos de Backup</p>
              <button
                onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                className="text-yellow-700 hover:text-yellow-800 flex items-center gap-1 text-sm"
              >
                {copiedBackup ? <Check size={14} /> : <Copy size={14} />}
                {copiedBackup ? 'Copiado!' : 'Copiar todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm text-yellow-900">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-yellow-100 px-3 py-2 rounded text-center">
                  {code}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-yellow-700">
              ⚠️ Cada código só pode ser usado uma vez. Use-os para acessar sua conta se perder acesso ao seu app autenticador.
            </p>
          </div>

          <button
            onClick={handleComplete}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Concluir
          </button>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Tudo Pronto!
          </h3>
          <p className="text-gray-500 mb-6">
            Sua conta agora está protegida com autenticação de dois fatores.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Fechar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
