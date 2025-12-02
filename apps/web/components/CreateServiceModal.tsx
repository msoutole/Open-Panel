import React, { useState } from 'react';
import { X, Box, Database, GitBranch, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { CreateServiceData, Service, DatabaseType } from '../types';
import { createService } from '../services/api';

interface CreateServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onServiceCreated: (service: Service) => void;
    existingServiceNames: string[];
}

type ServiceCategory = 'app' | 'database' | null;
type AppSourceType = 'docker' | 'git' | null;

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
    isOpen,
    onClose,
    projectId,
    onServiceCreated,
    existingServiceNames
}) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [category, setCategory] = useState<ServiceCategory>(null);
    const [appSource, setAppSource] = useState<AppSourceType>(null);
    const [dbType, setDbType] = useState<DatabaseType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form data
    const [formData, setFormData] = useState<CreateServiceData>({
        name: '',
        type: 'app',
    });

    const resetModal = () => {
        setStep(1);
        setCategory(null);
        setAppSource(null);
        setDbType(null);
        setFormData({ name: '', type: 'app' });
        setError(null);
        setSuccess(false);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const validateName = (name: string): string | null => {
        if (!name.trim()) return 'Service name is required';
        if (name.length < 3) return 'Name must be at least 3 characters';
        if (!/^[a-z0-9-]+$/.test(name)) return 'Name can only contain lowercase letters, numbers, and hyphens';
        if (existingServiceNames.includes(name)) return 'A service with this name already exists';
        return null;
    };

    const handleStepOne = (selectedCategory: ServiceCategory) => {
        setCategory(selectedCategory);
        setFormData(prev => ({
            ...prev,
            type: selectedCategory === 'app' ? 'app' : 'db'
        }));
        setStep(2);
    };

    const handleStepTwo = () => {
        if (category === 'app' && appSource) {
            setFormData(prev => ({
                ...prev,
                source: { type: appSource }
            }));
        } else if (category === 'database' && dbType) {
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
        setStep(3);
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

    const handleSubmit = async () => {
        const nameError = validateName(formData.name);
        if (nameError) {
            setError(nameError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const service = await createService(projectId, formData);
            setSuccess(true);
            setTimeout(() => {
                onServiceCreated(service);
                handleClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create service');
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-background">
                    <div>
                        <h2 className="text-2xl font-bold text-textPrimary">Create New Service</h2>
                        <p className="text-sm text-textSecondary mt-1">
                            Step {step} of 3 - {step === 1 ? 'Choose Type' : step === 2 ? 'Configure' : 'Review & Create'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-textSecondary hover:text-textPrimary p-2 hover:bg-background rounded-lg transition-colors duration-200"
                        disabled={isSubmitting}
                    >
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-3 bg-background border-b border-border">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex-1 flex items-center gap-2">
                                <div
                                    className={`h-1.5 rounded-full flex-1 transition-all duration-200 ${s <= step ? 'bg-primary' : 'bg-border'
                                        }`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Category Selection */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div
                                onClick={() => handleStepOne('app')}
                                className="border-2 border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-200">
                                        <Box className="text-primary group-hover:text-white transition-colors duration-200" size={28} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-textPrimary group-hover:text-primary transition-colors duration-200">Application</h3>
                                        <p className="text-sm text-textSecondary mt-1">
                                            Deploy web apps, APIs, or microservices from Docker images or Git repositories
                                        </p>
                                    </div>
                                    <ChevronRight className="text-textSecondary group-hover:text-primary transition-colors duration-200" size={24} strokeWidth={1.5} />
                                </div>
                            </div>

                            <div
                                onClick={() => handleStepOne('database')}
                                className="border-2 border-border rounded-xl p-6 hover:border-warning hover:bg-warning/5 cursor-pointer transition-all duration-200 group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center group-hover:bg-warning transition-colors duration-200">
                                        <Database className="text-warning group-hover:text-white transition-colors duration-200" size={28} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-textPrimary group-hover:text-warning transition-colors duration-200">Database</h3>
                                        <p className="text-sm text-textSecondary mt-1">
                                            PostgreSQL, MySQL, MongoDB, or Redis with automatic configuration
                                        </p>
                                    </div>
                                    <ChevronRight className="text-textSecondary group-hover:text-warning transition-colors duration-200" size={24} strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configuration */}
                    {step === 2 && category === 'app' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-4 transition-colors duration-200"
                            >
                                <ChevronLeft size={16} strokeWidth={1.5} /> Back
                            </button>

                            <h3 className="text-lg font-bold text-textPrimary mb-4">Choose Application Source</h3>

                            <div
                                onClick={() => setAppSource('docker')}
                                className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${appSource === 'docker'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/30 hover:bg-primary/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${appSource === 'docker' ? 'bg-primary' : 'bg-background'
                                        }`}>
                                        <ImageIcon className={appSource === 'docker' ? 'text-white' : 'text-textSecondary'} size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-textPrimary">Docker Image</h4>
                                        <p className="text-xs text-textSecondary">Use a pre-built Docker image from DockerHub or a registry</p>
                                    </div>
                                    {appSource === 'docker' && <CheckCircle2 className="text-primary" size={20} strokeWidth={2} />}
                                </div>
                            </div>

                            <div
                                onClick={() => setAppSource('git')}
                                className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${appSource === 'git'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/30 hover:bg-primary/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${appSource === 'git' ? 'bg-primary' : 'bg-background'
                                        }`}>
                                        <GitBranch className={appSource === 'git' ? 'text-white' : 'text-textSecondary'} size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-textPrimary">Git Repository</h4>
                                        <p className="text-xs text-textSecondary">Build and deploy from your GitHub, GitLab, or Bitbucket repo</p>
                                    </div>
                                    {appSource === 'git' && <CheckCircle2 className="text-primary" size={20} strokeWidth={2} />}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && category === 'database' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-4 transition-colors duration-200"
                            >
                                <ChevronLeft size={16} strokeWidth={1.5} /> Back
                            </button>

                            <h3 className="text-lg font-bold text-textPrimary mb-4">Select Database Type</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {(['postgres', 'mysql', 'mongodb', 'redis'] as DatabaseType[]).map((db) => (
                                    <div
                                        key={db}
                                        onClick={() => setDbType(db)}
                                        className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${dbType === db
                                            ? 'border-warning bg-warning/5'
                                            : 'border-border hover:border-warning/30 hover:bg-warning/5'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center text-center gap-2">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dbType === db ? 'bg-warning' : 'bg-background'
                                                }`}>
                                                <Database className={dbType === db ? 'text-white' : 'text-textSecondary'} size={24} strokeWidth={1.5} />
                                            </div>
                                            <h4 className="font-bold text-textPrimary capitalize">{db}</h4>
                                            {dbType === db && <CheckCircle2 className="text-warning" size={18} strokeWidth={2} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details Form */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-4 transition-colors duration-200"
                            >
                                <ChevronLeft size={16} strokeWidth={1.5} /> Back
                            </button>

                            {error && (
                                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg flex items-start gap-3">
                                    <AlertCircle size={20} strokeWidth={2} className="shrink-0 mt-0.5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-3">
                                    <CheckCircle2 size={20} strokeWidth={2} />
                                    <span className="text-sm font-medium">Service created successfully!</span>
                                </div>
                            )}

                            {/* Service Name */}
                            <div>
                                <label className="block text-sm font-medium text-textPrimary mb-2">Service Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                                        setError(null);
                                    }}
                                    placeholder="my-service"
                                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                                    disabled={isSubmitting || success}
                                />
                                <p className="text-xs text-textSecondary mt-1">Lowercase letters, numbers, and hyphens only</p>
                            </div>

                            {/* Application - Docker */}
                            {category === 'app' && appSource === 'docker' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-textPrimary mb-2">Docker Image *</label>
                                        <input
                                            type="text"
                                            value={formData.source?.image || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                source: { ...prev.source!, image: e.target.value }
                                            }))}
                                            placeholder="nginx:latest"
                                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                                            disabled={isSubmitting || success}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-textPrimary mb-2">Internal Port</label>
                                            <input
                                                type="number"
                                                value={formData.port || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || undefined }))}
                                                placeholder="3000"
                                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                                                disabled={isSubmitting || success}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-textPrimary mb-2">Exposed Port (Optional)</label>
                                            <input
                                                type="number"
                                                value={formData.exposedPort || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, exposedPort: parseInt(e.target.value) || undefined }))}
                                                placeholder="8080"
                                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                                                disabled={isSubmitting || success}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Application - Git */}
                            {category === 'app' && appSource === 'git' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-textPrimary mb-2">Repository URL *</label>
                                        <input
                                            type="text"
                                            value={formData.source?.repository || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                source: { ...prev.source!, repository: e.target.value }
                                            }))}
                                            placeholder="https://github.com/username/repo.git"
                                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                                            disabled={isSubmitting || success}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-textPrimary mb-2">Branch</label>
                                        <input
                                            type="text"
                                            value={formData.source?.branch || 'main'}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                source: { ...prev.source!, branch: e.target.value }
                                            }))}
                                            placeholder="main"
                                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                                            disabled={isSubmitting || success}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-textPrimary mb-2">Internal Port *</label>
                                        <input
                                            type="number"
                                            value={formData.port || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || undefined }))}
                                            placeholder="3000"
                                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                                            disabled={isSubmitting || success}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Database Configuration */}
                            {category === 'database' && dbType && (
                                <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                                    <h4 className="font-semibold text-textPrimary text-sm">Database Configuration</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-textSecondary">Type:</span>
                                            <span className="ml-2 font-medium capitalize text-textPrimary">{dbType}</span>
                                        </div>
                                        <div>
                                            <span className="text-textSecondary">Version:</span>
                                            <span className="ml-2 font-medium text-textPrimary">{formData.database?.version}</span>
                                        </div>
                                        <div>
                                            <span className="text-textSecondary">Username:</span>
                                            <span className="ml-2 font-medium font-mono text-xs text-textPrimary">{formData.database?.username}</span>
                                        </div>
                                        <div>
                                            <span className="text-textSecondary">Database:</span>
                                            <span className="ml-2 font-medium font-mono text-xs text-textPrimary">{formData.database?.database}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-textSecondary mt-2">Password will be generated automatically and shown after creation</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-between">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-textSecondary hover:text-textPrimary font-medium transition-colors duration-200"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button
                                onClick={handleStepTwo}
                                disabled={
                                    (category === 'app' && !appSource) ||
                                    (category === 'database' && !dbType)
                                }
                                className="px-6 py-2.5 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Next <ChevronRight className="inline ml-1" size={16} strokeWidth={1.5} />
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                onClick={handleSubmit}
                                disabled={
                                    isSubmitting ||
                                    success ||
                                    !formData.name ||
                                    (category === 'app' && appSource === 'docker' && !formData.source?.image) ||
                                    (category === 'app' && appSource === 'git' && !formData.source?.repository)
                                }
                                className="px-6 py-2.5 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />}
                                {success ? 'Created!' : isSubmitting ? 'Creating...' : 'Create Service'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateServiceModal;
