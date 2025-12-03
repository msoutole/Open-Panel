import React, { useState } from 'react';
import { X, Loader2, Box, Database, Globe, Server, AlertCircle } from 'lucide-react';
import { createProject } from '../services/api';
import { Project } from '../types';
import { useTranslations } from '../src/i18n/i18n-react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
    const LL = useTranslations();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        type: 'WEB'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Auto-generate slug if empty
            const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

            const newProject = await createProject({
                ...formData,
                slug
            });

            onCreated(newProject);
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : LL.projects.createError();
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const projectTypes = [
        { id: 'WEB', label: LL.projects.webService(), icon: Globe, desc: LL.projects.nodejsPythonGo() },
        { id: 'API', label: LL.projects.backendAPI(), icon: Server, desc: LL.projects.restGraphQLAPI() },
        { id: 'DATABASE', label: LL.projects.database(), icon: Database, desc: LL.projects.postgresqlMySQL() },
        { id: 'WORKER', label: LL.projects.backgroundWorker(), icon: Box, desc: LL.projects.queueConsumerCronJob() },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
                    <h3 className="font-bold text-lg text-textPrimary">{LL.projects.createProject()}</h3>
                    <button onClick={onClose} className="text-textSecondary hover:text-textPrimary transition-colors duration-200">
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-error/10 text-error text-sm p-3 rounded-lg border border-error/20 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                            <AlertCircle size={16} strokeWidth={1.5} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            type="text"
                            label={LL.projects.projectName()}
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                            placeholder="e.g. My Awesome App"
                        />

                        <Input
                            type="text"
                            label={LL.projects.slug()}
                            required
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="font-mono text-textSecondary"
                        />

                        <Textarea
                            label={LL.projects.description()}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={LL.projects.whatProjectDoes()}
                            rows={2}
                        />

                        <div>
                            <label className="block text-sm font-medium text-textPrimary mb-3">{LL.projects.projectType()}</label>
                            <div className="grid grid-cols-2 gap-3">
                                {projectTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type.id })}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 transform ${formData.type === type.id
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary scale-[1.02]'
                                                : 'border-border hover:border-primary/30 hover:bg-background hover:scale-[1.01]'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${formData.type === type.id ? 'bg-primary text-white' : 'bg-background text-textSecondary'
                                            }`}>
                                            <type.icon size={16} strokeWidth={1.5} />
                                        </div>
                                        <div className={`text-xs font-bold ${formData.type === type.id ? 'text-primary' : 'text-textPrimary'}`}>
                                            {type.label}
                                        </div>
                                        <div className="text-[10px] text-textSecondary mt-0.5">{type.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            {LL.common.cancel()}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            isLoading={loading}
                            variant="primary"
                            className="flex-1"
                        >
                            {LL.projects.createProject()}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
