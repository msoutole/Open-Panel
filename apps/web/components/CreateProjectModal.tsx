import React, { useState } from 'react';
import { X, Loader2, Box, Database, Globe, Server } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">Create New Project</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Project Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                                placeholder="e.g. My Awesome App"
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Slug (URL)</label>
                            <input
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-600 bg-slate-50 focus:outline-none focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What does this project do?"
                                rows={2}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Project Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {projectTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type.id })}
                                        className={`p-3 rounded-xl border text-left transition-all ${formData.type === type.id
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${formData.type === type.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            <type.icon size={16} />
                                        </div>
                                        <div className={`text-xs font-bold ${formData.type === type.id ? 'text-primary' : 'text-slate-700'}`}>
                                            {type.label}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{type.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
