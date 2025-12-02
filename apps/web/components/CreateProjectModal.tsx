import React, { useState } from 'react';
import { X, Loader2, Box, Database, Globe, Server, AlertCircle } from 'lucide-react';
import { createProject } from '../services/api';
import { Project } from '../types';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
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
        } catch (err: any) {
            setError(err.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const projectTypes = [
        { id: 'WEB', label: 'Web Service', icon: Globe, desc: 'Node.js, Python, Go, etc.' },
        { id: 'API', label: 'Backend API', icon: Server, desc: 'REST or GraphQL API' },
        { id: 'DATABASE', label: 'Database', icon: Database, desc: 'PostgreSQL, MySQL, etc.' },
        { id: 'WORKER', label: 'Background Worker', icon: Box, desc: 'Queue consumer, Cron job' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
                    <h3 className="font-bold text-lg text-textPrimary">Create New Project</h3>
                    <button onClick={onClose} className="text-textSecondary hover:text-textPrimary transition-colors duration-200">
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-error/10 text-error text-sm p-3 rounded-lg border border-error/20 flex items-center gap-2">
                            <AlertCircle size={16} strokeWidth={2} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-textPrimary mb-1.5">Project Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                                placeholder="e.g. My Awesome App"
                                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textPrimary mb-1.5">Slug (URL)</label>
                            <input
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-textSecondary bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textPrimary mb-1.5">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What does this project do?"
                                rows={2}
                                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textPrimary mb-3">Project Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {projectTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type.id })}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${formData.type === type.id
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border hover:border-primary/30 hover:bg-background'
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
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border-2 border-border text-border rounded-xl text-sm font-medium hover:bg-background transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> : null}
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
