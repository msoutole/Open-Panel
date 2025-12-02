import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CreateProjectModal } from './CreateProjectModal';
import { Project, MetricPoint } from '../types';
import { getProjects, getDashboardStats, getSystemMetrics, SystemMetrics } from '../services/api';
import { useMetrics } from '../hooks/useMetrics';
import { useToast } from '../hooks/useToast';
import { debounce } from '../utils/debounce';
import { SkeletonWidget } from './SkeletonLoader';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Layers, Activity, Search, Plus, X, TrendingUp, TrendingDown, MoreHorizontal, LayoutGrid, List as ListIcon, ChevronRight, Clock, Users, Loader2 } from 'lucide-react';

interface DashboardViewProps {
  onProjectSelect: (project: Project) => void;
  view?: 'dashboard' | 'monitor';
}

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  children?: React.ReactNode;
  className?: string;
  onRemove?: () => void;
  trend?: 'up' | 'down';
  accentColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, children, className = "", onRemove, trend, accentColor = "bg-primary" }) => (
  <div className={`bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full ${className}`}>
    <div className={`absolute top-0 left-0 w-full h-1 ${accentColor}`}></div>
    {onRemove && (
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-3 right-3 p-1.5 text-textSecondary hover:text-error hover:bg-error/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    )}

    <div className="flex justify-between items-start z-10 relative">
      <div className="flex-1">
        <h3 className="text-textSecondary font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
          {title}
          {trend === 'up' && <div className="bg-success/10 p-0.5 rounded text-success"><TrendingUp size={12} strokeWidth={2} /></div>}
          {trend === 'down' && <div className="bg-warning/10 p-0.5 rounded text-warning"><TrendingDown size={12} strokeWidth={2} /></div>}
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold text-textPrimary tracking-tight">{value}</span>
          {subtext && <span className="text-xs font-medium text-textSecondary bg-background px-2 py-0.5 rounded-full">{subtext}</span>}
        </div>
      </div>
      {!onRemove && (
        <button className="text-textSecondary hover:text-textPrimary transition-colors duration-200">
          <MoreHorizontal size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
    {/* Explicit height here prevents Recharts width(-1) error */}
    <div className="w-full mt-4 h-32 relative z-0">
      {children}
    </div>
  </div>
);

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const services = project.services || [];
  const activeServices = services.filter(s => s.status === 'Running').length;
  const totalServices = services.length;
  const isHealthy = activeServices === totalServices && totalServices > 0;

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer relative overflow-hidden h-full flex flex-col" onClick={onClick}>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-border ${isHealthy ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white'
            }`}>
            <Layers size={26} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-textPrimary group-hover:text-primary transition-colors duration-200">{project.name}</h3>
            <p className="text-sm text-textSecondary line-clamp-1">{project.description}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wide ${isHealthy ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
          {project.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 my-5 relative z-10 flex-1">
        <div className="bg-background p-3 rounded-lg border border-border group-hover:bg-white transition-colors duration-200">
          <p className="text-[10px] text-textSecondary uppercase tracking-wider mb-1 font-medium">Services</p>
          <p className="text-sm font-bold text-textPrimary">{activeServices} / {totalServices} <span className="text-xs font-normal text-textSecondary">Running</span></p>
        </div>
        <div className="bg-background p-3 rounded-lg border border-border group-hover:bg-white transition-colors duration-200">
          <p className="text-[10px] text-textSecondary uppercase tracking-wider mb-1 font-medium">Team</p>
          <p className="text-sm font-bold text-textPrimary">{project.members.length} <span className="text-xs font-normal text-textSecondary">Members</span></p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4 relative z-10 mt-auto">
        <span className="text-xs text-textSecondary font-medium">Deployed {project.lastDeploy}</span>
        <button className="text-xs font-bold text-textSecondary group-hover:text-primary flex items-center gap-1.5 transition-colors duration-200 uppercase tracking-wider bg-background group-hover:bg-primary/10 px-3 py-1.5 rounded-lg">
          Manage <Activity size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

const ProjectListItem: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const services = project.services || [];
  const activeServices = services.filter(s => s.status === 'Running').length;
  const totalServices = services.length;
  const isHealthy = activeServices === totalServices && totalServices > 0;

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer mb-3"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-border shrink-0 ${isHealthy ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white'
          }`}>
          <Layers size={20} strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base text-textPrimary group-hover:text-primary transition-colors duration-200 truncate">{project.name}</h3>
          <p className="text-xs text-textSecondary truncate">{project.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 xl:gap-12 mr-4 md:mr-8 shrink-0">
        <div className="hidden md:block w-32">
          <div className="text-[10px] text-textSecondary uppercase font-medium mb-0.5">Services</div>
          <div className="text-sm font-semibold text-textPrimary flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-success' : 'bg-warning'}`}></div>
            {activeServices}/{totalServices} Active
          </div>
        </div>
        <div className="hidden lg:block w-32">
          <div className="text-[10px] text-textSecondary uppercase font-medium mb-0.5">Team</div>
          <div className="text-sm font-semibold text-textPrimary flex items-center gap-1.5">
            <Users size={14} strokeWidth={1.5} className="text-textSecondary" />
            {project.members.length} Members
          </div>
        </div>
        <div className="hidden xl:block w-32 text-right">
          <div className="text-[10px] text-textSecondary uppercase font-medium mb-0.5 flex items-center justify-end gap-1"><Clock size={10} strokeWidth={1.5} /> Last Deploy</div>
          <div className="text-xs font-semibold text-textSecondary">{project.lastDeploy}</div>
        </div>
        <div className="w-24 flex justify-end">
          <div className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wide inline-block ${isHealthy ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
            {project.status}
          </div>
        </div>
      </div>

      <div className="pl-4 border-l border-border">
        <ChevronRight className="text-textSecondary group-hover:text-primary transition-colors duration-200" size={20} strokeWidth={1.5} />
      </div>
    </div>
  );
};

