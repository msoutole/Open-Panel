import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CreateProjectModal } from './CreateProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Project, MetricPoint } from '../types';
import { getProjects, getDashboardStats, getSystemMetrics, SystemMetrics, updateProject, deleteProject } from '../services/api';
import { useMetrics } from '../hooks/useMetrics';
import { useToast } from '../hooks/useToast';
import { debounce } from '../utils/debounce';
import { SkeletonWidget, SkeletonProjectCard } from './SkeletonLoader';
import { useTranslations } from '../src/i18n/i18n-react';
import { WebSocketIndicator } from './ui/WebSocketIndicator';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Layers, Activity, Search, Plus, X, TrendingUp, TrendingDown, MoreHorizontal, LayoutGrid, List as ListIcon, ChevronRight, Clock, Users, Loader2, Edit2, Trash2, BarChart3, Rocket, BookOpen, CheckCircle2, Circle, Sparkles, ArrowRight, XCircle } from 'lucide-react';
import { BentoMetricsGrid } from './BentoMetricsGrid';
import { Badge } from './ui/Badge';

interface DashboardViewProps {
  onProjectSelect: (project: Project) => void;
  view?: 'dashboard' | 'monitor';
  searchQuery?: string;
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

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, children, className = "", onRemove, trend, accentColor = "bg-primary" }) => {
  const accentGradient = accentColor === 'bg-primary' 
    ? 'from-primary/20 via-primary/10 to-transparent' 
    : accentColor === 'bg-warning'
    ? 'from-warning/20 via-warning/10 to-transparent'
    : accentColor === 'bg-secondary'
    ? 'from-secondary/20 via-secondary/10 to-transparent'
    : 'from-primary/20 via-primary/10 to-transparent';

  const hoverBorderClass = accentColor === 'bg-primary' 
    ? 'hover:border-primary/40' 
    : accentColor === 'bg-warning'
    ? 'hover:border-warning/40'
    : accentColor === 'bg-secondary'
    ? 'hover:border-secondary/40'
    : 'hover:border-primary/40';

  return (
    <div className={`bg-gradient-to-br from-white via-card to-card/95 p-2.5 sm:p-3 rounded-xl border border-border/60 shadow-sm hover:shadow-xl ${hoverBorderClass} flex flex-col justify-between transition-all duration-300 group relative overflow-hidden h-full min-h-[140px] backdrop-blur-sm ${className}`}>
      {/* Gradient accent bar with shine */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient} shadow-sm`}></div>
      
      {/* Subtle glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-0 group-hover:opacity-100 transition-opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>
      
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1.5 right-1.5 p-1 text-textSecondary hover:text-error hover:bg-error/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
        >
          <X size={12} strokeWidth={1.5} />
        </button>
      )}

      <div className="flex justify-between items-start z-10 relative mb-1.5">
        <div className="flex-1 min-w-0 pr-1">
          <h3 className="text-textSecondary/80 font-semibold text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1">
            <span className="truncate">{title}</span>
            {trend === 'up' && <div className="bg-success/20 p-0.5 rounded text-success flex-shrink-0 shadow-sm"><TrendingUp size={8} strokeWidth={1.5} /></div>}
            {trend === 'down' && <div className="bg-warning/20 p-0.5 rounded text-warning flex-shrink-0 shadow-sm"><TrendingDown size={8} strokeWidth={1.5} /></div>}
          </h3>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-bold text-textPrimary tracking-tight leading-tight drop-shadow-sm">{value}</span>
            {subtext && <span className="text-[9px] font-medium text-textSecondary/70 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full whitespace-nowrap border border-border/50">{subtext}</span>}
          </div>
        </div>
        {!onRemove && (
          <button className="text-textSecondary/60 hover:text-textPrimary transition-colors duration-200 flex-shrink-0">
            <MoreHorizontal size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>
      {/* Explicit height here prevents Recharts width(-1) error */}
      <div className="w-full mt-auto h-20 relative z-0">
        {children}
      </div>
    </div>
  );
};

const StatCardListItem: React.FC<StatCardProps> = ({ title, value, subtext, children, className = "", onRemove, trend, accentColor = "bg-primary" }) => {
  const accentGradient = accentColor === 'bg-primary' 
    ? 'from-primary/30 via-primary/20 to-transparent' 
    : accentColor === 'bg-warning'
    ? 'from-warning/30 via-warning/20 to-transparent'
    : accentColor === 'bg-secondary'
    ? 'from-secondary/30 via-secondary/20 to-transparent'
    : 'from-primary/30 via-primary/20 to-transparent';

  return (
    <div className={`bg-gradient-to-r from-card to-card/95 p-2.5 sm:p-3 rounded-xl border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/30 flex items-center gap-2.5 transition-all duration-300 group relative backdrop-blur-sm ${className}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accentGradient} rounded-l-xl`}></div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1.5 right-1.5 p-1 text-textSecondary hover:text-error hover:bg-error/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
        >
          <X size={12} strokeWidth={1.5} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <h3 className="text-textSecondary/80 font-semibold text-[9px] uppercase tracking-widest truncate">{title}</h3>
          {trend === 'up' && <div className="bg-success/20 p-0.5 rounded text-success flex-shrink-0 shadow-sm"><TrendingUp size={8} strokeWidth={1.5} /></div>}
          {trend === 'down' && <div className="bg-warning/20 p-0.5 rounded text-warning flex-shrink-0 shadow-sm"><TrendingDown size={8} strokeWidth={1.5} /></div>}
        </div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-lg font-bold text-textPrimary tracking-tight drop-shadow-sm">{value}</span>
          {subtext && <span className="text-[9px] font-medium text-textSecondary/70 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full whitespace-nowrap border border-border/50">{subtext}</span>}
        </div>
      </div>

      <div className="w-32 h-16 shrink-0 relative">
        {children}
      </div>

      {!onRemove && (
        <button className="text-textSecondary/60 hover:text-textPrimary transition-colors duration-200 flex-shrink-0">
          <MoreHorizontal size={12} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

// Helper function para mapear status para variante do Badge
const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'running') return 'success';
  if (statusLower === 'stopped') return 'error';
  if (statusLower === 'building' || statusLower === 'deploying') return 'warning';
  if (statusLower === 'paused') return 'info';
  return 'neutral';
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onEdit, onDelete }) => {
  const services = project.services || [];
  const activeServices = services.filter(s => s.status === 'Running').length;
  const totalServices = services.length;
  const isHealthy = activeServices === totalServices && totalServices > 0;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(project);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project);
  };

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:border-primary hover:shadow-lg transition-all duration-200 group cursor-pointer relative overflow-hidden h-full flex flex-col hover:-translate-y-0.5" onClick={onClick}>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-border ${isHealthy ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white'
            }`}>
            <Layers size={26} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-textPrimary group-hover:text-primary transition-colors duration-200 truncate">{project.name}</h3>
            <p className="text-sm text-textSecondary line-clamp-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="p-1.5 rounded-lg text-textSecondary hover:text-primary hover:bg-background transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Editar projeto"
            >
              <Edit2 size={16} strokeWidth={1.5} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg text-textSecondary hover:text-error hover:bg-error/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Excluir projeto"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          )}
          <Badge variant={getStatusVariant(project.status)} size="md" showIconForStopped={true}>
            {project.status}
          </Badge>
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

