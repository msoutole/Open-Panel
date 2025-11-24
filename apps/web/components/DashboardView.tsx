import React, { useState, useEffect } from 'react';
import { CreateProjectModal } from './CreateProjectModal';
import { Project, MetricPoint } from '../types';
import { CPU_DATA, NETWORK_DATA } from '../constants';
import { getProjects } from '../services/api';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Layers, Activity, Search, Plus, X, TrendingUp, TrendingDown, MoreHorizontal, LayoutGrid, List as ListIcon, ChevronRight, Clock, Users } from 'lucide-react';

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
  <div className={`bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-full ${className}`}>
    <div className={`absolute top-0 left-0 w-full h-1 ${accentColor}`}></div>
    {onRemove && (
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
      >
        <X size={16} />
      </button>
    )}

    <div className="flex justify-between items-start z-10 relative">
      <div className="flex-1">
        <h3 className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
          {title}
          {trend === 'up' && <div className="bg-green-100 p-0.5 rounded text-green-600"><TrendingUp size={12} /></div>}
          {trend === 'down' && <div className="bg-orange-100 p-0.5 rounded text-orange-600"><TrendingDown size={12} /></div>}
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">{value}</span>
          {subtext && <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{subtext}</span>}
        </div>
      </div>
      {!onRemove && (
        <button className="text-slate-300 hover:text-slate-500 transition-colors">
          <MoreHorizontal size={16} />
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
  const activeServices = project.services.filter(s => s.status === 'Running').length;
  const totalServices = project.services.length;
  const isHealthy = activeServices === totalServices && totalServices > 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden h-full flex flex-col" onClick={onClick}>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-slate-100 ${isHealthy ? 'bg-gradient-to-br from-blue-50 to-white text-blue-600 group-hover:from-blue-600 group-hover:to-blue-500 group-hover:text-white' : 'bg-gradient-to-br from-orange-50 to-white text-orange-600 group-hover:from-orange-600 group-hover:to-orange-500 group-hover:text-white'
            }`}>
            <Layers size={26} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{project.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wide ${isHealthy ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
          {project.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 my-5 relative z-10 flex-1">
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Services</p>
          <p className="text-sm font-bold text-slate-700">{activeServices} / {totalServices} <span className="text-xs font-normal text-slate-400">Running</span></p>
        </div>
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Team</p>
          <p className="text-sm font-bold text-slate-700">{project.members.length} <span className="text-xs font-normal text-slate-400">Members</span></p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4 relative z-10 mt-auto">
        <span className="text-xs text-slate-400 font-medium">Deployed {project.lastDeploy}</span>
        <button className="text-xs font-bold text-slate-400 group-hover:text-primary flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-slate-50 group-hover:bg-blue-50 px-3 py-1.5 rounded-lg">
          Manage <Activity size={12} />
        </button>
      </div>
    </div>
  );
};

const ProjectListItem: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const activeServices = project.services.filter(s => s.status === 'Running').length;
  const totalServices = project.services.length;
  const isHealthy = activeServices === totalServices && totalServices > 0;

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer mb-3"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-slate-100 shrink-0 ${isHealthy ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'
          }`}>
          <Layers size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base text-slate-800 group-hover:text-primary transition-colors truncate">{project.name}</h3>
          <p className="text-xs text-slate-500 truncate">{project.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 xl:gap-12 mr-4 md:mr-8 shrink-0">
        <div className="hidden md:block w-32">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Services</div>
          <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            {activeServices}/{totalServices} Active
          </div>
        </div>
        <div className="hidden lg:block w-32">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Team</div>
          <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" />
            {project.members.length} Members
          </div>
        </div>
        <div className="hidden xl:block w-32 text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 flex items-center justify-end gap-1"><Clock size={10} /> Last Deploy</div>
          <div className="text-xs font-semibold text-slate-600">{project.lastDeploy}</div>
        </div>
        <div className="w-24 flex justify-end">
          <div className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wide inline-block ${isHealthy ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
            {project.status}
          </div>
        </div>
      </div>

      <div className="pl-4 border-l border-slate-100">
        <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={20} />
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

  // Use state for projects to allow adding new ones
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects', error);
      }
    };
    fetchProjects();
  }, []);

  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: 'cpu', type: 'cpu', title: 'Host CPU Load', value: '1.24', subtext: 'avg', data: CPU_DATA, trend: 'up', color: 'bg-blue-500' },
    { id: 'mem', type: 'memory', title: 'Host RAM', value: '12.4 GB', subtext: '/ 32 GB', color: 'bg-purple-500' },
    { id: 'disk', type: 'storage', title: 'Storage (NVMe)', value: '65%', subtext: 'Used', color: 'bg-emerald-500' },
    { id: 'net', type: 'network', title: 'Ingress Traffic', value: '840 MB', subtext: '/ sec', data: NETWORK_DATA, trend: 'down', color: 'bg-orange-500' },
  ]);

  const removeWidget = (id: string) => {
    if (window.confirm('Remove this widget?')) {
      setWidgets(widgets.filter(w => w.id !== id));
    }
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
  };

  const addWidget = () => {
    const newWidget: DashboardWidget = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      title: 'New Metric',
      value: '0',
      subtext: 'monitoring',
      data: CPU_DATA, // Reuse CPU data for demo visual
      trend: 'up',
      color: 'bg-indigo-500' // Default color for custom widgets
    };
    setWidgets([...widgets, newWidget]);
  };

  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'cpu':
      case 'network':
      case 'custom': // Custom widgets will also use the AreaChart
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={widget.data || CPU_DATA}>
              <defs>
                <linearGradient id={`color-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={widget.type === 'network' ? "#f97316" : widget.type === 'custom' ? "#6366f1" : "#3b82f6"} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={widget.type === 'network' ? "#f97316" : widget.type === 'custom' ? "#6366f1" : "#3b82f6"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={widget.type === 'network' ? "#f97316" : widget.type === 'custom' ? "#6366f1" : "#3b82f6"}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${widget.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'memory':
        return (
          <div className="flex flex-col justify-end h-full gap-2 pb-2">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Used: 38%</span>
              <span>Cache: 12%</span>
            </div>
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
              <div className="bg-purple-500 w-[38%] h-full rounded-l-full relative group transition-all duration-500 flex items-center justify-center">
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="bg-purple-300 w-[12%] h-full opacity-80 transition-all duration-500 border-l border-white/20"></div>
            </div>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-500"></div>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-300"></div>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Cache</span>
              </div>
            </div>
          </div>
        );
      case 'storage':
        return (
          <div className="flex items-center h-full">
            <div className="h-28 w-28 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ name: 'System', value: 20 }, { name: 'Projects', value: 45 }, { name: 'Free', value: 35 }]}
                    innerRadius={28}
                    outerRadius={40}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={4}
                    stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-xs font-bold text-slate-700">65%</span>
                <span className="text-[8px] font-medium text-slate-400 uppercase">Used</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 pl-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                    <span className="text-slate-500 font-medium">System</span>
                  </div>
                  <span className="font-bold text-slate-700">20%</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500 shadow-sm shadow-sky-200"></div>
                    <span className="text-slate-500 font-medium">Data</span>
                  </div>
                  <span className="font-bold text-slate-700">45%</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.description.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">
      {/* Host Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map(widget => (
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
        ))}

        <button
          onClick={addWidget}
          className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-blue-50/50 transition-all group w-full h-[14rem]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 group-hover:text-primary transition-colors shadow-sm">
            <Plus size={24} />
          </div>
          <span className="text-sm font-bold text-slate-500 group-hover:text-primary">Add Monitoring Card</span>
        </button>
      </div>

      {/* Projects Section - Only visible in standard dashboard view */}
      {!isMonitor && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Active Projects</h2>
              <p className="text-sm text-slate-500 mt-1">Manage your deployed applications and services.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 mr-2 order-2 sm:order-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <ListIcon size={18} />
                </button>
              </div>

              <div className="relative group order-1 sm:order-2 flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 w-full sm:w-64 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={handleCreateProject}
                className="order-3 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={18} /> <span className="whitespace-nowrap">Create Project</span>
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => onProjectSelect(project)}
                />
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No projects found matching "{projectSearch}".
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
                <div className="py-12 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No projects found matching "{projectSearch}".
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
