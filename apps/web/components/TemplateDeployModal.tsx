import React, { useState } from 'react';
import { X, Loader2, GitBranch, Cpu, MemoryStick, Settings, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { ApplicationTemplate, deployTemplate, TemplateDeployOptions } from '../services/templates';

interface TemplateDeployModalProps {
  template: ApplicationTemplate;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

type Step = 'config' | 'git' | 'resources' | 'review';

export const TemplateDeployModal: React.FC<TemplateDeployModalProps> = ({
  template,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('config');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [cpuLimit, setCpuLimit] = useState(template.minCpu || '1000m');
  const [memoryLimit, setMemoryLimit] = useState(template.minMemory || '512Mi');
  const [customEnv, setCustomEnv] = useState<Record<string, string>>({});

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'config', label: 'Configuração', icon: <Settings size={16} /> },
    { key: 'git', label: 'Repositório', icon: <GitBranch size={16} /> },
    { key: 'resources', label: 'Recursos', icon: <Cpu size={16} /> },
    { key: 'review', label: 'Revisão', icon: <CheckCircle size={16} /> },
  ];

  const handleDeploy = async () => {
    if (!projectName.trim()) {
      setError('Nome do projeto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const options: TemplateDeployOptions = {
        projectName: projectName.trim(),
        gitUrl: gitUrl.trim() || undefined,
        gitBranch: gitBranch.trim() || 'main',
        cpuLimit,
        memoryLimit,
        customEnv: Object.keys(customEnv).length > 0 ? customEnv : undefined,
      };

      const result = await deployTemplate(template.id, options);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'config':
        return projectName.trim().length > 0;
      case 'git':
        return true; // Git is optional
      case 'resources':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const stepIndex = steps.findIndex((s) => s.key === currentStep);
    if (stepIndex < steps.length - 1) {
      const nextStepData = steps[stepIndex + 1];
      if (nextStepData) {
        setCurrentStep(nextStepData.key);
      }
    }
  };

  const prevStep = () => {
    const stepIndex = steps.findIndex((s) => s.key === currentStep);
    if (stepIndex > 0) {
      const prevStepData = steps[stepIndex - 1];
      if (prevStepData) {
        setCurrentStep(prevStepData.key);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{template.icon || '📦'}</span>
            <div>
              <h2 className="font-semibold text-gray-900">Deploy {template.name}</h2>
              <p className="text-sm text-gray-500">{template.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 border-b">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                onClick={() => setCurrentStep(step.key)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentStep === step.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight size={16} className="text-gray-300" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Erro</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Step: Config */}
          {currentStep === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="meu-projeto"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use apenas letras, números e hífens
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Template Selecionado</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Buildpack:</div>
                  <div className="text-gray-900">{template.buildpack}</div>
                  <div className="text-gray-500">Linguagem:</div>
                  <div className="text-gray-900">{template.language}</div>
                  {template.dependencies && template.dependencies.length > 0 && (
                    <>
                      <div className="text-gray-500">Dependências:</div>
                      <div className="text-gray-900">{template.dependencies.join(', ')}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step: Git */}
          {currentStep === 'git' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Opcional:</strong> Configure um repositório Git para deploy automático.
                  Você também pode fazer upload do código depois.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Repositório Git
                </label>
                <input
                  type="url"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/usuario/repositorio.git"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step: Resources */}
          {currentStep === 'resources' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de CPU
                </label>
                <select
                  value={cpuLimit}
                  onChange={(e) => setCpuLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="500m">0.5 CPU (500m)</option>
                  <option value="1000m">1 CPU (1000m)</option>
                  <option value="2000m">2 CPUs (2000m)</option>
                  <option value="4000m">4 CPUs (4000m)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Recomendado: {template.minCpu || '1000m'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Memória
                </label>
                <select
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="256Mi">256 MB</option>
                  <option value="512Mi">512 MB</option>
                  <option value="1Gi">1 GB</option>
                  <option value="2Gi">2 GB</option>
                  <option value="4Gi">4 GB</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Recomendado: {template.minMemory || '512Mi'}
                </p>
              </div>
            </div>
          )}

          {/* Step: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Resumo da Configuração</h4>
              
              <div className="border rounded-lg divide-y">
                <div className="p-4 grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Nome do Projeto:</div>
                  <div className="text-gray-900 font-medium">{projectName || '-'}</div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Template:</div>
                  <div className="text-gray-900 font-medium">{template.name}</div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Buildpack:</div>
                  <div className="text-gray-900">{template.buildpack}</div>
                </div>
                {gitUrl && (
                  <div className="p-4 grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Repositório:</div>
                    <div className="text-gray-900 truncate">{gitUrl}</div>
                  </div>
                )}
                <div className="p-4 grid grid-cols-2 gap-2">
                  <div className="text-gray-500">CPU / Memória:</div>
                  <div className="text-gray-900">{cpuLimit} / {memoryLimit}</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Tudo pronto! Clique em "Criar Projeto" para iniciar o deploy.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={currentStep === 'config' ? onClose : prevStep}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            {currentStep === 'config' ? 'Cancelar' : 'Voltar'}
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={() => void handleDeploy()}
              disabled={loading || !canProceed()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Projeto'
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Próximo
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateDeployModal;
