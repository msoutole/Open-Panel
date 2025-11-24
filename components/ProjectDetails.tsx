import React, { useState } from 'react';
import { Project, Service, EnvVar } from '../types';
import { 
    ArrowLeft, Box, Database, FileCode, SlidersHorizontal, 
    KeyRound, Gauge, Settings, Plus, LayoutDashboard, TerminalSquare, 
    Trash2, ExternalLink, HardDrive, Key, Check,
    MoreHorizontal, RotateCw, Square, Info, Copy, Eye, EyeOff, Globe, History, Cpu, GitBranch,
    LayoutGrid, List as ListIcon, ChevronRight, Calendar, User, GitCommit, Github, Loader2
} from 'lucide-react';
import { WebTerminal } from './WebTerminal';
import { INITIAL_LOGS } from '../constants';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

// ----------------------------------------------------------------------------------
// Main Project Services List (When no service is selected)
// ----------------------------------------------------------------------------------

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localServices, setLocalServices] = useState<Service[]>(project.services);

  const handleAddService = () => {
      const name = prompt("Enter Service Name:");
      if (!name) return;
      
      const newService: Service = {
          id: `svc_${Date.now()}`,
          name: name,
          type: 'app',
          image: 'nginx:latest',
          status: 'Stopped',
          cpu: 0,
          memory: '0 MB',
          port: 80
      };
      setLocalServices([...localServices, newService]);
      alert(`Service ${name} created successfully.`);
  };

  if (selectedService) {
      return (
          <ServiceDetailView 
            service={selectedService} 
            project={project}
            onBack={() => setSelectedService(null)}
            onSelectService={setSelectedService} 
          />
      );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
                <p className="text-slate-500 text-sm">{project.description}</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('grid')} 
                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <ListIcon size={18} />
                </button>
            </div>
            <button 
                onClick={handleAddService}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
                <Plus size={16} /> Add Service
            </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localServices.map(service => (
                <div 
                    key={service.id} 
                    onClick={() => setSelectedService(service)}
                    className="bg-white border border-slate-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${
                            service.type === 'db' || service.type === 'redis' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            {service.type === 'db' || service.type === 'redis' ? <Database size={24} /> : <Box size={24} />}
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            service.status === 'Running' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                            {service.status}
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-50 px-2 py-1 rounded w-fit">{service.image}</p>
                    
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Gauge size={14} /> {service.cpu}%
                        </div>
                        <div className="flex items-center gap-1.5">
                            <HardDrive size={14} /> {service.memory}
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                            {service.exposedPort ? <Globe size={14} className="text-blue-400"/> : <Square size={14} />}
                        </div>
                    </div>
                </div>
            ))}
            <button 
                onClick={handleAddService}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-blue-50/30 transition-all min-h-[180px] group"
            >
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    <Plus size={24} />
                </div>
                <span className="font-medium text-sm">Create New Service</span>
            </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-4">Service Name</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Image / Type</th>
                        <th className="px-6 py-4">Resources</th>
                        <th className="px-6 py-4">Networking</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {localServices.map(service => (
                         <tr key={service.id} onClick={() => setSelectedService(service)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                        service.type === 'db' || service.type === 'redis' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {service.type === 'db' || service.type === 'redis' ? <Database size={16} /> : <Box size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 group-hover:text-primary transition-colors">{service.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{service.type}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                    service.status === 'Running' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'Running' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                    {service.status}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit max-w-[180px] truncate" title={service.image}>
                                    {service.image}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Cpu size={12} className="text-slate-400"/> {service.cpu}%
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HardDrive size={12} className="text-slate-400"/> {service.memory}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-xs text-slate-500">
                                    {service.exposedPort ? (
                                        <div className="flex items-center gap-1 text-slate-700 font-mono"><Globe size={12}/> :{service.exposedPort}</div>
                                    ) : service.port ? (
                                        <div className="flex items-center gap-1 text-slate-400 font-mono"><Square size={12}/> :{service.port}</div>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary ml-auto" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------------
// Service Detail View
// ----------------------------------------------------------------------------------

interface ServiceDetailViewProps {
    service: Service;
    project: Project;
    onBack: () => void;
    onSelectService: (service: Service) => void;
}

const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({ service, project, onBack, onSelectService }) => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isWebConsoleOpen, setIsWebConsoleOpen] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);

    const isDatabase = service.type === 'db' || service.type === 'redis';

    const handleRestart = () => {
        setIsRestarting(true);
        setTimeout(() => {
            setIsRestarting(false);
            alert(`Service ${service.name} restarted successfully.`);
        }, 2000);
    };

    const handleDeploy = () => {
        setIsDeploying(true);
        setTimeout(() => {
            setIsDeploying(false);
            alert(`Deployment triggered for ${service.name}.`);
        }, 2000);
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
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative ${
                                    s.id === service.id 
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
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === item.id 
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
                         <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                             service.status === 'Running' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                         }`}>
                             {service.status}
                         </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsWebConsoleOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
                             <TerminalSquare size={14} /> Console
                        </button>
                        <button 
                            onClick={handleRestart}
                            disabled={isRestarting}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 disabled:opacity-70"
                        >
                             {isRestarting ? <Loader2 size={14} className="animate-spin"/> : <RotateCw size={14} />}
                             {isRestarting ? 'Restarting...' : 'Restart'}
                        </button>
                        <button 
                            onClick={handleDeploy}
                            disabled={isDeploying}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                        >
                             {isDeploying ? <Loader2 size={14} className="animate-spin"/> : null}
                             Deploy
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'overview' && <OverviewTab service={service} onOpenConsole={() => setIsWebConsoleOpen(true)} />}
                        
                        {activeTab === 'environment' && <EnvironmentTab service={service} />}
                        {activeTab === 'networking' && <NetworkingTab service={service} isDatabase={isDatabase} />}
                        {activeTab === 'source' && <SourceTab service={service} />}
                        {activeTab === 'deployments' && <DeploymentsTab service={service} />}
                        {activeTab === 'resources' && <ResourcesTab service={service} />}
                        {activeTab === 'advanced' && <AdvancedTab service={service} />}

                        {activeTab === 'credentials' && isDatabase && <CredentialsTab service={service} />}
                        {activeTab === 'backups' && isDatabase && <BackupsTab service={service} />}
                    </div>
                </div>
            </div>

             {isWebConsoleOpen && (
                <WebTerminal serviceName={service.name} onClose={() => setIsWebConsoleOpen(false)} />
            )}
        </div>
    );
};

// Helper for select arrow
const ChevronDown = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
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
                             <span className="text-slate-600 shrink-0">{log.timestamp.split('T')[1].split('.')[0]}</span>
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
                                 {visible ? <EyeOff size={14}/> : <Eye size={14}/>}
                             </button>
                         )}
                         <button onClick={copyToClipboard} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200" title="Copy">
                             <Copy size={14}/>
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

const NetworkingTab: React.FC<{ service: Service, isDatabase: boolean }> = ({ service, isDatabase }) => (
    <div className="space-y-6">
        {!isDatabase ? (
            <>
                {/* App Domains */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-700">Domains</h3>
                    <button className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200">Add Domain</button>
                </div>
                <div className="space-y-3">
                    {service.domains?.map(domain => (
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
                                            TLS Active • {domain.targetProtocol} -> {domain.targetPort}
                                         </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                    ))}
                    {(!service.domains || service.domains.length === 0) && (
                        <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                            No domains configured.
                        </div>
                    )}
                </div>

                <div className="mt-8">
                     <h3 className="text-lg font-semibold text-slate-700 mb-4">Redirects</h3>
                     <button className="w-full py-2 bg-white border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">
                        Add Redirect Rule
                     </button>
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
                                <br/><span className="text-amber-600 text-xs mt-1 block">Warning: This opens the port to the public internet. Ensure you have strong passwords.</span>
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

const AdvancedTab: React.FC<{ service: Service }> = ({ service }) => (
    <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Docker Image</label>
                    <input 
                        type="text" 
                        defaultValue={service.image}
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
                    defaultValue={service.command || ''}
                    placeholder="e.g. npm start"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono text-slate-700"
                />
            </div>

            <div className="pt-4 border-t border-slate-100">
                <button onClick={() => alert("Changes saved")} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                    Save Changes
                </button>
            </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
             <h3 className="text-red-800 font-bold mb-2">Danger Zone</h3>
             <p className="text-red-600 text-sm mb-4">Irreversible actions that affect the availability of your service.</p>
             <div className="flex gap-3">
                 <button className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                     Delete Service
                 </button>
                 <button className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                     Force Rebuild
                 </button>
             </div>
        </div>
    </div>
);

const BackupsTab: React.FC<{ service: Service }> = ({ service }) => (
    <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-700">Backups</h3>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
                Create Backup
            </button>
         </div>

         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             {service.backups && service.backups.length > 0 ? (
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
                         {service.backups.map(bk => (
                             <tr key={bk.id} className="hover:bg-slate-50/50">
                                 <td className="px-6 py-4 font-mono text-slate-600">{bk.filename}</td>
                                 <td className="px-6 py-4 text-slate-600">{bk.size}</td>
                                 <td className="px-6 py-4 text-slate-600">{bk.timestamp}</td>
                                 <td className="px-6 py-4">
                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                         {bk.status}
                                     </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                     <button className="text-primary hover:underline font-medium">Download</button>
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
    </div>
);

const ResourcesTab: React.FC<{ service: Service }> = ({ service }) => (
    <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Resource Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Memory */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <HardDrive size={18} className="text-purple-500" />
                        <span className="font-semibold text-slate-700">Memory</span>
                    </div>
                    
                    <div>
                        <div className="flex justify-between mb-1">
                             <label className="text-xs font-medium text-slate-500">Reservation</label>
                             <span className="text-xs font-bold text-slate-700">{service.resources?.memoryReservation || 0} MB</span>
                        </div>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                             <label className="text-xs font-medium text-slate-500">Limit</label>
                             <span className="text-xs font-bold text-slate-700">{service.resources?.memoryLimit || 'Unlimited'}</span>
                        </div>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                    </div>
                </div>

                {/* CPU */}
                <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <Cpu size={18} className="text-blue-500" />
                        <span className="font-semibold text-slate-700">CPU</span>
                    </div>
                    
                    <div>
                        <div className="flex justify-between mb-1">
                             <label className="text-xs font-medium text-slate-500">Reservation</label>
                             <span className="text-xs font-bold text-slate-700">{service.resources?.cpuReservation || 0} Cores</span>
                        </div>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                             <label className="text-xs font-medium text-slate-500">Limit</label>
                             <span className="text-xs font-bold text-slate-700">{service.resources?.cpuLimit || 'Unlimited'}</span>
                        </div>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-100 text-right">
                <button onClick={() => alert("Resources Updated!")} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                    Update Resources
                </button>
            </div>
        </div>
    </div>
);

const SourceTab: React.FC<{ service: Service }> = ({ service }) => {
    const [activeSourceType, setActiveSourceType] = useState<'docker' | 'git'>((service.source?.type as 'docker'|'git') || 'docker');
    
    return (
    <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Build Source</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-6">
                <button 
                    onClick={() => setActiveSourceType('docker')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeSourceType === 'docker'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Docker Image
                </button>
                <button 
                    onClick={() => setActiveSourceType('git')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeSourceType === 'git'
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
                            defaultValue={service.image}
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
                                    defaultValue={service.source?.repo || ''}
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
                                        defaultValue={service.source?.branch || 'main'}
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
                                <Info size={10} /> Add more credentials in System Settings > GitOps
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

                <button onClick={() => alert("Source Configuration Saved!")} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                    Save Configuration
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
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                                    dep.status === 'Success' ? 'bg-green-100 text-green-600' : 
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
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            dep.status === 'Success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
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
                                    <Calendar size={12}/> {dep.timestamp}
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white shadow-sm ${
                                    dep.status === 'Success' ? 'bg-green-100 text-green-600' : 
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
                                     <span className="flex items-center gap-1"><User size={10}/> {dep.author || 'system'}</span>
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

const EnvironmentTab: React.FC<{ service: Service }> = ({ service }) => {
    const [mode, setMode] = useState<'simple' | 'raw'>('simple');
    const [localEnvVars, setLocalEnvVars] = useState<EnvVar[]>(service.envVars || []);

    const handleUpdate = (index: number, key: string, value: string) => {
        const newVars = [...localEnvVars];
        newVars[index] = { ...newVars[index], key, value };
        setLocalEnvVars(newVars);
    };

    const handleDelete = (index: number) => {
        setLocalEnvVars(localEnvVars.filter((_, i) => i !== index));
    };

    const handleAdd = () => {
        setLocalEnvVars([...localEnvVars, { key: '', value: '' }]);
    };

    const handleSave = () => {
        alert("Environment Variables Saved!");
    };
    
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setMode('simple')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'simple' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                    >
                        Simple
                    </button>
                    <button 
                         onClick={() => setMode('raw')}
                         className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'raw' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                    >
                        Raw .env
                    </button>
                </div>
                <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200">
                    Save Variables
                </button>
             </div>

             <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                 {mode === 'simple' ? (
                     <div className="divide-y divide-slate-100">
                         {localEnvVars.map((env, i) => (
                             <div key={i} className="p-3 flex items-start gap-3 group hover:bg-slate-50 transition-colors">
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
                                        className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:border-primary focus:outline-none"
                                        placeholder="Value"
                                        readOnly={env.locked}
                                     />
                                 </div>
                                 <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                     {env.locked ? (
                                         <LockIcon size={16} className="text-amber-500" />
                                     ) : (
                                         <button onClick={() => handleDelete(i)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                     )}
                                 </div>
                             </div>
                         ))}
                         <div className="p-3">
                             <button onClick={handleAdd} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide">
                                 <Plus size={14} /> Add Variable
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
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);