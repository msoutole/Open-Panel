import React, { useState } from 'react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer } from 'recharts';
import { HardDrive, Cpu, Network, MemoryStick, RefreshCw, Clock, TrendingUp } from 'lucide-react';
import { SystemMetrics } from '../services/api';
import { ProgressRing } from './ui/ProgressRing';
import { SkeletonMetricCard } from './SkeletonLoader';

interface BentoMetricsGridProps {
  metrics: SystemMetrics | null;
  isLoading: boolean;
  formatBytes: (bytes: number) => string;
  formatPercent: (value: number) => string;
  onRefresh?: () => void;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  children?: React.ReactNode;
  className?: string;
  accentColor?: 'primary' | 'warning' | 'success' | 'error';
  span?: '1' | '2';
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  delta?: number; // Para DeltaBadge (↑↓)
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  children?: React.ReactNode;
  className?: string;
  accentColor?: 'primary' | 'warning' | 'success' | 'error';
  span?: '1' | '2';
  thresholdBg?: string; // Cor de fundo baseada no threshold
  thresholdBorderLeft?: boolean; // Borda esquerda como alternativa
  stats?: { min: number; max: number; avg: number }; // Min/Max/Avg stats
  formatStat?: (value: number) => string; // Formatação para stats
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend,
  delta,
  icon: Icon, 
  children, 
  className = '',
  accentColor = 'primary',
  span = '1',
  thresholdBg = '',
  thresholdBorderLeft = false,
  stats,
  formatStat
}) => {
  const accentColors = {
    primary: 'from-primary/20 via-primary/10 to-transparent border-primary/20',
    warning: 'from-warning/20 via-warning/10 to-transparent border-warning/20',
    success: 'from-success/20 via-success/10 to-transparent border-success/20',
    error: 'from-error/20 via-error/10 to-transparent border-error/20',
  };

  const borderLeftColors = {
    primary: 'border-l-primary',
    warning: 'border-l-warning',
    success: 'border-l-success',
    error: 'border-l-error',
  };

  return (
    <div className={`bg-gradient-to-br from-card via-card to-background border border-border/60 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 group relative overflow-hidden hover:-translate-y-0.5 ${span === '2' ? 'col-span-1 md:col-span-2' : ''} ${thresholdBg} ${thresholdBorderLeft ? `border-l-4 ${borderLeftColors[accentColor]}` : ''} ${className}`}>
      {/* Accent gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColors[accentColor]}`}></div>
      
      {/* Subtle glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColors[accentColor]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${accentColor === 'primary' ? 'bg-primary/10 text-primary' : accentColor === 'warning' ? 'bg-warning/10 text-warning' : accentColor === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider">{title}</h3>
              {subtitle && <p className="text-[10px] text-textSecondary/70 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {(trend !== undefined || delta !== undefined) && (
            <div className="flex items-center gap-1.5">
              {delta !== undefined && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  delta > 0 ? 'bg-success/20 text-success' : delta < 0 ? 'bg-error/20 text-error' : 'bg-background text-textSecondary'
                }`}>
                  {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'}
                  {Math.abs(delta).toFixed(1)}%
                </div>
              )}
              {trend !== undefined && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                  trend > 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  <TrendingUp size={10} strokeWidth={1.5} />
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <div className="text-2xl sm:text-3xl font-bold text-textPrimary tracking-tight leading-tight">{value}</div>
        </div>
        
        {children && (
          <div className="mt-3 h-[60px]">
            {children}
          </div>
        )}
        
        {/* Min/Max/Avg Stats abaixo dos sparklines */}
        {stats && formatStat && (
          <div className="mt-2 flex items-center justify-between text-[9px] text-textSecondary/70">
            <span>Min: {formatStat(stats.min)}</span>
            <span>Avg: {formatStat(stats.avg)}</span>
            <span>Max: {formatStat(stats.max)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BentoMetricsGrid: React.FC<BentoMetricsGridProps> = ({
  metrics,
  isLoading,
  formatBytes,
  formatPercent,
  onRefresh
}) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>
    );
  }

  // CPU data - usando loadAverage para micro-gráfico (sparkline)
  const cpuLoadAverage = metrics.cpu?.loadAverage || [];
  const cpuData = cpuLoadAverage.slice(-30).map((value: number, idx: number) => ({
    time: idx,
    value: value * 100 // Converter para percentual
  }));

  const memoryUsed = metrics.memory?.used || 0;
  const memoryTotal = metrics.memory?.total || 1;
  const memoryPercent = memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0;
  
  const storageUsed = metrics.disk?.used || 0;
  const storageTotal = metrics.disk?.total || 1;
  const storagePercent = storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

  // Network data para sparkline
  const networkData = cpuLoadAverage.slice(-30).map((_, idx: number) => ({
    time: idx,
    value: metrics.network?.rxRate ? metrics.network.rxRate / 1024 / 1024 : 0 // Converter para MB/s
  }));

  // Determinar cor semântica baseada no percentual
  // CPU: < 70% success, >= 70% warning
  const getCpuColor = (percent: number): 'primary' | 'success' | 'warning' | 'error' => {
    if (percent >= 90) return 'error';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  // RAM: < 70% success, 70-85% warning (amber), >= 85% error
  const getMemoryColor = (percent: number): 'primary' | 'success' | 'warning' | 'error' => {
    if (percent >= 85) return 'error';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  // Storage: < 75% success, >= 75% warning
  const getStorageColor = (percent: number): 'primary' | 'success' | 'warning' | 'error' => {
    if (percent >= 90) return 'error';
    if (percent >= 75) return 'warning';
    return 'success';
  };

  // Determinar cor de threshold para background
  const getThresholdBgColor = (percent: number, type: 'cpu' | 'memory' | 'storage'): string => {
    if (type === 'cpu') {
      return percent < 70 ? 'bg-success/10' : 'bg-warning/10';
    }
    if (type === 'memory') {
      if (percent >= 85) return 'bg-error/10';
      if (percent >= 70) return 'bg-warning/10';
      return 'bg-success/10';
    }
    if (type === 'storage') {
      return percent < 75 ? 'bg-success/10' : 'bg-warning/10';
    }
    return '';
  };

  // Calcular estatísticas Min/Max/Avg para os dados
  const getStats = (data: Array<{ value: number }>) => {
    if (!data || data.length === 0) return { min: 0, max: 0, avg: 0 };
    const values = data.map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    };
  };

  const cpuStats = getStats(cpuData);
  const networkStats = getStats(networkData);

  // Calcular delta (variação percentual) - exemplo simples
  const firstCpuValue = cpuData[0]?.value;
  const lastCpuValue = cpuData[cpuData.length - 1]?.value;
  const cpuDelta = cpuData.length > 1 && firstCpuValue !== undefined && lastCpuValue !== undefined && firstCpuValue !== 0
    ? ((lastCpuValue - firstCpuValue) / firstCpuValue) * 100 
    : 0;
  
  const firstNetworkValue = networkData[0]?.value;
  const lastNetworkValue = networkData[networkData.length - 1]?.value;
  const networkDelta = networkData.length > 1 && firstNetworkValue !== undefined && lastNetworkValue !== undefined && firstNetworkValue !== 0
    ? ((lastNetworkValue - firstNetworkValue) / firstNetworkValue) * 100 
    : 0;

  const handleRefresh = () => {
    setLastRefresh(new Date());
    onRefresh?.();
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {/* Controles: TimeRangeSelector e AutoRefreshToggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-textSecondary font-medium">Período:</span>
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                autoRefresh
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-background text-textSecondary border border-border hover:bg-white'
              }`}
            >
              <RefreshCw size={14} strokeWidth={1.5} className={autoRefresh ? 'animate-spin' : ''} />
              Auto-refresh
            </button>
            <span className="text-[10px] text-textSecondary flex items-center gap-1">
              <Clock size={10} strokeWidth={1.5} />
              {formatTimeAgo(lastRefresh)}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-textSecondary hover:text-primary hover:bg-primary/10 transition-all duration-200"
            title="Atualizar métricas"
          >
            <RefreshCw size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CPU Load - Micro-gráfico (Sparkline) */}
      <MetricCard
        title="CARGA CPU"
        value={metrics.cpu?.usage ? `${metrics.cpu.usage.toFixed(2)}%` : '0%'}
        subtitle="média"
        icon={Cpu}
        accentColor={getCpuColor(metrics.cpu?.usage || 0)}
        span="1"
        thresholdBg={getThresholdBgColor(metrics.cpu?.usage || 0, 'cpu')}
        delta={cpuDelta}
        stats={cpuStats}
        formatStat={(v) => `${v.toFixed(1)}%`}
      >
        {cpuData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cpuData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#f97316" 
                fill="url(#cpuGradient)"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-textSecondary text-xs">
            Sem dados
          </div>
        )}
      </MetricCard>

      {/* Memory - Progress Ring */}
      <MetricCard
        title="RAM DO HOST"
        value={formatBytes(memoryUsed)}
        subtitle={`/ ${formatBytes(memoryTotal)}`}
        icon={MemoryStick}
        accentColor={getMemoryColor(memoryPercent)}
        span="1"
        thresholdBg={getThresholdBgColor(memoryPercent, 'memory')}
        thresholdBorderLeft={memoryPercent >= 70}
      >
        <div className="flex items-center justify-center h-full">
          <ProgressRing
            value={memoryPercent}
            size={70}
            strokeWidth={1.5}
            color={getMemoryColor(memoryPercent)}
            showLabel={true}
            label={formatPercent(memoryPercent)}
          />
        </div>
      </MetricCard>

      {/* Storage - Progress Ring */}
      <MetricCard
        title="ARMAZENAMENTO"
        value={formatPercent(storagePercent)}
        subtitle="Usado"
        icon={HardDrive}
        accentColor={getStorageColor(storagePercent)}
        span="1"
        thresholdBg={getThresholdBgColor(storagePercent, 'storage')}
        thresholdBorderLeft={storagePercent >= 75}
      >
        <div className="flex items-center justify-center h-full">
          <ProgressRing
            value={storagePercent}
            size={70}
            strokeWidth={1.5}
            color={getStorageColor(storagePercent)}
            showLabel={true}
            label={formatPercent(storagePercent)}
          />
        </div>
      </MetricCard>

      {/* Network Traffic - Micro-gráfico (Sparkline) */}
      <MetricCard
        title="TRÁFEGO DE ENTRADA"
        value={metrics.network?.rxRate ? formatBytes(metrics.network.rxRate) : '0 B'}
        subtitle="/ sec"
        icon={Network}
        accentColor="primary"
        span="1"
        delta={networkDelta}
        stats={networkStats}
        formatStat={(v) => formatBytes(v * 1024 * 1024)}
      >
        {metrics.network?.rxRate && networkData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={networkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4A7BA7" 
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-textSecondary text-xs">
            Sem dados
          </div>
        )}
      </MetricCard>
      </div>
    </div>
  );
};

