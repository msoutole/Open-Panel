import React, { useState } from 'react';
import { X, Box, Database, GitBranch, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, ChevronLeft, Container, FileCode, Package } from 'lucide-react';
import { CreateServiceData, Service, DatabaseType } from '../types';
import { createService } from '../services/api';
import { useTranslations } from '../src/i18n/i18n-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';

interface CreateServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onServiceCreated: (service: Service) => void;
    existingServiceNames: string[];
}

type ServiceType = 'docker' | 'git' | 'database' | 'postgres' | 'mysql' | 'mongodb' | 'redis' | 'compose' | 'custom' | null;

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
    isOpen,
    onClose,
    projectId,
    onServiceCreated,
    existingServiceNames
}) => {
    const LL = useTranslations();
    const [selectedType, setSelectedType] = useState<ServiceType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form data
    const [formData, setFormData] = useState<CreateServiceData>({
        name: '',
        type: 'app',
        deploymentStrategy: 'rolling',
    });

    const resetModal = () => {
        setSelectedType(null);
        setFormData({ name: '', type: 'app', deploymentStrategy: 'rolling' });
        setError(null);
        setSuccess(false);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const validateName = (name: string): string | null => {
        if (!name.trim()) return LL.serviceModal.nameRequired();
        if (name.length < 3) return LL.serviceModal.nameMinLength();
        if (!/^[a-z0-9-]+$/.test(name)) return LL.serviceModal.nameInvalid();
        if (existingServiceNames.includes(name)) return LL.serviceModal.nameExists();
        return null;
    };

    const getDefaultVersion = (type: DatabaseType): string => {
        const versions: Record<DatabaseType, string> = {
            postgres: '15',
            mysql: '8.0',
            mongodb: '6.0',
            redis: '7.0'
        };
        return versions[type];
    };

    const generatePassword = (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
        return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const handleTypeSelect = (type: ServiceType) => {
        setSelectedType(type);
        setError(null);
        
        if (type === 'docker' || type === 'git') {
            setFormData(prev => ({
                ...prev,
                type: 'app',
                source: { type: type === 'docker' ? 'docker' : 'git' }
            }));
        } else if (type && (type === 'postgres' || type === 'mysql' || type === 'mongodb' || type === 'redis')) {
            const dbType = type as DatabaseType;
            setFormData(prev => ({
                ...prev,
                type: dbType === 'redis' ? 'redis' : 'db',
                database: {
                    type: dbType,
                    version: getDefaultVersion(dbType),
                    username: `${formData.name || 'user'}_user`,
                    password: generatePassword(),
                    database: formData.name || 'mydb'
                }
            }));
        }
    };

    const handleSubmit = async () => {
        const nameError = validateName(formData.name);
        if (nameError) {
            setError(nameError);
            return;
        }

        if (selectedType === 'docker' && !formData.source?.image) {
            setError(LL.serviceModal.dockerImageRequired());
            return;
        }

        if (selectedType === 'git' && !formData.source?.repository) {
            setError(LL.serviceModal.repositoryRequired());
            return;
        }

        if ((selectedType === 'docker' || selectedType === 'git') && !formData.port) {
            setError(LL.serviceModal.portRequired());
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Validar projectId antes de fazer a requisição
            if (!projectId || projectId.trim() === '') {
                throw new Error('ID do projeto inválido. Por favor, recarregue a página.');
            }

            // Validar estrutura de dados antes de enviar
            const payload = { ...formData };
            
            // Garantir que campos obrigatórios estão presentes
            if (!payload.name || payload.name.trim() === '') {
                throw new Error('Nome do serviço é obrigatório.');
            }

            const service = await createService(projectId, payload);
            setSuccess(true);
            setTimeout(() => {
                onServiceCreated(service);
                handleClose();
            }, 1500);
        } catch (err) {
            let errorMessage: string = LL.serviceModal.createError() as string;
            
            if (err instanceof Error) {
                // Mensagens de erro mais específicas
                if (err.message.includes('404')) {
                    errorMessage = `Projeto não encontrado. Verifique se o projeto ainda existe ou recarregue a página.`;
                } else if (err.message.includes('400')) {
                    errorMessage = `Dados inválidos: ${err.message}`;
                } else if (err.message.includes('401') || err.message.includes('403')) {
                    errorMessage = 'Você não tem permissão para criar serviços neste projeto.';
                } else if (err.message.includes('409')) {
                    errorMessage = 'Já existe um serviço com este nome. Escolha outro nome.';
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;


    // Grid de serviços - tela inicial (seguindo design das imagens)
    if (!selectedType) {
        const serviceTypes = [
            {
                id: 'docker',
                type: 'docker' as ServiceType,
                icon: ImageIcon,
                title: LL.serviceModal.application(),
                description: LL.serviceModal.applicationDesc(),
                color: 'text-primary',
                bgColor: 'bg-primary/10',
                borderColor: 'border-primary/20',
            },
            {
                id: 'mysql',
                type: 'mysql' as ServiceType,
                icon: Database,
                title: LL.serviceModal.mysql(),
                description: LL.serviceModal.databaseDesc(),
                color: 'text-textPrimary',
                bgColor: 'bg-background',
                borderColor: 'border-border',
            },
            {
                id: 'postgres',
                type: 'postgres' as ServiceType,
                icon: Database,
                title: LL.serviceModal.postgres(),
                description: LL.serviceModal.databaseDesc(),
                color: 'text-textPrimary',
                bgColor: 'bg-background',
                borderColor: 'border-border',
            },
            {
                id: 'mongodb',
                type: 'mongodb' as ServiceType,
                icon: Database,
                title: LL.serviceModal.mongodb(),
                description: LL.serviceModal.databaseDesc(),
                color: 'text-textPrimary',
                bgColor: 'bg-background',
                borderColor: 'border-border',
            },
            {
                id: 'redis',
                type: 'redis' as ServiceType,
                icon: Database,
                title: LL.serviceModal.redis(),
                description: LL.serviceModal.databaseDesc(),
                color: 'text-textPrimary',
                bgColor: 'bg-background',
                borderColor: 'border-border',
            },
            {
                id: 'git',
                type: 'git' as ServiceType,
                icon: GitBranch,
                title: LL.serviceModal.gitRepository(),
                description: LL.serviceModal.gitRepositoryDesc(),
                color: 'text-textPrimary',
                bgColor: 'bg-background',
                borderColor: 'border-border',
            },
            {
                id: 'compose',
                type: 'compose' as ServiceType,
                icon: Container,
                title: 'Compose',
                description: 'Deploy usando Docker Compose',
                color: 'text-textPrimary',
                bgColor: 'bg-background',
                borderColor: 'border-border',
                badge: 'BETA',
                badgeVariant: 'success' as const,
            },
            {
                id: 'custom',
                type: 'custom' as ServiceType,
                icon: FileCode,
                title: 'Personalizado',
                description: 'Configuração avançada manual',
                color: 'text-textPrimary',
                bgColor: 'bg-background',
                borderColor: 'border-border',
            },
        ];

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background flex-shrink-0">
                        <h3 className="font-bold text-lg text-textPrimary">{LL.serviceModal.createNewService()}</h3>
                        <button onClick={handleClose} className="text-textSecondary hover:text-textPrimary transition-colors duration-200">
                            <X size={20} strokeWidth={1.5} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        <label className="block text-sm font-medium text-textPrimary mb-4">{LL.serviceModal.chooseType()}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {serviceTypes.map((service) => {
                                const Icon = service.icon;
                                return (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => {
                                            if (service.type === 'compose' || service.type === 'custom') {
                                                setError('Funcionalidade em desenvolvimento');
                                                return;
                                            }
                                            handleTypeSelect(service.type);
                                        }}
                                        className="group relative p-4 rounded-xl border text-left transition-all duration-200 transform hover:border-primary/40 hover:bg-background hover:scale-[1.02] hover:shadow-sm border-border bg-card"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${service.bgColor} ${service.color} group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                            <Icon size={20} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="text-sm font-bold text-textPrimary leading-tight">
                                                {service.title}
                                            </div>
                                            {service.badge && (
                                                <Badge variant={service.badgeVariant} size="sm">
                                                    {service.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-textSecondary leading-tight line-clamp-2">
                                            {service.description}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Formulário baseado no tipo selecionado
    const getServiceTitle = () => {
        if (selectedType === 'docker') return LL.serviceModal.dockerImage();
        if (selectedType === 'git') return LL.serviceModal.gitRepository();
        if (selectedType === 'postgres') return LL.serviceModal.postgres();
        if (selectedType === 'mysql') return LL.serviceModal.mysql();
        if (selectedType === 'mongodb') return LL.serviceModal.mongodb();
        if (selectedType === 'redis') return LL.serviceModal.redis();
        return LL.serviceModal.createNewService();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedType(null)}
                            className="text-textSecondary hover:text-textPrimary transition-colors duration-200"
                            disabled={isSubmitting}
                        >
                            <ChevronLeft size={20} strokeWidth={1.5} />
                        </button>
                        <h3 className="font-bold text-lg text-textPrimary">{getServiceTitle()}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-textSecondary hover:text-textPrimary transition-colors duration-200"
                        disabled={isSubmitting}
                    >
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 space-y-6 overflow-y-auto flex-1">

                        {error && (
                            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg flex items-start gap-3">
                                <AlertCircle size={20} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-3">
                                <CheckCircle2 size={20} strokeWidth={1.5} />
                                <span className="text-sm font-medium">{LL.serviceModal.serviceCreatedSuccess()}</span>
                            </div>
                        )}

                        {/* Service Name */}
                        <Input
                            type="text"
                            label={`${LL.serviceModal.serviceName()} *`}
                            value={formData.name}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                                setError(null);
                            }}
                            placeholder={LL.serviceModal.serviceNamePlaceholder()}
                            disabled={isSubmitting || success}
                            helperText={LL.serviceModal.serviceNameHint()}
                        />

                        {/* Docker Form */}
                        {selectedType === 'docker' && (
                            <>
                                <Input
                                    type="text"
                                    label={`${LL.serviceModal.dockerImageLabel()} *`}
                                    value={formData.source?.image || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        source: { ...prev.source!, image: e.target.value }
                                    }))}
                                    placeholder={LL.serviceModal.dockerImagePlaceholder()}
                                    disabled={isSubmitting || success}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label={LL.serviceModal.internalPort()}
                                        value={formData.port || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || undefined }))}
                                        placeholder={LL.serviceModal.internalPortPlaceholder()}
                                        disabled={isSubmitting || success}
                                    />
                                    <Input
                                        type="number"
                                        label={LL.serviceModal.exposedPort()}
                                        value={formData.exposedPort || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, exposedPort: parseInt(e.target.value) || undefined }))}
                                        placeholder={LL.serviceModal.exposedPortPlaceholder()}
                                        disabled={isSubmitting || success}
                                    />
                                </div>
                                <Select
                                    label={LL.serviceModal.deploymentStrategy()}
                                    value={formData.deploymentStrategy}
                                    onChange={(e) => setFormData(prev => ({ ...prev, deploymentStrategy: e.target.value as 'rolling' | 'blue-green' }))}
                                    disabled={isSubmitting || success}
                                    options={[
                                        { value: 'rolling', label: 'Rolling' },
                                        { value: 'blue-green', label: 'Blue-Green' }
                                    ]}
                                />
                            </>
                        )}

                        {/* Git Form */}
                        {selectedType === 'git' && (
                            <>
                                <Input
                                    type="text"
                                    label={`${LL.serviceModal.repositoryUrl()} *`}
                                    value={formData.source?.repository || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        source: { ...prev.source!, repository: e.target.value }
                                    }))}
                                    placeholder={LL.serviceModal.repositoryUrlPlaceholder()}
                                    disabled={isSubmitting || success}
                                />

                                <Input
                                    type="text"
                                    label={LL.serviceModal.branch()}
                                    value={formData.source?.branch || 'main'}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        source: { ...prev.source!, branch: e.target.value }
                                    }))}
                                    placeholder={LL.serviceModal.branchPlaceholder()}
                                    disabled={isSubmitting || success}
                                />

                                <Input
                                    type="number"
                                    label={`${LL.serviceModal.internalPort()} *`}
                                    value={formData.port || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || undefined }))}
                                    placeholder={LL.serviceModal.internalPortPlaceholder()}
                                    disabled={isSubmitting || success}
                                />
                                <Select
                                    label={LL.serviceModal.deploymentStrategy()}
                                    value={formData.deploymentStrategy}
                                    onChange={(e) => setFormData(prev => ({ ...prev, deploymentStrategy: e.target.value as 'rolling' | 'blue-green' }))}
                                    disabled={isSubmitting || success}
                                    options={[
                                        { value: 'rolling', label: 'Rolling' },
                                        { value: 'blue-green', label: 'Blue-Green' }
                                    ]}
                                />
                            </>
                        )}

                        {/* Database Configuration */}
                        {(selectedType === 'postgres' || selectedType === 'mysql' || selectedType === 'mongodb' || selectedType === 'redis') && (
                            <div className="bg-background border border-border rounded-lg p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-textPrimary text-sm">{LL.serviceModal.databaseConfiguration()}</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-textSecondary uppercase tracking-wide">{LL.serviceModal.type()}</label>
                                        <div className="text-sm font-medium text-textPrimary capitalize">
                                            {selectedType === 'postgres' && LL.serviceModal.postgres()}
                                            {selectedType === 'mysql' && LL.serviceModal.mysql()}
                                            {selectedType === 'mongodb' && LL.serviceModal.mongodb()}
                                            {selectedType === 'redis' && LL.serviceModal.redis()}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-textSecondary uppercase tracking-wide">{LL.serviceModal.version()}</label>
                                        <div className="text-sm font-medium text-textPrimary">{formData.database?.version}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-textSecondary uppercase tracking-wide">{LL.serviceModal.username()}</label>
                                        <div className="text-sm font-medium font-mono text-textPrimary">{formData.database?.username}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-textSecondary uppercase tracking-wide">{LL.serviceModal.database()}</label>
                                        <div className="text-sm font-medium font-mono text-textPrimary">{formData.database?.database}</div>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-border">
                                    <p className="text-xs text-textSecondary">{LL.serviceModal.passwordGenerated()}</p>
                                </div>
                            </div>
                        )}

                    <div className="pt-2 flex gap-3">
                        <Button
                            type="button"
                            onClick={handleClose}
                            variant="outline"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {LL.serviceModal.cancel()}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                success ||
                                !formData.name ||
                                (selectedType === 'docker' && !formData.source?.image) ||
                                (selectedType === 'git' && !formData.source?.repository) ||
                                ((selectedType === 'docker' || selectedType === 'git') && !formData.port)
                            }
                            isLoading={isSubmitting}
                            variant="primary"
                            className="flex-1"
                        >
                            {success ? LL.serviceModal.created() : LL.serviceModal.createService()}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateServiceModal;
