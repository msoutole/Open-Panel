import React, { useState } from 'react';
import { Project, Service, EnvVar, Domain } from '../types';
import {
    ArrowLeft, Box, Database, SlidersHorizontal,
    Key, Gauge, Settings, Plus, LayoutDashboard, TerminalSquare,
    Trash2, HardDrive, Check, RotateCw, Info, Copy, Eye, EyeOff, Globe, History, Cpu, GitBranch,
    LayoutGrid, List as ListIcon, Calendar, User, GitCommit, Loader2, KeyRound, Square, X
} from 'lucide-react';
import { WebTerminal } from './WebTerminal';
import { DatabaseConsole } from './DatabaseConsole';
import { useLogs } from '../hooks/useLogs';
import { useMetrics } from '../hooks/useMetrics';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../src/utils/error';
import { useTranslations } from '../src/i18n/i18n-react';
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
    const LL = useTranslations();
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isWebConsoleOpen, setIsWebConsoleOpen] = useState(false);
    const [isDbConsoleOpen, setIsDbConsoleOpen] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [notification, setNotification] = useState<ErrorNotification | null>(null);
    const { showToast } = useToast();

    const isDatabase = service.type === 'db' || service.type === 'redis';

    // Use WebSocket for real-time logs
    const { logs: serviceLogs, isConnected: logsConnected, clearLogs } = useLogs({
        containerId: service.id,
        autoConnect: activeTab === 'logs',
        maxLogs: 500,
    });

    // Use WebSocket for real-time metrics
    const { metrics: serviceMetrics, isConnected: metricsConnected } = useMetrics({
        containerId: service.id,
        autoConnect: activeTab === 'metrics',
        interval: 2000,
        maxHistory: 100,
    });

    const handleRestart = async () => {
        setIsRestarting(true);
        setNotification(null);

        try {
            await restartService(service.id);
            setNotification({
                type: 'success',
                title: LL.serviceDetail.serviceRestarted(),
                message: LL.serviceDetail.serviceRestartedMessage({ name: service.name, containerId: service.id.substring(0, 12) })
            });
            showToast({
                type: 'success',
                title: 'Serviço reiniciado',
                message: `${service.name} foi reiniciado com sucesso`,
            });
        } catch (error: unknown) {
            const { message: errorMsg } = getErrorMessage(error);
            setNotification({
                type: 'error',
                title: LL.serviceDetail.restartFailed(),
                message: errorMsg
            });
            showToast({
                type: 'error',
                title: 'Erro ao reiniciar serviço',
                message: errorMsg,
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
                title: LL.serviceDetail.deploymentTriggered(),
                message: LL.serviceDetail.deploymentTriggeredMessage({ name: service.name })
            });
        } catch (error: unknown) {
            const { message } = getErrorMessage(error);
            setNotification({
                type: 'error',
                title: LL.serviceDetail.deployFailed(),
                message: message || LL.serviceDetail.deployFailed()
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
                title: LL.serviceDetail.serviceStarted(),
                message: LL.serviceDetail.serviceStartedMessage({ name: service.name })
            });
        } catch (error: unknown) {
            const { message } = getErrorMessage(error);
            setNotification({
                type: 'error',
                title: LL.serviceDetail.startFailed(),
                message: message || LL.serviceDetail.startFailed()
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
                title: LL.serviceDetail.serviceStopped(),
                message: LL.serviceDetail.serviceStoppedMessage({ name: service.name })
            });
        } catch (error: unknown) {
            const { message } = getErrorMessage(error);
            setNotification({
                type: 'error',
                title: LL.serviceDetail.stopFailed(),
                message: message || LL.serviceDetail.stopFailed()
            });
        } finally {
            setIsStopping(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const appTabs = [
        { id: 'overview', label: LL.serviceDetail.overview(), icon: LayoutDashboard },
        { id: 'environment', label: LL.serviceDetail.environment(), icon: SlidersHorizontal },
        { id: 'networking', label: LL.serviceDetail.networking(), icon: Globe },
        { id: 'source', label: 'Origem', icon: GitBranch },
        { id: 'deployments', label: LL.serviceDetail.deployments(), icon: History },
        { id: 'resources', label: 'Recursos', icon: Cpu },
        { id: 'advanced', label: LL.serviceDetail.advanced(), icon: Settings },
    ];

    const dbTabs = [
        { id: 'overview', label: LL.serviceDetail.overview(), icon: LayoutDashboard },
        { id: 'credentials', label: LL.serviceDetail.credentials(), icon: Key },
        { id: 'networking', label: LL.serviceDetail.networking(), icon: Globe },
        { id: 'backups', label: LL.serviceDetail.backups(), icon: Database },
        { id: 'resources', label: 'Recursos', icon: Cpu },
        { id: 'advanced', label: LL.serviceDetail.advanced(), icon: Settings },
    ];

    const sidebarItems = isDatabase ? dbTabs : appTabs;

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-border flex items-center gap-3 bg-white sticky top-0 z-10">
                    <button onClick={onBack} className="p-1.5 hover:bg-background rounded text-textSecondary transition-colors duration-200">
                        <ArrowLeft size={16} strokeWidth={1.5} />
                    </button>
                    <div className="font-bold text-textPrimary text-sm truncate" title={project.name}>{project.name}</div>
                </div>

                <div className="flex-1 py-4">
                    {/* Service List */}
                    <div className="px-4 mb-2 text-[10px] font-medium text-textSecondary uppercase tracking-wider">{LL.serviceDetail.projectServices()}</div>
                    <div className="px-2 space-y-0.5 mb-6">
                        {project.services.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { onSelectService(s); setActiveTab('overview'); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative ${s.id === service.id
                                    ? 'bg-white shadow-sm text-textPrimary border border-border'
                                    : 'text-textSecondary hover:bg-background hover:text-textPrimary border border-transparent'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full shadow-sm ${s.status === 'Running' ? 'bg-success' : 'bg-error'}`}></div>
                                <span className="truncate">{s.name}</span>
                                {s.id === service.id && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-border mx-4 mb-6"></div>

                    {/* Configuration Tabs */}
                    <div className="px-4 mb-2 flex items-center gap-2">
                        <div className={`p-1 rounded bg-white border border-border ${isDatabase ? 'text-warning' : 'text-primary'}`}>
                            {isDatabase ? <Database size={12} strokeWidth={1.5} /> : <Box size={12} strokeWidth={1.5} />}
                        </div>
                        <div className="text-[10px] font-medium text-textSecondary uppercase tracking-wider truncate max-w-[120px]" title={service.name}>{service.name}</div>
                    </div>
                    <div className="px-2 space-y-0.5">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activeTab === item.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-textSecondary hover:bg-background hover:text-textPrimary'
                                    }`}
                            >
                                <item.icon size={16} strokeWidth={1.5} className={activeTab === item.id ? 'text-primary' : 'text-textSecondary'} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                {/* Top Bar */}
                <div className="h-16 border-b border-border bg-card px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-textPrimary">{service.name}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${service.status === 'Running' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'
                            }`}>
                            {service.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDatabase && (
                            <button onClick={() => setIsDbConsoleOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-textSecondary bg-background hover:bg-white rounded-lg transition-colors duration-200 border border-border">
                                <Database size={14} strokeWidth={1.5} /> DB Console
                            </button>
                        )}
                        <button onClick={() => setIsWebConsoleOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-textSecondary bg-background hover:bg-white rounded-lg transition-colors duration-200 border border-border">
                            <TerminalSquare size={14} strokeWidth={1.5} /> {LL.serviceDetail.console()}
                        </button>
                        {service.status === 'Running' ? (
                            <button
                                onClick={() => void handleStop()}
                                disabled={isStopping}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors duration-200 border border-error/20 disabled:opacity-50"
                            >
                                {isStopping ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : <Square size={14} strokeWidth={1.5} />}
                                {isStopping ? LL.serviceDetail.stopping() : LL.serviceDetail.stop()}
                            </button>
                        ) : (
                            <button
                                onClick={() => void handleStart()}
                                disabled={isStarting}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors duration-200 border border-success/20 disabled:opacity-50"
                            >
                                {isStarting ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : <div className="w-0 h-0 border-l-[6px] border-l-success border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>}
                                {isStarting ? LL.serviceDetail.starting() : LL.serviceDetail.start()}
                            </button>
                        )}
                        <button
                            onClick={() => void handleRestart()}
                            disabled={isRestarting || service.status !== 'Running'}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-textSecondary bg-background hover:bg-white rounded-lg transition-colors duration-200 border border-border disabled:opacity-50"
                        >
                            {isRestarting ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : <RotateCw size={14} strokeWidth={1.5} />}
                            {isRestarting ? LL.serviceDetail.restarting() : LL.serviceDetail.restart()}
                        </button>
                        <button
                            onClick={() => void handleDeploy()}
                            disabled={isDeploying}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primaryHover active:bg-primaryActive rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {isDeploying ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : null}
                            {LL.serviceDetail.deploy()}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'overview' && <OverviewTab service={service} serviceLogs={serviceLogs} onOpenConsole={() => setIsWebConsoleOpen(true)} />}

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
                <WebTerminal serviceName={service.name} containerId={service.id} onClose={() => setIsWebConsoleOpen(false)} />
            )}

            {isDbConsoleOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col w-[900px] h-[600px]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Database size={16} /> {service.name} Console
                            </h3>
                            <button onClick={() => setIsDbConsoleOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <DatabaseConsole 
                                containerId={service.id} 
                                type={service.image.includes('postgres') ? 'postgresql' : 
                                      service.image.includes('mysql') ? 'mysql' : 
                                      service.image.includes('mariadb') ? 'mariadb' : 
                                      service.image.includes('mongo') ? 'mongodb' : 
                                      service.image.includes('redis') ? 'redis' : 'postgresql'} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-8 right-8 z-50">
                    <div className={`rounded-xl shadow-xl border p-4 min-w-[400px] ${notification.type === 'success'
                        ? 'bg-success/10 border-success/20'
                        : 'bg-error/10 border-error/20'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${notification.type === 'success'
                                ? 'bg-success/20 text-success'
                                : 'bg-error/20 text-error'
                                }`}>
                                {notification.type === 'success' ? (
                                    <Check size={18} strokeWidth={2} />
                                ) : (
                                    <Info size={18} strokeWidth={2} />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm mb-1 ${notification.type === 'success' ? 'text-success' : 'text-error'
                                    }`}>
                                    {notification.title}
                                </h4>
                                <p className={`text-xs ${notification.type === 'success' ? 'text-success' : 'text-error'
                                    }`}>
                                    {notification.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setNotification(null)}
                                className={`p-1 rounded hover:bg-opacity-50 transition-colors duration-200 ${notification.type === 'success'
                                    ? 'text-success hover:bg-success/20'
                                    : 'text-error hover:bg-error/20'
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

const OverviewTab: React.FC<{ service: Service, serviceLogs: any[], onOpenConsole: () => void }> = ({ service, serviceLogs, onOpenConsole }) => {
    const LL = useTranslations();
    return (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                <div className="text-textSecondary text-xs font-medium uppercase tracking-wider mb-2">CPU Usage</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-textPrimary">{service.cpu}%</span>
                    <span className="text-xs text-textSecondary mb-1">of 2 cores</span>
                </div>
                <div className="w-full bg-background h-1.5 rounded-full mt-3 overflow-hidden border border-border">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${service.cpu}%` }}></div>
                </div>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                <div className="text-textSecondary text-xs font-medium uppercase tracking-wider mb-2">Memory</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-textPrimary">{service.memory}</span>
                </div>
                <div className="w-full bg-background h-1.5 rounded-full mt-3 overflow-hidden border border-border">
                    <div className="bg-primary h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                <div className="text-textSecondary text-xs font-medium uppercase tracking-wider mb-2">Network I/O</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-textPrimary">45 MB</span>
                    <span className="text-xs text-textSecondary mb-1">/ 120 MB</span>
                </div>
                <div className="flex gap-1 mt-3">
                    <div className="h-1.5 flex-1 bg-background rounded-full overflow-hidden border border-border">
                        <div className="bg-warning h-full w-[30%]"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Logs Preview */}
        <div className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151] shadow-sm">
            <div className="px-4 py-3 bg-[#111827]/50 border-b border-[#374151] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TerminalSquare size={16} className="text-textSecondary" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-white">Container Logs</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onOpenConsole} className="text-xs bg-[#374151] hover:bg-[#4B5563] text-white px-3 py-1 rounded transition-colors duration-200">{LL.serviceDetail.console()}</button>
                </div>
            </div>
            <div className="p-4 font-mono text-xs text-textSecondary h-64 overflow-hidden relative">
                <div className="space-y-1">
                    <div className="text-textSecondary">2023-10-27 10:00:01 [INFO] Service started successfully on port {service.port}</div>
                    <div className="text-textSecondary">2023-10-27 10:00:02 [INFO] Connected to database at {service.credentials?.host || 'localhost'}</div>
                    {serviceLogs.length > 0 ? (
                        serviceLogs.slice(0, 6).map((log) => (
                            <div key={log.id} className="flex gap-2">
                                <span className="text-textSecondary shrink-0">
                                    {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className={log.level === 'ERROR' ? 'text-error' : log.level === 'WARN' ? 'text-warning' : 'text-white'}>
                                    {log.message}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-textSecondary text-sm">{LL.serviceDetail.noLogsAvailable()}</div>
                    )}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#1f2937] to-transparent pointer-events-none"></div>
            </div>
        </div>
    </div>
    );
};

const CredentialsTab: React.FC<{ service: Service }> = ({ service }) => {
    const LL = useTranslations();
    const CopyInput = ({ label, value, isSecret = false }: { label: string, value: string, isSecret?: boolean }) => {
        const [visible, setVisible] = useState(!isSecret);
        const copyToClipboard = () => {
            navigator.clipboard.writeText(value);
            alert("Copiado para a área de transferência!");
        };

        return (
            <div className="group">
                <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">{label}</label>
                <div className="relative flex items-center">
                    <input
                        type={visible ? "text" : "password"}
                        readOnly
                        value={value}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-textPrimary font-mono focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        {isSecret && (
                            <button onClick={() => setVisible(!visible)} className="p-1.5 text-textSecondary hover:text-textPrimary rounded hover:bg-background transition-colors duration-200">
                                {visible ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                            </button>
                        )}
                        <button onClick={copyToClipboard} className="p-1.5 text-textSecondary hover:text-textPrimary rounded hover:bg-background transition-colors duration-200" title="Copy">
                            <Copy size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CopyInput label={LL.serviceDetail.username()} value={service.credentials?.user || 'postgres'} />
                    <CopyInput label={LL.serviceDetail.password()} value={service.credentials?.password || ''} isSecret />
                </div>

                <div>
                    <CopyInput label={LL.serviceDetail.databaseName()} value={service.credentials?.databaseName || 'postgres'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CopyInput label={LL.serviceDetail.internalHost()} value={service.credentials?.host || ''} />
                    <CopyInput label={LL.serviceDetail.internalPort()} value={service.credentials?.port.toString() || '5432'} />
                </div>

                <div>
                    <CopyInput label={LL.serviceDetail.connectionString()} value={service.credentials?.connectionString || ''} isSecret />
                </div>
            </div>
        </div>
    );
};

const NetworkingTab: React.FC<{ service: Service, projectId: string, isDatabase: boolean }> = ({ service, projectId, isDatabase }) => {
    const [localDomains, setLocalDomains] = useState<Domain[]>(service.domains || []);
    const [isAddingDomain, setIsAddingDomain] = useState(false);
    const [redirects, setRedirects] = useState<any[]>(service.redirects || []);
    const [exposedPort, setExposedPort] = useState(service.exposedPort || 0);
    const [isSavingPort, setIsSavingPort] = useState(false);

    const handleSaveExposedPort = async () => {
        setIsSavingPort(true);
        try {
            await updateService(projectId, service.id, {
                exposedPort
            });
            alert('Porta exposta atualizada com sucesso');
        } catch (error: any) {
            console.error('Failed to update exposed port:', error);
            alert('Falha ao atualizar porta exposta: ' + error.message);
        } finally {
            setIsSavingPort(false);
        }
    };

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
                        <h3 className="text-lg font-semibold text-textPrimary">Domains</h3>
                        <button
                            onClick={() => void handleAddDomain()}
                            disabled={isAddingDomain}
                            className="text-sm bg-primary hover:bg-primaryHover active:bg-primaryActive text-white px-3 py-1.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-70"
                        >
                            {isAddingDomain ? 'Adding...' : 'Add Domain'}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {localDomains.map(domain => (
                            <div key={domain.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm hover:border-primary/30 transition-all duration-200">
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <div className="bg-success/10 text-success p-2 rounded-lg">
                                        <Globe size={18} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <a href={`https://${domain.domain}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-textPrimary hover:text-primary hover:underline truncate">
                                            {domain.domain}
                                        </a>
                                        <span className="text-xs text-textSecondary flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                            TLS Active • {domain.targetProtocol || 'HTTP'} {'->'} {domain.targetPort || service.port}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 border-l border-border pl-3">
                                    <button
                                        onClick={() => void handleRemoveDomain(domain.id)}
                                        className="p-2 text-textSecondary hover:text-error hover:bg-error/10 rounded-lg transition-colors duration-200"
                                    >
                                        <Trash2 size={16} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {localDomains.length === 0 && (
                            <div className="text-center p-8 bg-background rounded-xl border border-dashed border-border text-textSecondary text-sm">
                                No domains configured.
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-textPrimary">Redirects</h3>
                            <button
                                onClick={() => void handleAddRedirect()}
                                className="text-sm bg-card border border-border text-textPrimary px-3 py-1.5 rounded-lg font-medium hover:bg-background transition-colors duration-200"
                            >
                                Add Redirect
                            </button>
                        </div>

                        <div className="space-y-2">
                            {redirects.map((r: any) => (
                                <div key={r.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-mono text-textPrimary">{r.from}</span>
                                        <ArrowLeft size={14} strokeWidth={1.5} className="rotate-180 text-textSecondary" />
                                        <span className="font-mono text-textPrimary">{r.to}</span>
                                        <span className="text-xs bg-background px-1.5 py-0.5 rounded text-textSecondary">{r.type}</span>
                                    </div>
                                    <button onClick={() => void handleRemoveRedirect(r.id)} className="text-textSecondary hover:text-error transition-colors duration-200">
                                        <Trash2 size={14} strokeWidth={1.5} />
                                    </button>
                                </div>
                            ))}
                            {redirects.length === 0 && (
                                <div className="text-center p-4 bg-background rounded-lg border border-dashed border-border text-textSecondary text-xs">
                                    No redirects configured.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* DB Expose */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Globe size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 mb-1">Public Exposure</h3>
                                <p className="text-sm text-textSecondary mb-4">
                                    Make this service accessible from outside the cluster.
                                    <br /><span className="text-amber-600 text-xs mt-1 block">Warning: This opens the port to the public internet. Ensure you have strong passwords.</span>
                                </p>

                                <div className="max-w-xs">
                                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wide mb-1.5">Public Port</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={exposedPort}
                                            onChange={(e) => setExposedPort(Number(e.target.value))}
                                            placeholder="e.g. 5432"
                                            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                        <button
                                            onClick={() => void handleSaveExposedPort()}
                                            disabled={isSavingPort}
                                            className="bg-slate-900 text-white px-4 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-70"
                                        >
                                            {isSavingPort ? 'Saving...' : 'Save'}
                                        </button>
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
            alert(LL.serviceDetail.changesSaved());
        } catch (error: any) {
            console.error('Failed to save:', error);
            alert(LL.serviceDetail.failedToSave() + ': ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(LL.serviceDetail.deleteServiceConfirm())) {
            return;
        }
        try {
            await deleteService(projectId, service.id);
            window.location.reload();
        } catch (error: any) {
            console.error('Failed to delete service:', error);
            alert(LL.serviceDetail.failedToDelete() + ': ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">Docker Image</label>
                        <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-mono transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">Container User</label>
                        <input
                            type="text"
                            placeholder="root"
                            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-mono transition-all duration-200"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">Command / Entrypoint</label>
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="e.g. npm start"
                        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-mono transition-all duration-200"
                    />
                </div>

                <div className="pt-4 border-t border-border">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primaryHover active:bg-primaryActive text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-70"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="bg-error/10 border border-error/20 rounded-xl p-6">
                <h3 className="text-error font-bold mb-2">{LL.serviceDetail.dangerZone()}</h3>
                <p className="text-error text-sm mb-4">{LL.serviceDetail.dangerZoneDesc()}</p>
                <div className="flex gap-3">
                    <button
                        onClick={handleDelete}
                        className="bg-card border border-error/20 text-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/10 transition-colors duration-200"
                    >
                        {LL.serviceDetail.deleteService()}
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm(LL.serviceDetail.forceRebuildConfirm())) {
                                await restartService(service.id);
                                alert(LL.serviceDetail.rebuildTriggered());
                            }
                        }}
                        className="bg-card border border-error/20 text-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/10 transition-colors duration-200"
                    >
                        {LL.serviceDetail.forceRebuild()}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BackupsTab: React.FC<{ service: Service }> = ({ service }) => {
    const LL = useTranslations();
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
        if (!confirm(LL.serviceDetail.restoreBackupConfirm())) {
            return;
        }

        try {
            await restoreBackup(service.id, backupId);
            setBackupNotification({
                type: 'success',
                title: LL.serviceDetail.backupRestored(),
                message: 'Banco de dados restaurado com sucesso do backup.'
            });
        } catch (error: any) {
            setBackupNotification({
                type: 'error',
                title: LL.serviceDetail.restoreFailed(),
                message: error.message || 'Falha ao restaurar backup'
            });
        } finally {
            setTimeout(() => setBackupNotification(null), 5000);
        }
    };

    const handleDeleteBackup = async (backupId: string) => {
        if (!confirm(LL.serviceDetail.deleteBackupConfirm())) {
            return;
        }

        try {
            await deleteBackup(service.id, backupId);
            setBackups(backups.filter(b => b.id !== backupId));
            setBackupNotification({
                type: 'success',
                title: LL.serviceDetail.backupDeleted(),
                message: 'Backup excluído com sucesso.'
            });
        } catch (error: any) {
            setBackupNotification({
                type: 'error',
                title: LL.serviceDetail.deleteFailed(),
                message: error.message || LL.serviceDetail.failedToDeleteBackup()
            });
        } finally {
            setTimeout(() => setBackupNotification(null), 5000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700">{LL.serviceDetail.backups()}</h3>
                <button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                >
                    {isCreatingBackup ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isCreatingBackup ? LL.serviceDetail.creating() : LL.serviceDetail.createBackup()}
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-12 text-center text-textSecondary">
                        <Loader2 size={32} className="mx-auto mb-3 text-textSecondary animate-spin" />
                        <p>{LL.serviceDetail.loadingBackups()}</p>
                    </div>
                ) : backups && backups.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-background text-textSecondary font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-semibold">{LL.serviceDetail.filename()}</th>
                                <th className="px-6 py-3 font-semibold">{LL.serviceDetail.size()}</th>
                                <th className="px-6 py-3 font-semibold">{LL.serviceDetail.date()}</th>
                                <th className="px-6 py-3 font-semibold">{LL.serviceDetail.status()}</th>
                                <th className="px-6 py-3 text-right font-semibold">{LL.serviceDetail.actions()}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {backups.map(bk => (
                                <tr key={bk.id} className="hover:bg-background/50">
                                    <td className="px-6 py-4 font-mono text-slate-600">{bk.filename || bk.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{bk.size || 'N/A'}</td>
                                    <td className="px-6 py-4 text-slate-600">{bk.timestamp || bk.createdAt}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/20">
                                            {bk.status || 'Complete'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleRestoreBackup(bk.id)}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            {LL.serviceDetail.restoreBackup()}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBackup(bk.id)}
                                            className="text-error hover:underline font-medium"
                                        >
                                            {LL.common.delete()}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-textSecondary">
                        <HardDrive size={32} className="mx-auto mb-3 text-textSecondary" />
                        <p>{LL.serviceDetail.noBackupsFound()}</p>
                    </div>
                )}
            </div>

            {backupNotification && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`rounded-xl shadow-2xl border p-4 min-w-[400px] ${backupNotification.type === 'success'
                        ? 'bg-success/10 border-success/20'
                        : 'bg-error/10 border-error/20'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${backupNotification.type === 'success'
                                ? 'bg-success/20 text-success'
                                : 'bg-error/20 text-error'
                                }`}>
                                {backupNotification.type === 'success' ? (
                                    <Check size={18} />
                                ) : (
                                    <Info size={18} />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm mb-1 ${backupNotification.type === 'success' ? 'text-success' : 'text-error'
                                    }`}>
                                    {backupNotification.title}
                                </h4>
                                <p className={`text-xs ${backupNotification.type === 'success' ? 'text-success' : 'text-error'
                                    }`}>
                                    {backupNotification.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setBackupNotification(null)}
                                className={`p-1 rounded hover:bg-opacity-50 transition-colors duration-200 ${backupNotification.type === 'success'
                                    ? 'text-success hover:bg-success/20'
                                    : 'text-error hover:bg-error/20'
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
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-bold text-slate-800">Resource Limits</h3>
                    <p className="text-xs text-textSecondary mt-1">Host capacity: {HOST_MAX_CPU} CPU cores, {HOST_MAX_MEMORY} MB memory</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HardDrive size={18} className="text-purple-500" />
                            <span className="font-semibold text-slate-700">Memory</span>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-textSecondary">Reservation</label>
                                <input
                                    type="number"
                                    value={memoryReservation}
                                    onChange={(e) => setMemoryReservation(Number(e.target.value))}
                                    onBlur={validateResources}
                                    className="w-20 text-xs font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 text-right"
                                    min="0"
                                    max={HOST_MAX_MEMORY}
                                />
                                <span className="text-xs font-medium text-textSecondary">MB</span>
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
                                <p className="text-xs text-error mt-1 flex items-center gap-1">
                                    <Info size={12} /> {errors.memoryReservation}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-textSecondary">Limit</label>
                                <input
                                    type="number"
                                    value={memoryLimit}
                                    onChange={(e) => setMemoryLimit(Number(e.target.value))}
                                    onBlur={validateResources}
                                    className="w-20 text-xs font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 text-right"
                                    min="0"
                                    max={HOST_MAX_MEMORY}
                                />
                                <span className="text-xs font-medium text-textSecondary">MB</span>
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
                                <p className="text-xs text-error mt-1 flex items-center gap-1">
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
                                <label className="text-xs font-medium text-textSecondary">Reservation</label>
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
                                <span className="text-xs font-medium text-textSecondary">Cores</span>
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
                                <p className="text-xs text-error mt-1 flex items-center gap-1">
                                    <Info size={12} /> {errors.cpuReservation}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium text-textSecondary">Limit</label>
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
                                <span className="text-xs font-medium text-textSecondary">Cores</span>
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
                                <p className="text-xs text-error mt-1 flex items-center gap-1">
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
                        {isSaving ? LL.serviceDetail.updating() : LL.serviceDetail.updateResources()}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SourceTab: React.FC<{ service: Service, projectId: string }> = ({ service, projectId }) => {
    const LL = useTranslations();
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
            alert('Configuração de origem salva');
        } catch (error: any) {
            console.error('Failed to save source:', error);
            alert(LL.serviceDetail.failedToSaveSource() + ': ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6">Build Source</h3>
                <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-6">
                    <button
                        onClick={() => setActiveSourceType('docker')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSourceType === 'docker'
                            ? 'bg-white text-slate-800 shadow-sm border border-border/50'
                            : 'text-textSecondary hover:text-slate-700'
                            }`}
                    >
                        Docker Image
                    </button>
                    <button
                        onClick={() => setActiveSourceType('git')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSourceType === 'git'
                            ? 'bg-white text-slate-800 shadow-sm border border-border/50'
                            : 'text-textSecondary hover:text-slate-700'
                            }`}
                    >
                        Git Repository
                    </button>
                </div>

                <div className="space-y-6">
                    {activeSourceType === 'docker' ? (
                        <div>
                            <label className="block text-xs font-bold text-textSecondary uppercase tracking-wide mb-1.5">Image Name</label>
                            <input
                                type="text"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                placeholder="e.g. nginx:latest"
                                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wide mb-1.5">Repository URL</label>
                                    <input
                                        type="text"
                                        value={repo}
                                        onChange={(e) => setRepo(e.target.value)}
                                        placeholder="https://github.com/org/repo"
                                        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wide mb-1.5">Branch</label>
                                    <div className="flex items-center">
                                        <GitBranch size={16} className="absolute ml-3 text-slate-400" />
                                        <input
                                            type="text"
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            placeholder="main"
                                            className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wide mb-1.5">Git Credential</label>
                                <div className="relative">
                                    <KeyRound size={16} className="absolute ml-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white appearance-none text-slate-600">
                                        <option value="">{LL.serviceDetail.noCredentialsPublicRepo()}</option>
                                        <option value="gh_1">OpenPanel Bot (GitHub)</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronDown size={14} className="text-slate-400" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                    <Info size={10} /> {LL.serviceDetail.addMoreCredentials()}
                                </p>
                            </div>
                        </>
                    )}

                    <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-800">Auto Deploy</label>
                            <div className="relative inline-block w-10 h-6 bg-green-500 rounded-full cursor-pointer">
                                <span className="absolute right-1 top-1 inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                            </div>
                        </div>
                        <p className="text-xs text-textSecondary">Automatically deploy new versions when the {activeSourceType === 'docker' ? 'image' : 'code'} is updated.</p>
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
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm min-h-[400px]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-background/50">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-slate-700">Deployment History</h3>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded font-bold border border-green-200">Webhook Active</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-200 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-textSecondary hover:text-slate-700'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-textSecondary hover:text-slate-700'}`}
                            title="List View"
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="divide-y divide-slate-100">
                        {(service.deployments || []).map((dep, idx) => (
                            <div key={dep.id} className="px-6 py-4 flex items-center justify-between group hover:bg-background transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${dep.status === 'Success' ? 'bg-green-100 text-green-600' :
                                        dep.status === 'Building' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                                            'bg-red-100 text-error'
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
                                        <p className="text-xs text-textSecondary mt-1 flex items-center gap-2">
                                            <GitCommit size={12} /> {dep.commit}
                                            <span className="text-textSecondary">|</span>
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
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-background/50">
                        {(service.deployments || []).map((dep, idx) => (
                            <div key={dep.id} className="bg-white p-5 rounded-xl border border-border hover:border-primary/40 hover:shadow-lg transition-all group flex flex-col hover:-translate-y-0.5 duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white shadow-sm ${dep.status === 'Success' ? 'bg-green-100 text-green-600' :
                                        dep.status === 'Building' ? 'bg-blue-100 text-blue-600' :
                                            'bg-red-100 text-error'
                                        }`}>
                                        {dep.status === 'Success' ? <Check size={14} /> :
                                            dep.status === 'Building' ? <RotateCw size={14} /> :
                                                <Info size={14} />}
                                    </div>
                                    <span className="text-xs font-mono text-textSecondary bg-slate-100 px-2 py-0.5 rounded">#{dep.id.split('_')[1]}</span>
                                </div>

                                <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 leading-tight">{dep.message}</h4>

                                <div className="mt-auto space-y-3 pt-4">
                                    <div className="flex items-center gap-2 text-xs text-textSecondary font-mono bg-background p-1.5 rounded border border-slate-100">
                                        <GitBranch size={12} className="text-slate-400" /> {dep.branch}
                                        <span className="text-textSecondary mx-1">|</span>
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

const EnvironmentTab: React.FC<{ service: Service, projectId: string }> = ({ service, projectId }) => {
    const [localEnvVars, setLocalEnvVars] = useState<EnvVar[]>(service.envVars || []);
    const [mode, setMode] = useState<'simple' | 'raw'>('simple');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const handleUpdate = (index: number, key: string, value: string) => {
        const newVars = [...localEnvVars];
        newVars[index] = { ...newVars[index], key, value };
        setLocalEnvVars(newVars);
    };

    const handleDelete = async (index: number) => {
        const envVar = localEnvVars[index];
        if (!envVar) return;

        if (envVar.locked) {
            alert(LL.serviceDetail.cannotDeleteLocked());
            return;
        }

        if (envVar.id) {
            try {
                await deleteEnvVar(projectId, envVar.id);
                setLocalEnvVars(localEnvVars.filter((_, i) => i !== index));
            } catch (error) {
                console.error('Failed to delete env var:', error);
                alert(LL.serviceDetail.failedToDeleteEnvVar());
            }
        } else {
            setLocalEnvVars(localEnvVars.filter((_, i) => i !== index));
        }
    };

    const handleAdd = () => {
        setLocalEnvVars([...localEnvVars, { key: '', value: '', isSecret: false }]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        setSaveError(null);

        try {
            const hasInvalidVars = localEnvVars.some(v => !v.key.trim() && v.value.trim());
            if (hasInvalidVars) {
                setSaveError(LL.serviceDetail.allVarsMustHaveKey());
                setIsSaving(false);
                return;
            }

            const validVars = localEnvVars.filter(v => v.key.trim() && v.value.trim());

            for (const envVar of validVars) {
                if (envVar.id) {
                    await updateEnvVar(projectId, envVar.id, {
                        key: envVar.key,
                        value: envVar.value,
                        isSecret: envVar.isSecret
                    });
                } else {
                    const created = await createEnvVar(projectId, {
                        key: envVar.key,
                        value: envVar.value,
                        isSecret: envVar.isSecret
                    });
                    envVar.id = created.id;
                }
            }

            setLocalEnvVars(validVars);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: any) {
            console.error('Failed to save environment variables:', error);
                setSaveError(error.message || LL.serviceDetail.failedToSaveEnvVars());
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('simple')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'simple' ? 'bg-white shadow-sm text-slate-800' : 'text-textSecondary'}`}
                    >
                        Simple
                    </button>
                    <button
                        onClick={() => setMode('raw')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'raw' ? 'bg-white shadow-sm text-slate-800' : 'text-textSecondary'}`}
                    >
                        Raw .env
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ${saveSuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-primary text-white hover:bg-blue-600 shadow-blue-200'
                        } disabled:opacity-70`}
                >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    {saveSuccess && <Check size={14} />}
                    {saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Variables'}
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {mode === 'simple' ? (
                    <div className="divide-y divide-slate-100">
                        {localEnvVars.map((env, i) => (
                            <div key={i} className="p-3 flex items-start gap-3 group hover:bg-background transition-colors">
                                <div className="flex-1 space-y-1">
                                    <input
                                        type="text"
                                        value={env.key}
                                        onChange={(e) => handleUpdate(i, e.target.value, env.value)}
                                        className="w-full text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300"
                                        placeholder="KEY"
                                        readOnly={env.locked}
                                    />
                                    <input
                                        type="text"
                                        value={env.value}
                                        onChange={(e) => handleUpdate(i, env.key, e.target.value)}
                                        className="w-full text-sm text-slate-600 bg-background border border-border rounded px-2 py-1.5 focus:border-primary focus:outline-none"
                                        placeholder="Value"
                                        readOnly={env.locked}
                                    />
                                </div>
                                <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    {env.locked ? (
                                        <LockIcon size={16} className="text-amber-500" />
                                    ) : (
                                        <button onClick={() => handleDelete(i)} className="p-2 text-textSecondary hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="p-3">
                            <button onClick={handleAdd} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide">
                                <Plus size={14} /> {LL.serviceDetail.addVariable()}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <textarea
                            defaultValue={localEnvVars.map(e => `${e.key}=${e.value}`).join('\n')}
                            className="w-full h-96 p-4 font-mono text-xs text-slate-700 leading-relaxed resize-none focus:outline-none"
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const LockIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