type WidgetType = 'cpu' | 'memory' | 'storage' | 'network' | 'custom';

interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  value: string;
  subtext?: string;
  data?: MetricPoint[];
  trend?: 'up' | 'down';
  color?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onProjectSelect, view = 'dashboard' }) => {
  const isMonitor = view === 'monitor';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectSearch, setProjectSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const { showToast } = useToast();

  // Use state for projects to allow adding new ones
  const [projects, setProjects] = useState<Project[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);

  // Use WebSocket for real-time metrics
  const { metrics: realtimeMetrics, history: metricsHistoryData } = useMetrics({
    autoConnect: true,
    interval: 2000,
    maxHistory: 50,
  });

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects', error);
        showToast({
          type: 'error',
          title: 'Erro ao carregar projetos',
          message: error instanceof Error ? error.message : 'Não foi possível carregar os projetos',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [showToast]);

  // Fetch initial metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoadingMetrics(true);
        const metrics = await getSystemMetrics();
        setSystemMetrics(metrics);
        
        // Note: metricsHistory is already MetricPoint[], no conversion needed
        // The history will be populated from WebSocket data
      } catch (error) {
        console.error('Failed to load metrics', error);
        // Don't show toast for metrics errors as they're frequent
      } finally {
        setIsLoadingMetrics(false);
      }
    };
    fetchMetrics();
    
    // Refresh metrics every 5 seconds (less frequent since we have WebSocket)
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [metricsHistory]);


  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${Math.round(value * 100) / 100}%`;
  };

  // Memoized widgets calculation to prevent unnecessary recalculations
  const widgets = useMemo(() => {
    if (!systemMetrics) return [];

    const cpuValue = systemMetrics.cpu.usage.toFixed(2);
    const memUsed = formatBytes(systemMetrics.memory.used);
    const memTotal = formatBytes(systemMetrics.memory.total);
    const diskUsage = formatPercent(systemMetrics.disk.usage);
    const networkRx = formatBytes(systemMetrics.network.rxRate || 0);
    
    // Create network data points from history
    const networkData: MetricPoint[] = metricsHistoryData.slice(0, 7).map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      value: (m as SystemMetrics).network.rxRate / (1024 * 1024), // Convert to MB/s
    }));

    return [
      { 
        id: 'cpu', 
        type: 'cpu' as const, 
        title: 'Host CPU Load', 
        value: cpuValue, 
        subtext: 'avg', 
        data: metricsHistory.slice(-7), 
        trend: systemMetrics.cpu.usage > 50 ? 'up' as const : 'down' as const, 
        color: 'bg-primary' 
      },
      { 
        id: 'mem', 
        type: 'memory' as const, 
        title: 'Host RAM', 
        value: memUsed, 
        subtext: `/ ${memTotal}`, 
        color: 'bg-primary' 
      },
      { 
        id: 'disk', 
        type: 'storage' as const, 
        title: 'Storage', 
        value: diskUsage, 
        subtext: 'Used', 
        color: 'bg-secondary' 
      },
      { 
        id: 'net', 
        type: 'network' as const, 
        title: 'Ingress Traffic', 
        value: networkRx, 
        subtext: '/ sec', 
        data: networkData.length > 0 ? networkData : metricsHistory.slice(-7), 
        trend: (systemMetrics.network.rxRate || 0) > 0 ? 'up' as const : 'down' as const, 
        color: 'bg-warning' 
      },
    ];
  }, [systemMetrics, metricsHistory, metricsHistoryData, formatBytes, formatPercent]);

  const [customWidgets, setCustomWidgets] = useState<DashboardWidget[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      // Search is handled by filteredProjects state
    }, 300),
    []
  );

  // Combine default widgets with custom widgets
  const allWidgets = useMemo(() => [...widgets, ...customWidgets], [widgets, customWidgets]);

  const removeWidget = useCallback((id: string) => {
    if (window.confirm('Remove this widget?')) {
      setCustomWidgets(prev => prev.filter(w => w.id !== id));
    }
  }, []);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = useCallback((newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    showToast({
      type: 'success',
      title: 'Projeto criado',
      message: `O projeto "${newProject.name}" foi criado com sucesso`,
    });
  }, [showToast]);

  const addWidget = useCallback(() => {
    const newWidget: DashboardWidget = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      title: 'New Metric',
      value: '0',
      subtext: 'monitoring',
      data: metricsHistory.slice(-7), // Use real metrics history
      trend: 'up',
      color: 'bg-primary' // Default color for custom widgets
    };
    setCustomWidgets(prev => [...prev, newWidget]);
  }, [metricsHistory]);

  const renderWidgetContent = useCallback((widget: DashboardWidget) => {
    if (isLoadingMetrics && allWidgets.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-textSecondary" />
        </div>
      );
    }

    switch (widget.type) {
      case 'cpu':
      case 'network':
      case 'custom': // Custom widgets will also use the AreaChart
        const chartData = widget.data && widget.data.length > 0 ? widget.data : [];
        const chartColor = widget.type === 'network' ? "#f97316" : "#4A7BA7";
        return (
          <ResponsiveContainer width="100%" height="100%">
            {chartData.length > 0 ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`color-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#color-${widget.id})`}
                />
              </AreaChart>
            ) : (
              <div className="flex items-center justify-center h-full text-textSecondary text-xs">
                No data available
              </div>
            )}
          </ResponsiveContainer>
        );
      case 'memory':
        const memUsage = systemMetrics ? systemMetrics.memory.usage : 0;
        return (
          <div className="flex flex-col justify-end h-full gap-2 pb-2">
            <div className="flex justify-between text-xs text-textSecondary font-medium">
              <span>Used: {formatPercent(memUsage)}</span>
              <span>Free: {formatPercent(100 - memUsage)}</span>
            </div>
            <div className="w-full h-5 bg-background rounded-full overflow-hidden flex border border-border">
              <div className="bg-primary h-full rounded-l-full relative group transition-all duration-200 flex items-center justify-center" style={{ width: `${memUsage}%` }}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </div>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary"></div>
                <span className="text-[10px] text-textSecondary font-medium uppercase tracking-wide">Used</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-border"></div>
                <span className="text-[10px] text-textSecondary font-medium uppercase tracking-wide">Free</span>
              </div>
            </div>
          </div>
        );
      case 'storage':
        const diskUsage = systemMetrics ? systemMetrics.disk.usage : 0;
        const diskUsed = systemMetrics ? systemMetrics.disk.used : 0;
        const diskTotal = systemMetrics ? systemMetrics.disk.total : 0;
        const diskFree = systemMetrics ? systemMetrics.disk.free : 0;
        const systemPercent = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;
        const freePercent = diskTotal > 0 ? (diskFree / diskTotal) * 100 : 0;
        return (
          <div className="flex items-center h-full">
            <div className="h-28 w-28 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Used', value: systemPercent },
                      { name: 'Free', value: freePercent }
                    ]}
                    innerRadius={28}
                    outerRadius={40}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={4}
                    stroke="none"
                  >
                    <Cell fill="#6B9B6E" />
                    <Cell fill="#F8FAFC" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-xs font-bold text-textPrimary">{formatPercent(diskUsage)}</span>
                <span className="text-[8px] font-medium text-textSecondary uppercase">Used</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 pl-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-textSecondary font-medium">Used</span>
                  </div>
                  <span className="font-bold text-textPrimary">{formatPercent(systemPercent)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-border"></div>
                    <span className="text-textSecondary font-medium">Free</span>
                  </div>
                  <span className="font-bold text-textPrimary">{formatPercent(freePercent)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [isLoadingMetrics, allWidgets.length, systemMetrics, formatPercent, formatBytes]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.description.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Host Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingMetrics && allWidgets.length === 0 ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonWidget key={idx} />
          ))
        ) : (
          allWidgets.map(widget => (
            <StatCard
              key={widget.id}
              title={widget.title}
              value={widget.value}
              subtext={widget.subtext}
              className=""
              onRemove={widget.type === 'custom' ? () => removeWidget(widget.id) : undefined}
              trend={widget.trend}
              accentColor={widget.color}
            >
              {renderWidgetContent(widget)}
            </StatCard>
          ))
        )}

        <button
          onClick={addWidget}
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-textSecondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group w-full h-[14rem]"
        >
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shadow-sm">
            <Plus size={24} strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-textSecondary group-hover:text-primary">Add Monitoring Card</span>
        </button>
      </div>

      {/* Projects Section - Only visible in standard dashboard view */}
      {!isMonitor && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Active Projects</h2>
              <p className="text-sm text-textSecondary mt-1">Manage your deployed applications and services.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 mr-2 order-2 sm:order-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'grid' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={18} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'list' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                  title="List View"
                >
                  <ListIcon size={18} strokeWidth={1.5} />
                </button>
              </div>

              <div className="relative group order-1 sm:order-2 flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary group-focus-within:text-primary transition-colors duration-200" size={18} strokeWidth={1.5} />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 w-full sm:w-64 transition-all duration-200 shadow-sm text-textPrimary placeholder-textSecondary"
                />
              </div>
              <button
                onClick={handleCreateProject}
                className="order-3 flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                <Plus size={18} strokeWidth={1.5} /> <span className="whitespace-nowrap">Create Project</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-textSecondary" />
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => onProjectSelect(project)}
                />
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full py-12 text-center text-textSecondary bg-background rounded-xl border border-dashed border-border">
                  {projectSearch ? `No projects found matching "${projectSearch}".` : 'No projects found. Create your first project to get started.'}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProjects.map(project => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  onClick={() => onProjectSelect(project)}
                />
              ))}
              {filteredProjects.length === 0 && (
                <div className="py-12 text-center text-textSecondary bg-background rounded-xl border border-dashed border-border">
                  {projectSearch ? `No projects found matching "${projectSearch}".` : 'No projects found. Create your first project to get started.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
};
