import React, { useState } from 'react';
import { Project, Service, EnvVar, Domain } from '../types';
import {
    ArrowLeft, Box, Database, SlidersHorizontal,
    Key, Gauge, Settings, Plus, LayoutDashboard, TerminalSquare,
    Trash2, HardDrive, Check, RotateCw, Info, Copy, Eye, EyeOff, Globe, History, Cpu, GitBranch,
    LayoutGrid, List as ListIcon, Calendar, User, GitCommit, Loader2, KeyRound, Square
} from 'lucide-react';
import { WebTerminal } from './WebTerminal';
import { INITIAL_LOGS } from '../constants';
import {
    restartService, startService, stopService, getServiceLogs,
    createEnvVar, updateEnvVar, deleteEnvVar,
    createDomain, updateDomain, deleteDomain,
    updateServiceResources, updateService, deleteService,
    listBackups, createBackup, restoreBackup, deleteBackup,
    createRedirect, deleteRedirect
} from '../services/api';

export interface ServiceDetailViewProps {
    service: Service;
    project: Project;
    onBack: () => void;
    onSelectService: (service: Service) => void;
}

interface ErrorNotification {
    type: 'success' | 'error';
    title: string;
    message: string;
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({ service, project, onBack, onSelectService }) => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isWebConsoleOpen, setIsWebConsoleOpen] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [notification, setNotification] = useState<ErrorNotification | null>(null);

    const isDatabase = service.type === 'db' || service.type === 'redis';

    const handleRestart = async () => {
        setIsRestarting(true);
        setNotification(null);

        try {
            await restartService(service.id);
            setNotification({
                type: 'success',
                title: 'Service Restarted',
                message: `${service.name} restarted successfully. Container ID: ${service.id.substring(0, 12)}`
            });
        } catch (error) {
            setNotification({
                type: 'error',
                title: 'Restart Failed',
                message: error instanceof Error ? error.message : 'Failed to restart service'
            });
        } finally {
            setIsRestarting(false);
            // Auto-dismiss after 5 seconds
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleDeploy = async () => {
        setIsDeploying(true);
        setNotification(null);

        try {
            // Deploy action: restart the service to pull latest changes
            await restartService(service.id);
            setNotification({
                type: 'success',
                title: 'Deployment Triggered',
                message: `Building ${service.name} from ${service.source?.type || 'docker'}. Build ID: #${Date.now().toString().slice(-4)}`
            });
        } catch (error) {
            setNotification({
                type: 'error',
                title: 'Deploy Failed',
                message: error instanceof Error ? error.message : 'Failed to deploy service'
            });
        } finally {
            setIsDeploying(false);
            // Auto-dismiss after 5 seconds
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleStart = async () => {
        setIsStarting(true);
        setNotification(null);

        try {
            await startService(service.id);
            setNotification({
                type: 'success',
                title: 'Service Started',
                message: `${service.name} started successfully`
            });
        } catch (error) {
            setNotification({
                type: 'error',
                title: 'Start Failed',
                message: error instanceof Error ? error.message : 'Failed to start service'
            });
        } finally {
            setIsStarting(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleStop = async () => {
        setIsStopping(true);
        setNotification(null);

        try {
            await stopService(service.id);
            setNotification({
                type: 'success',
                title: 'Service Stopped',
                message: `${service.name} stopped successfully`
            });
        } catch (error) {
            setNotification({
                type: 'error',
                title: 'Stop Failed',
                message: error instanceof Error ? error.message : 'Failed to stop service'
            });
        } finally {
            setIsStopping(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const appTabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'environment', label: 'Environment', icon: SlidersHorizontal },
        { id: 'networking', label: 'Networking', icon: Globe },
        { id: 'source', label: 'Source', icon: GitBranch },
        { id: 'deployments', label: 'Deployments', icon: History },
        { id: 'resources', label: 'Resources', icon: Cpu },
        { id: 'advanced', label: 'Advanced', icon: Settings },
    ];

    const dbTabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'credentials', label: 'Connection', icon: Key },
        { id: 'networking', label: 'Networking', icon: Globe },
        { id: 'backups', label: 'Backups', icon: Database },
        { id: 'resources', label: 'Resources', icon: Cpu },
        { id: 'advanced', label: 'Advanced', icon: Settings },
    ];

    const sidebarItems = isDatabase ? dbTabs : appTabs;

    return (
        <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white sticky top-0 z-10">
                    <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="font-bold text-slate-800 text-sm truncate" title={project.name}>{project.name}</div>
                </div>

                <div className="flex-1 py-4">
                    {/* Service List */}
                    <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Services</div>
                    <div className="px-2 space-y-0.5 mb-6">
                        {project.services.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { onSelectService(s); setActiveTab('overview'); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative ${s.id === service.id
                                    ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full shadow-sm ${s.status === 'Running' ? 'bg-green-500' : 'bg-red-400'}`}></div>
                                <span className="truncate">{s.name}</span>
                                {s.id === service.id && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-slate-200 mx-4 mb-6"></div>

                    {/* Configuration Tabs */}
                    <div className="px-4 mb-2 flex items-center gap-2">
                        <div className={`p-1 rounded bg-white border border-slate-200 ${isDatabase ? 'text-amber-600' : 'text-blue-600'}`}>
                            {isDatabase ? <Database size={12} /> : <Box size={12} />}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[120px]" title={service.name}>{service.name}</div>
                    </div>
                    <div className="px-2 space-y-0.5">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon size={16} className={activeTab === item.id ? 'text-primary' : 'text-slate-400'} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
                {/* Top Bar */}
                <div className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-800">{service.name}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${service.status === 'Running' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {service.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsWebConsoleOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
                            <TerminalSquare size={14} /> Console
                        </button>
                        {service.status === 'Running' ? (
                            <button
                                onClick={handleStop}
                                disabled={isStopping}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 disabled:opacity-70"
                            >
                                {isStopping ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                                {isStopping ? 'Stopping...' : 'Stop'}
                            </button>
                        ) : (
                            <button
                                onClick={handleStart}
                                disabled={isStarting}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 disabled:opacity-70"
                            >
                                {isStarting ? <Loader2 size={14} className="animate-spin" /> : <div className="w-0 h-0 border-l-[6px] border-l-green-600 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>}
                                {isStarting ? 'Starting...' : 'Start'}
                            </button>
                        )}
                        <button
                            onClick={handleRestart}
                            disabled={isRestarting || service.status !== 'Running'}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 disabled:opacity-70"
                        >
                            {isRestarting ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
                            {isRestarting ? 'Restarting...' : 'Restart'}
                        </button>
                        <button
                            onClick={handleDeploy}
                            disabled={isDeploying}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                        >
                            {isDeploying ? <Loader2 size={14} className="animate-spin" /> : null}
                            Deploy
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'overview' && <OverviewTab service={service} onOpenConsole={() => setIsWebConsoleOpen(true)} />}

                        {activeTab === 'environment' && <EnvironmentTab service={service} projectId={project.id} />}
                        {activeTab === 'networking' && <NetworkingTab service={service} projectId={project.id} isDatabase={isDatabase} />}
                        {activeTab === 'source' && <SourceTab service={service} projectId={project.id} />}
                        {activeTab === 'deployments' && <DeploymentsTab service={service} />}
                        {activeTab === 'resources' && <ResourcesTab service={service} />}
                        {activeTab === 'advanced' && <AdvancedTab service={service} projectId={project.id} />}

                        {activeTab === 'credentials' && isDatabase && <CredentialsTab service={service} />}
                        {activeTab === 'backups' && isDatabase && <BackupsTab service={service} />}
                    </div>
                </div>
            </div>

            {isWebConsoleOpen && (
                <WebTerminal serviceName={service.name} onClose={() => setIsWebConsoleOpen(false)} />
            )}

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`rounded-xl shadow-2xl border p-4 min-w-[400px] ${notification.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${notification.type === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {notification.type === 'success' ? (
                                    <Check size={18} />
                                ) : (
                                    <Info size={18} />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm mb-1 ${notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                                    }`}>
                                    {notification.title}
                                </h4>
                                <p className={`text-xs ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                    {notification.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setNotification(null)}
                                className={`p-1 rounded hover:bg-opacity-50 transition-colors ${notification.type === 'success'
                                    ? 'text-green-700 hover:bg-green-200'
                                    : 'text-red-700 hover:bg-red-200'
                                    }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for select arrow
const ChevronDown = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);

const OverviewTab: React.FC<{ service: Service, onOpenConsole: () => void }> = ({ service, onOpenConsole }) => (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">CPU Usage</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-800">{service.cpu}%</span>
                    <span className="text-xs text-slate-400 mb-1">of 2 cores</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${service.cpu}%` }}></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Memory</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-800">{service.memory}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Network I/O</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-800">45 MB</span>
                    <span className="text-xs text-slate-400 mb-1">/ 120 MB</span>
                </div>
                <div className="flex gap-1 mt-3">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full w-[30%]"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Logs Preview */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
            <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TerminalSquare size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-200">Container Logs</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onOpenConsole} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition-colors">Open Console</button>
                </div>
            </div>
            <div className="p-4 font-mono text-xs text-slate-400 h-64 overflow-hidden relative">
                <div className="space-y-1">
                    <div className="text-slate-500">2023-10-27 10:00:01 [INFO] Service started successfully on port {service.port}</div>
                    <div className="text-slate-500">2023-10-27 10:00:02 [INFO] Connected to database at {service.credentials?.host || 'localhost'}</div>
                    {INITIAL_LOGS.slice(0, 6).map((log, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-slate-600 shrink-0">{log.timestamp.split('T')[1]?.split('.')[0] || log.timestamp}</span>
                            <span className={log.level === 'ERROR' ? 'text-red-400' : 'text-slate-300'}>{log.message}</span>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
            </div>
        </div>
    </div>
);

const CredentialsTab: React.FC<{ service: Service }> = ({ service }) => {
    const CopyInput = ({ label, value, isSecret = false }: { label: string, value: string, isSecret?: boolean }) => {
        const [visible, setVisible] = useState(!isSecret);
        const copyToClipboard = () => {
            navigator.clipboard.writeText(value);
            alert("Copied to clipboard!");
        };

        return (
            <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                <div className="relative flex items-center">
                    <input
                        type={visible ? "text" : "password"}
                        readOnly
                        value={value}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono focus:outline-none focus:border-primary transition-colors"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        {isSecret && (
                            <button onClick={() => setVisible(!visible)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200">
                                {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        )}
                        <button onClick={copyToClipboard} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200" title="Copy">
                            <Copy size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CopyInput label="Username" value={service.credentials?.user || 'postgres'} />
                    <CopyInput label="Password" value={service.credentials?.password || ''} isSecret />
                </div>

                <div>
                    <CopyInput label="Database Name" value={service.credentials?.databaseName || 'postgres'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CopyInput label="Internal Host" value={service.credentials?.host || ''} />
                    <CopyInput label="Internal Port" value={service.credentials?.port.toString() || '5432'} />
                </div>

                <div>
                    <CopyInput label="Connection String" value={service.credentials?.connectionString || ''} isSecret />
                </div>
            </div>
        </div>
    );
};

const NetworkingTab: React.FC<{ service: Service, projectId: string, isDatabase: boolean }> = ({ service, projectId, isDatabase }) => {
    const [localDomains, setLocalDomains] = useState<Domain[]>(service.domains || []);
    const [isAddingDomain, setIsAddingDomain] = useState(false);
    const [redirects, setRedirects] = useState<any[]>(service.redirects || []);

    const handleAddDomain = async () => {
        const domain = prompt("Enter domain (e.g., api.example.com):");
        if (!domain) return;

        setIsAddingDomain(true);
        try {
            const newDomain = await createDomain({
                domain,
                projectId,
                https: true,
                targetPort: service.port,
                targetProtocol: 'HTTP'
            });
            setLocalDomains([...localDomains, newDomain]);
        } catch (error) {
            console.error('Failed to add domain:', error);
            alert('Failed to add domain');
        } finally {
            setIsAddingDomain(false);
        }
    };

    const handleRemoveDomain = async (id: string) => {
        if (!confirm("Remove this domain routing?")) return;

        try {
            await deleteDomain(id);
            setLocalDomains(localDomains.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to remove domain:', error);
            alert('Failed to remove domain');
        }
    };

    const handleAddRedirect = async () => {
        const from = prompt("Redirect from (e.g. /old):");
        const to = prompt("Redirect to (e.g. /new):");
        if (!from || !to) return;

        try {
            const redirect = await createRedirect(service.id, { from, to, type: 301 });
            setRedirects([...redirects, redirect]);
        } catch (error) {
            console.error('Failed to add redirect:', error);
            alert('Failed to add redirect');
        }
    };

    const handleRemoveRedirect = async (id: string) => {
        if (!confirm("Remove this redirect?")) return;
        try {
            await deleteRedirect(service.id, id);
            setRedirects(redirects.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to remove redirect:', error);
            alert('Failed to remove redirect');
        }
    };

    return (
        <div className="space-y-6">
            {!isDatabase ? (
                <>
                    {/* App Domains */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-700">Domains</h3>
                        <button
                            onClick={handleAddDomain}
                            disabled={isAddingDomain}
                            className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200 disabled:opacity-70"
                        >
                            {isAddingDomain ? 'Adding...' : 'Add Domain'}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {localDomains.map(domain => (
                            <div key={domain.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <div className="bg-green-50 text-green-700 p-2 rounded-lg">
                                        <Globe size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <a href={`https://${domain.domain}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-800 hover:text-primary hover:underline truncate">
                                            {domain.domain}
                                        </a>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            TLS Active • {domain.targetProtocol || 'HTTP'} {'->'} {domain.targetPort || service.port}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                                    <button
                                        onClick={() => handleRemoveDomain(domain.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {localDomains.length === 0 && (
                            <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                                No domains configured.
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-700">Redirects</h3>
                            <button
                                onClick={handleAddRedirect}
                                className="text-sm bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                            >
                                Add Redirect
                            </button>
                        </div>

                        <div className="space-y-2">
                            {redirects.map((r: any) => (
                                <div key={r.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-mono text-slate-600">{r.from}</span>
                                        <ArrowLeft size={14} className="rotate-180 text-slate-400" />
                                        <span className="font-mono text-slate-600">{r.to}</span>
                                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{r.type}</span>
                                    </div>
                                    <button onClick={() => handleRemoveRedirect(r.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {redirects.length === 0 && (
                                <div className="text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                                    No redirects configured.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* DB Expose */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Globe size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 mb-1">Public Exposure</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Make this service accessible from outside the cluster.
                                    <br /><span className="text-amber-600 text-xs mt-1 block">Warning: This opens the port to the public internet. Ensure you have strong passwords.</span>
                                </p>

                                <div className="max-w-xs">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Public Port</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            defaultValue={service.exposedPort || 0}
                                            placeholder="e.g. 5432"
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <button className="bg-slate-900 text-white px-4 rounded-lg text-sm font-medium hover:bg-slate-800">Save</button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Set to 0 to disable public access.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const AdvancedTab: React.FC<{ service: Service, projectId: string }> = ({ service, projectId }) => {
    const [image, setImage] = useState(service.image);
    const [command, setCommand] = useState(service.command || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateService(projectId, service.id, {
                image,
                command
            });
            alert("Changes saved");
        } catch (error: any) {
            console.error('Failed to save:', error);
            alert('Failed to save changes: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            return;
        }
        try {
            await deleteService(projectId, service.id);
            window.location.reload();
        } catch (error: any) {
            console.error('Failed to delete service:', error);
            alert('Failed to delete service: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Docker Image</label>
                        <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono text-slate-700"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Container User</label>
                        <input
                            type="text"
                            placeholder="root"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono text-slate-700"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Command / Entrypoint</label>
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="e.g. npm start"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono text-slate-700"
                    />
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                <h3 className="text-red-800 font-bold mb-2">Danger Zone</h3>
                <p className="text-red-600 text-sm mb-4">Irreversible actions that affect the availability of your service.</p>
                <div className="flex gap-3">
                    <button
                        onClick={handleDelete}
                        className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                        Delete Service
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('Force rebuild?')) {
                                await restartService(service.id);
                                alert('Rebuild triggered');
                            }
                        }}
                        className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                        Force Rebuild
                    </button>
                </div>
            </div>
        </div>
    );
};

const BackupsTab: React.FC<{ service: Service }> = ({ service }) => {
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [backupNotification, setBackupNotification] = useState<ErrorNotification | null>(null);
    const [backups, setBackups] = useState<any[]>(service.backups || []);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        const loadBackups = async () => {
            setIsLoading(true);
            try {
                const data = await listBackups(service.id);
                setBackups(data);
            } catch (error) {
                console.error('Failed to load backups:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBackups();
    }, [service.id]);

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        setBackupNotification(null);

        try {
            const backupName = `${service.name}-${new Date().toISOString().split('T')[0]}`;
            const backup = await createBackup(service.id, backupName);

            setBackups([backup, ...backups]);
            setBackupNotification({
                type: 'success',
                title: 'Backup Created',
                message: `Backup ${backup.filename || backup.name} created successfully.`
            });
        } catch (error: any) {
            setBackupNotification({
                type: 'error',
                title: 'Backup Failed',
                message: error.message || 'Failed to create backup'
            });
        } finally {
            setIsCreatingBackup(false);
            setTimeout(() => setBackupNotification(null), 5000);
        }
    };

    const handleRestoreBackup = async (backupId: string) => {
        if (!confirm('Are you sure you want to restore this backup? This will overwrite the current database.')) {
            return;
        }

        try {
            await restoreBackup(service.id, backupId);
            setBackupNotification({
                type: 'success',
                title: 'Backup Restored',
                message: 'Database restored successfully from backup.'
            });
        } catch (error: any) {
            setBackupNotification({
                type: 'error',
                title: 'Restore Failed',
                message: error.message || 'Failed to restore backup'
            });
        } finally {
            setTimeout(() => setBackupNotification(null), 5000);
        }
    };

    const handleDeleteBackup = async (backupId: string) => {
        if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteBackup(service.id, backupId);
            setBackups(backups.filter(b => b.id !== backupId));
            setBackupNotification({
                type: 'success',
                title: 'Backup Deleted',
                message: 'Backup deleted successfully.'
            });
        } catch (error: any) {
            setBackupNotification({
                type: 'error',
                title: 'Delete Failed',
                message: error.message || 'Failed to delete backup'
            });
        } finally {
            setTimeout(() => setBackupNotification(null), 5000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700">Backups</h3>
                <button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                >
                    {isCreatingBackup ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isCreatingBackup ? 'Creating...' : 'Create Backup'}
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">
                        <Loader2 size={32} className="mx-auto mb-3 text-slate-300 animate-spin" />
                        <p>Loading backups...</p>
                    </div>
                ) : backups && backups.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Filename</th>
                                <th className="px-6 py-3 font-semibold">Size</th>
                                <th className="px-6 py-3 font-semibold">Date</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {backups.map(bk => (
                                <tr key={bk.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-mono text-slate-600">{bk.filename || bk.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{bk.size || 'N/A'}</td>
                                    <td className="px-6 py-4 text-slate-600">{bk.timestamp || bk.createdAt}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            {bk.status || 'Complete'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleRestoreBackup(bk.id)}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBackup(bk.id)}
                                            className="text-red-600 hover:underline font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        <HardDrive size={32} className="mx-auto mb-3 text-slate-300" />
                        <p>No backups found.</p>
                    </div>
                )}
            </div>

            {backupNotification && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`rounded-xl shadow-2xl border p-4 min-w-[400px] ${backupNotification.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${backupNotification.type === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {backupNotification.type === 'success' ? (
                                    <Check size={18} />
                                ) : (
                                    <Info size={18} />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm mb-1 ${backupNotification.type === 'success' ? 'text-green-900' : 'text-red-900'
                                    }`}>
                                    {backupNotification.title}
                                </h4>
                                <p className={`text-xs ${backupNotification.type === 'success' ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                    {backupNotification.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setBackupNotification(null)}
                                className={`p-1 rounded hover:bg-opacity-50 transition-colors ${backupNotification.type === 'success'
                                    ? 'text-green-700 hover:bg-green-200'
                                    : 'text-red-700 hover:bg-red-200'
                                    }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ResourcesTab: React.FC<{ service: Service }> = ({ service }) => {
    const HOST_MAX_CPU = 16;
    const HOST_MAX_MEMORY = 32768;

    const [memoryReservation, setMemoryReservation] = useState(service.resources?.memoryReservation || 0);
    const [memoryLimit, setMemoryLimit] = useState(service.resources?.memoryLimit || 0);
    const [cpuReservation, setCpuReservation] = useState(service.resources?.cpuReservation || 0);
    const [cpuLimit, setCpuLimit] = useState(service.resources?.cpuLimit || 0);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    const validateResources = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (memoryReservation < 0) newErrors.memoryReservation = 'Memory reservation cannot be negative';
        if (memoryLimit < 0) newErrors.memoryLimit = 'Memory limit cannot be negative';
        if (memoryLimit > 0 && memoryReservation > memoryLimit) newErrors.memoryReservation = 'Reservation cannot exceed limit';
        if (memoryReservation > HOST_MAX_MEMORY) newErrors.memoryReservation = `Exceeds host capacity (${HOST_MAX_MEMORY} MB available)`;
        if (memoryLimit > HOST_MAX_MEMORY) newErrors.memoryLimit = `Exceeds host capacity (${HOST_MAX_MEMORY} MB available)`;

        if (cpuReservation < 0) newErrors.cpuReservation = 'CPU reservation cannot be negative';
        if (cpuLimit < 0) newErrors.cpuLimit = 'CPU limit cannot be negative';
        if (cpuLimit > 0 && cpuReservation > cpuLimit) newErrors.cpuReservation = 'Reservation cannot exceed limit';
        if (cpuReservation > HOST_MAX_CPU) newErrors.cpuReservation = `Exceeds host capacity (${HOST_MAX_CPU} cores available)`;
        if (cpuLimit > HOST_MAX_CPU) newErrors.cpuLimit = `Exceeds host capacity (${HOST_MAX_CPU} cores available)`;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdate = async () => {
        if (validateResources()) {
            setIsSaving(true);
            try {
                await updateServiceResources(service.id, {
                    cpuLimit,
                    cpuReservation,
                    memoryLimit,
                    memoryReservation
                });
                alert(`Resources updated successfully for ${service.name}`);
            } catch (error: any) {
                console.error('Failed to update resources:', error);
                alert(`Failed to update resources: ${error.message || 'Unknown error'}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-bold text-slate-800">Resource Limits</h3>
                    <p className="text-xs text-slate-500 mt-1">Host capacity: {HOST_MAX_CPU} CPU cores, {HOST_MAX_MEMORY} MB memory</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HardDrive size={18} className="text-purple-500" />
                            <span className="font-semibold text-slate-700">Memory</span>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-slate-500">Reservation</label>
                                <input
                                    type="number"
                                    value={memoryReservation}
                                    onChange={(e) => setMemoryReservation(Number(e.target.value))}
                                    onBlur={validateResources}
                                    className="w-20 text-xs font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 text-right"
                                    min="0"
                                    max={HOST_MAX_MEMORY}
                                />
                                <span className="text-xs font-medium text-slate-500">MB</span>
                            </div>
                            <input
                                type="range"
                                value={memoryReservation}
                                onChange={(e) => setMemoryReservation(Number(e.target.value))}
                                onBlur={validateResources}
                                min="0"
                                max={HOST_MAX_MEMORY}
                                step="128"
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            {errors.memoryReservation && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <Info size={12} /> {errors.memoryReservation}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-slate-500">Limit</label>
                                <input
                                    type="number"
                                    value={memoryLimit}
                                    onChange={(e) => setMemoryLimit(Number(e.target.value))}
                                    onBlur={validateResources}
                                    className="w-20 text-xs font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 text-right"
                                    min="0"
                                    max={HOST_MAX_MEMORY}
                                />
                                <span className="text-xs font-medium text-slate-500">MB</span>
                            </div>
                            <input
                                type="range"
                                value={memoryLimit}
                                onChange={(e) => setMemoryLimit(Number(e.target.value))}
                                onBlur={validateResources}
                                min="0"
                                max={HOST_MAX_MEMORY}
                                step="128"
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            {errors.memoryLimit && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <Info size={12} /> {errors.memoryLimit}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu size={18} className="text-blue-500" />
                            <span className="font-semibold text-slate-700">CPU</span>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-slate-500">Reservation</label>
                                <input
                                    type="number"
                                    value={cpuReservation}
                                    onChange={(e) => setCpuReservation(Number(e.target.value))}
                                    onBlur={validateResources}
                                    className="w-20 text-xs font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 text-right"
                                    min="0"
                                    max={HOST_MAX_CPU}
                                    step="0.1"
                                />
                                <span className="text-xs font-medium text-slate-500">Cores</span>
                            </div>
                            <input
                                type="range"
                                value={cpuReservation}
                                onChange={(e) => setCpuReservation(Number(e.target.value))}
                                onBlur={validateResources}
                                min="0"
                                max={HOST_MAX_CPU}
                                step="0.1"
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            {errors.cpuReservation && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <Info size={12} /> {errors.cpuReservation}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-slate-500">Limit</label>
                                <input
                                    type="number"
                                    value={cpuLimit}
                                    onChange={(e) => setCpuLimit(Number(e.target.value))}
                                    onBlur={validateResources}
                                    className="w-20 text-xs font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 text-right"
                                    min="0"
                                    max={HOST_MAX_CPU}
                                    step="0.1"
                                />
                                <span className="text-xs font-medium text-slate-500">Cores</span>
                            </div>
                            <input
                                type="range"
                                value={cpuLimit}
                                onChange={(e) => setCpuLimit(Number(e.target.value))}
                                onBlur={validateResources}
                                min="0"
                                max={HOST_MAX_CPU}
                                step="0.1"
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            {errors.cpuLimit && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <Info size={12} /> {errors.cpuLimit}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 text-right">
                    <button
                        onClick={handleUpdate}
                        disabled={isSaving || Object.keys(errors).length > 0}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                        {isSaving ? 'Updating...' : 'Update Resources'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SourceTab: React.FC<{ service: Service, projectId: string }> = ({ service, projectId }) => {
    const [activeSourceType, setActiveSourceType] = useState<'docker' | 'git'>(service.source?.type || 'docker');
    const [image, setImage] = useState(service.image || '');
    const [repo, setRepo] = useState(service.source?.repo || '');
    const [branch, setBranch] = useState(service.source?.branch || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateService(projectId, service.id, {
                image: activeSourceType === 'docker' ? image : undefined,
                source: activeSourceType === 'git' ? {
                    type: 'git',
                    repo,
                    branch
                } : undefined
            });
            alert('Source configuration saved');
        } catch (error: any) {
            console.error('Failed to save source:', error);
            alert('Failed to save source: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6">Build Source</h3>
                <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-6">
                    <button
                        onClick={() => setActiveSourceType('docker')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSourceType === 'docker'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Docker Image
                    </button>
                    <button
                        onClick={() => setActiveSourceType('git')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSourceType === 'git'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Git Repository
                    </button>
                </div>

                <div className="space-y-6">
                    {activeSourceType === 'docker' ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Image Name</label>
                            <input
                                type="text"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                placeholder="e.g. nginx:latest"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Repository URL</label>
                                    <input
                                        type="text"
                                        value={repo}
                                        onChange={(e) => setRepo(e.target.value)}
                                        placeholder="https://github.com/org/repo"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Branch</label>
                                    <div className="flex items-center">
                                        <GitBranch size={16} className="absolute ml-3 text-slate-400" />
                                        <input
                                            type="text"
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            placeholder="main"
                                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Git Credential</label>
                                <div className="relative">
                                    <KeyRound size={16} className="absolute ml-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white appearance-none text-slate-600">
                                        <option value="">No Credentials (Public Repo)</option>
                                        <option value="gh_1">OpenPanel Bot (GitHub)</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronDown size={14} className="text-slate-400" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                    <Info size={10} /> Add more credentials in System Settings {'>'} GitOps
                                </p>
                            </div>
                        </>
                    )}

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-800">Auto Deploy</label>
                            <div className="relative inline-block w-10 h-6 bg-green-500 rounded-full cursor-pointer">
                                <span className="absolute right-1 top-1 inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">Automatically deploy new versions when the {activeSourceType === 'docker' ? 'image' : 'code'} is updated.</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeploymentsTab: React.FC<{ service: Service }> = ({ service }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[400px]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-slate-700">Deployment History</h3>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded font-bold border border-green-200">Webhook Active</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-200 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="List View"
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="divide-y divide-slate-100">
                        {(service.deployments || []).map((dep, idx) => (
                            <div key={dep.id} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${dep.status === 'Success' ? 'bg-green-100 text-green-600' :
                                        dep.status === 'Building' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                        {dep.status === 'Success' ? <Check size={18} /> :
                                            dep.status === 'Building' ? <RotateCw size={18} /> :
                                                <Info size={18} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800">Deployment #{dep.id.split('_')[1] || idx + 1}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${dep.status === 'Success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>{dep.status}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            <GitCommit size={12} /> {dep.commit}
                                            <span className="text-slate-300">|</span>
                                            <span className="italic">{dep.message}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">
                                        <Calendar size={12} /> {dep.timestamp}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <User size={10} /> {dep.author || 'system'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
                        {(service.deployments || []).map((dep, idx) => (
                            <div key={dep.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all group flex flex-col hover:-translate-y-0.5 duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white shadow-sm ${dep.status === 'Success' ? 'bg-green-100 text-green-600' :
                                        dep.status === 'Building' ? 'bg-blue-100 text-blue-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                        {dep.status === 'Success' ? <Check size={14} /> :
                                            dep.status === 'Building' ? <RotateCw size={14} /> :
                                                <Info size={14} />}
                                    </div>
                                    <span className="text-xs font-mono text-slate-300 bg-slate-100 px-2 py-0.5 rounded">#{dep.id.split('_')[1]}</span>
                                </div>

                                <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 leading-tight">{dep.message}</h4>

                                <div className="mt-auto space-y-3 pt-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                                        <GitBranch size={12} className="text-slate-400" /> {dep.branch}
                                        <span className="text-slate-300 mx-1">|</span>
                                        <span className="text-slate-400">{dep.commit.substring(0, 7)}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                                        <span className="flex items-center gap-1"><User size={10} /> {dep.author || 'system'}</span>
                                        <span>{dep.timestamp.split(' ')[0]}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