const ProjectListItem: React.FC<ProjectCardProps> = ({ project, onClick, onEdit, onDelete }) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(project);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project);
  };
  const services = project.services || [];
  const activeServices = services.filter(s => s.status === 'Running').length;
  const totalServices = services.length;
  const isHealthy = activeServices === totalServices && totalServices > 0;

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer mb-3 hover:-translate-y-0.5"
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
          <Badge variant={getStatusVariant(project.status)} size="md" showIconForStopped={true}>
            {project.status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-4 border-l border-border">
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onEdit && (
              <button
                onClick={handleEditClick}
                className="p-1.5 rounded-lg text-textSecondary hover:text-primary hover:bg-background transition-all duration-200"
                title="Editar projeto"
              >
                <Edit2 size={16} strokeWidth={1.5} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg text-textSecondary hover:text-error hover:bg-error/10 transition-all duration-200"
                title="Excluir projeto"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
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

export const DashboardView: React.FC<DashboardViewProps> = ({ onProjectSelect, view = 'dashboard', searchQuery = '' }) => {
  const LL = useTranslations();
  const isMonitor = view === 'monitor';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [metricsViewMode, setMetricsViewMode] = useState<'grid' | 'list'>('grid');
  const [projectSearch, setProjectSearch] = useState(searchQuery);
  
  // Sync external search query
  useEffect(() => {
    if (searchQuery) {
      setProjectSearch(searchQuery);
    }
  }, [searchQuery]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    const dismissed = localStorage.getItem('openpanel_welcome_dismissed');
    return !dismissed;
  });
  const [showMetrics, setShowMetrics] = useState(() => {
    return localStorage.getItem('openpanel_show_metrics') !== 'false';
  });

  // Use state for projects to allow adding new ones
  const [projects, setProjects] = useState<Project[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);

  // Use WebSocket for real-time metrics
  const { metrics: realtimeMetrics, history: metricsHistoryData, isConnected: metricsConnected, error: metricsError } = useMetrics({
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
        // Update welcome banner state based on projects
        if (data.length === 0 && !localStorage.getItem('openpanel_welcome_dismissed')) {
          setShowWelcomeBanner(true);
        }
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
    void fetchProjects();
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
      } catch (error: unknown) {
        console.error('Failed to load metrics', error);
        // Don't show toast for metrics errors as they're frequent
      } finally {
        setIsLoadingMetrics(false);
      }
    };
    void fetchMetrics();
    
    // Refresh metrics every 5 seconds (less frequent since we have WebSocket)
    const interval = setInterval(() => void fetchMetrics(), 5000);
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
        title: LL.dashboard.hostCpuLoad(), 
        value: cpuValue, 
        subtext: LL.dashboard.avg(), 
        data: metricsHistory.slice(-7), 
        trend: systemMetrics.cpu.usage > 50 ? 'up' as const : 'down' as const, 
        color: 'bg-primary' 
      },
      { 
        id: 'mem', 
        type: 'memory' as const, 
        title: LL.dashboard.hostRam(), 
        value: memUsed, 
        subtext: `/ ${memTotal}`, 
        color: 'bg-primary' 
      },
      { 
        id: 'disk', 
        type: 'storage' as const, 
        title: LL.dashboard.storage(), 
        value: diskUsage, 
        subtext: LL.dashboard.used(), 
        color: 'bg-secondary' 
      },
      { 
        id: 'net', 
        type: 'network' as const, 
        title: LL.dashboard.ingressTraffic(), 
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
      title: LL.projects.createSuccess(),
      message: LL.projects.createSuccessMessage({ name: newProject.name }),
    });
  }, [showToast, LL]);

  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  }, []);

  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    showToast({
      type: 'success',
      title: LL.projects.editProjectSuccess(),
      message: LL.projects.editProjectSuccessMessage({ name: updatedProject.name }),
    });
    setIsEditModalOpen(false);
    setSelectedProject(null);
  }, [showToast, LL]);

  const handleDeleteProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedProject) return;

    setIsDeleting(true);
    try {
      await deleteProject(selectedProject.id);
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
      showToast({
        type: 'success',
        title: LL.projects.deleteSuccess(),
        message: LL.projects.deleteSuccessMessage({ name: selectedProject.name }),
      });
      setIsDeleteModalOpen(false);
      setSelectedProject(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast({
        type: 'error',
        title: LL.common.error(),
        message: message || LL.projects.deleteError(),
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedProject, showToast, LL]);

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

  const renderWidgetContent = useCallback((widget: DashboardWidget, isList = false) => {
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
                  strokeWidth={isList ? 1.5 : 2}
                  fillOpacity={1}
                  fill={`url(#color-${widget.id})`}
                />
              </AreaChart>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-textSecondary px-2 py-1">
                <div className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center mb-1.5">
                  <BarChart3 size={12} strokeWidth={1.5} className="text-textSecondary/50" />
                </div>
                <span className="text-[9px] font-medium text-center leading-tight px-1">{LL.dashboard.noDataAvailable()}</span>
              </div>
            )}
          </ResponsiveContainer>
        );
      case 'memory':
        const memUsage = systemMetrics ? systemMetrics.memory.usage : 0;
        return (
          <div className="flex flex-col justify-end h-full gap-1 pb-1">
            <div className={`flex justify-between ${isList ? 'text-[9px]' : 'text-[10px]'} text-textSecondary font-medium`}>
              <span className="truncate">{LL.dashboard.used()}: {formatPercent(memUsage)}</span>
              <span className="truncate ml-1.5">{LL.dashboard.free()}: {formatPercent(100 - memUsage)}</span>
            </div>
            <div className={`w-full ${isList ? 'h-2.5' : 'h-3'} bg-background rounded-full overflow-hidden flex border border-border`}>
              <div className="bg-primary h-full rounded-l-full relative group transition-all duration-200 flex items-center justify-center" style={{ width: `${memUsage}%` }}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </div>
            <div className={`flex ${isList ? 'gap-1.5' : 'gap-2'} mt-0.5 flex-wrap`}>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className={`${isList ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-sm bg-primary flex-shrink-0`}></div>
                <span className={`${isList ? 'text-[8px]' : 'text-[9px]'} text-textSecondary font-medium uppercase tracking-wide whitespace-nowrap`}>{LL.dashboard.used()}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className={`${isList ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-sm bg-border flex-shrink-0`}></div>
                <span className={`${isList ? 'text-[8px]' : 'text-[9px]'} text-textSecondary font-medium uppercase tracking-wide whitespace-nowrap`}>{LL.dashboard.free()}</span>
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
        const innerRadius = isList ? 12 : 18;
        const outerRadius = isList ? 18 : 26;
        return (
          <div className={`flex items-center h-full ${isList ? 'flex-row gap-1.5' : ''}`}>
            <div className={`${isList ? 'h-14 w-14' : 'h-20 w-20'} shrink-0 relative`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: LL.dashboard.used(), value: systemPercent },
                      { name: LL.dashboard.free(), value: freePercent }
                    ]}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={3}
                    dataKey="value"
                    cornerRadius={3}
                    stroke="none"
                  >
                    <Cell fill="#6B9B6E" />
                    <Cell fill="#F8FAFC" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className={`${isList ? 'text-[8px]' : 'text-[9px]'} font-bold text-textPrimary leading-none`}>{formatPercent(diskUsage)}</span>
                <span className={`${isList ? 'text-[6px]' : 'text-[7px]'} font-medium text-textSecondary uppercase leading-none mt-0.5`}>{LL.dashboard.used()}</span>
              </div>
            </div>
            <div className={`flex-1 space-y-1.5 min-w-0 ${isList ? 'pl-1.5' : 'pl-2'}`}>
              <div className="flex justify-between items-center gap-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <div className={`${isList ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5'} rounded-full bg-secondary flex-shrink-0`}></div>
                  <span className={`${isList ? 'text-[9px]' : 'text-[10px]'} text-textSecondary font-medium truncate`}>{LL.dashboard.used()}</span>
                </div>
                <span className={`${isList ? 'text-[9px]' : 'text-[10px]'} font-bold text-textPrimary whitespace-nowrap`}>{formatPercent(systemPercent)}</span>
              </div>
              <div className="flex justify-between items-center gap-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <div className={`${isList ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5'} rounded-full bg-border flex-shrink-0`}></div>
                  <span className={`${isList ? 'text-[9px]' : 'text-[10px]'} text-textSecondary font-medium truncate`}>{LL.dashboard.free()}</span>
                </div>
                <span className={`${isList ? 'text-[9px]' : 'text-[10px]'} font-bold text-textPrimary whitespace-nowrap`}>{formatPercent(freePercent)}</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [isLoadingMetrics, allWidgets.length, systemMetrics, formatPercent, formatBytes, LL]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.description.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const hasProjects = filteredProjects.length > 0;
  const isNewUser = projects.length === 0 && !isLoading;

  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('openpanel_welcome_dismissed', 'true');
  };

  const handleToggleMetrics = () => {
    const newValue = !showMetrics;
    setShowMetrics(newValue);
    localStorage.setItem('openpanel_show_metrics', String(newValue));
  };

  // Getting Started Checklist
  const gettingStartedSteps = [
    { id: 'create-project', label: LL.dashboard.gettingStartedCreateProject(), completed: hasProjects },
    { id: 'deploy-service', label: LL.dashboard.gettingStartedDeployService(), completed: false },
    { id: 'configure-domain', label: LL.dashboard.gettingStartedConfigureDomain(), completed: false },
    { id: 'invite-team', label: LL.dashboard.gettingStartedInviteTeam(), completed: false },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-5 max-w-7xl mx-auto space-y-4 sm:space-y-5">
      {/* Welcome Banner - Only show for new users */}
      {showWelcomeBanner && isNewUser && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 sm:p-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-primary" size={20} strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-textPrimary">{LL.dashboard.welcomeBannerTitle()}</h3>
              </div>
              <p className="text-sm text-textSecondary mb-4">{LL.dashboard.welcomeBannerDescription()}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCreateProject}
                  className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                >
                  {LL.dashboard.welcomeBannerGetStarted()}
                  <ArrowRight size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleDismissWelcome}
                  className="flex items-center gap-2 bg-background hover:bg-white border border-border text-textSecondary hover:text-textPrimary px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  {LL.dashboard.welcomeBannerDismiss()}
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissWelcome}
              className="text-textSecondary hover:text-textPrimary transition-colors duration-200 p-1 hover:bg-background rounded-lg"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions - Cards de Atalho */}
      {!isMonitor && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="text-primary" size={18} strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-textPrimary">{LL.dashboard.quickActions()}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Create Project Card */}
            <button
              onClick={handleCreateProject}
              className="group bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-200">
                <Plus className="text-primary" size={24} strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-textPrimary group-hover:text-primary transition-colors duration-200">
                {LL.dashboard.quickActionCreateProject()}
              </span>
            </button>

            {/* Create Service Card */}
            <button
              onClick={() => showToast({ type: 'info', title: 'Em breve', message: 'A criação de serviços estará disponível em breve.' })}
              className="group bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-200">
                <Layers className="text-primary" size={24} strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-textPrimary group-hover:text-primary transition-colors duration-200">
                {LL.dashboard.quickActionCreateService()}
              </span>
            </button>

            {/* View Docs Card */}
            <button
              onClick={() => window.open('https://docs.openpanel.dev', '_blank')}
              className="group bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-200">
                <BookOpen className="text-primary" size={24} strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-textPrimary group-hover:text-primary transition-colors duration-200">
                {LL.dashboard.quickActionViewDocs()}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Getting Started Checklist - Only show for new users */}
      {isNewUser && !isLoading && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-primary" size={20} strokeWidth={1.5} />
            <div>
              <h3 className="text-base font-bold text-textPrimary">{LL.dashboard.gettingStarted()}</h3>
              <p className="text-xs text-textSecondary mt-0.5">{LL.dashboard.gettingStartedDescription()}</p>
            </div>
          </div>
          <div className="space-y-2">
            {gettingStartedSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors duration-200">
                {step.completed ? (
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="text-success" size={14} strokeWidth={1.5} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
                    <Circle className="text-textSecondary" size={10} strokeWidth={1.5} fill="currentColor" />
                  </div>
                )}
                <span className={`text-sm ${step.completed ? 'text-textSecondary line-through' : 'text-textPrimary'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section - Always show first (main focus) */}
      {!isMonitor && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-textPrimary tracking-tight">{LL.dashboard.activeProjects()}</h2>
              <p className="text-sm text-textSecondary mt-1">{LL.dashboard.manageApplications()}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 mr-2 order-2 sm:order-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${viewMode === 'grid' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                  title={LL.dashboard.gridView()}
                  aria-label={LL.dashboard.gridView()}
                >
                  <LayoutGrid size={18} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${viewMode === 'list' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                  title={LL.dashboard.listView()}
                  aria-label={LL.dashboard.listView()}
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
                  placeholder={LL.dashboard.searchProjects()}
                  className="pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 w-full sm:w-64 transition-all duration-200 shadow-sm text-textPrimary placeholder-textSecondary"
                />
              </div>
              <button
                onClick={handleCreateProject}
                className="order-3 flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 min-h-[44px]"
              >
                <Plus size={18} strokeWidth={1.5} /> <span className="whitespace-nowrap">{LL.dashboard.createProject()}</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonProjectCard key={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <SkeletonProjectCard key={i} />
                ))}
              </div>
            )
          ) : hasProjects ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
                {filteredProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectSelect(project)}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredProjects.map(project => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    onClick={() => onProjectSelect(project)}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )
          ) : (
            // Enhanced Empty State
            <div className="bg-gradient-to-br from-card via-card to-background border border-border rounded-xl p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Rocket className="text-primary" size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-textPrimary mb-2">{LL.dashboard.emptyStateTitle()}</h3>
                <p className="text-sm text-textSecondary mb-6">{LL.dashboard.emptyStateDescription()}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                  <button
                    onClick={handleCreateProject}
                    className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                  >
                    <Plus size={18} strokeWidth={1.5} />
                    {LL.dashboard.emptyStateAction()}
                  </button>
                  <button
                    onClick={() => window.open('https://docs.openpanel.dev', '_blank')}
                    className="flex items-center gap-2 bg-background hover:bg-white border border-border text-textSecondary hover:text-textPrimary px-6 py-3 rounded-xl font-medium transition-all duration-200"
                  >
                    <BookOpen size={18} strokeWidth={1.5} />
                    {LL.dashboard.emptyStateDocs()}
                  </button>
                </div>
                <p className="text-xs text-textSecondary">{LL.dashboard.emptyStateHelp()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host Metrics - Optional section, collapsible */}
      <div className="space-y-3">
        {/* Controles de visualização dos cards de monitoramento */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMetrics}
              className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary transition-colors duration-200"
            >
              {showMetrics ? (
                <>
                  <XCircle size={16} strokeWidth={1.5} />
                  {LL.dashboard.hideMetrics()}
                </>
              ) : (
                <>
                  <Activity size={16} strokeWidth={1.5} />
                  {LL.dashboard.showMetrics()}
                </>
              )}
            </button>
            {showMetrics && (
              <>
                <div className="w-px h-4 bg-border"></div>
                <h2 className="text-base font-bold text-textPrimary tracking-tight">{LL.dashboard.systemMetrics()}</h2>
                <span className="text-xs text-textSecondary">({LL.dashboard.systemMetricsDescription()})</span>
              </>
            )}
          </div>
          {showMetrics && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
              <button
                onClick={() => setMetricsViewMode('grid')}
                className={`p-2 rounded transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${metricsViewMode === 'grid' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                title={LL.dashboard.gridView()}
                aria-label={LL.dashboard.gridView()}
              >
                <LayoutGrid size={18} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setMetricsViewMode('list')}
                className={`p-2 rounded transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${metricsViewMode === 'list' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                title={LL.dashboard.listView()}
                aria-label={LL.dashboard.listView()}
              >
                <ListIcon size={18} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Bento Grid Metrics - Only show if metrics are enabled */}
        {showMetrics && (
          <BentoMetricsGrid
            metrics={systemMetrics}
            isLoading={isLoadingMetrics}
            formatBytes={formatBytes}
            formatPercent={formatPercent}
            onRefresh={() => {
              // Trigger metrics refresh
              if (systemMetrics) {
                // Force refresh by clearing cache or triggering API call
                getSystemMetrics(true).catch(console.error);
              }
            }}
          />
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleProjectCreated}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        onUpdated={handleProjectUpdated}
        project={selectedProject}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProject(null);
        }}
        onConfirm={handleConfirmDelete}
        title={LL.projects.deleteProjectTitle()}
        message={LL.projects.deleteProjectMessage()}
        itemName={selectedProject?.name}
        loading={isDeleting}
      />
    </div>
  );
};

