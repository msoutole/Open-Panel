import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
}) => {
  const baseClasses = 'bg-border rounded';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[wave_1.6s_ease-in-out_infinite]',
    shimmer: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
    <Skeleton variant="rectangular" height={24} width="60%" className="mb-4" />
    <Skeleton variant="text" height={16} width="100%" className="mb-2" />
    <Skeleton variant="text" height={16} width="80%" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <div className="p-4 border-b border-border">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={16} width="20%" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" height={16} width="20%" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonWidget: React.FC = () => (
  <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
    <Skeleton variant="text" height={14} width="40%" className="mb-4" />
    <Skeleton variant="text" height={32} width="60%" className="mb-4" />
    <Skeleton variant="rectangular" height={128} width="100%" />
  </div>
);

// Componente especializado para cards de métricas
export const SkeletonMetricCard: React.FC = () => (
  <div className="bg-gradient-to-br from-card via-card to-background border border-border/60 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
    {/* Accent gradient bar */}
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent"></div>
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={36} height={36} className="rounded-lg" animation="shimmer" />
          <div>
            <Skeleton variant="text" height={12} width={80} className="mb-1" animation="shimmer" />
            <Skeleton variant="text" height={10} width={60} animation="shimmer" />
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <Skeleton variant="text" height={32} width={120} className="mb-2" animation="shimmer" />
      </div>
      
      <div className="mt-4 h-24">
        <Skeleton variant="rectangular" height={96} width="100%" className="rounded" animation="shimmer" />
      </div>
    </div>
  </div>
);

// Componente especializado para cards de projeto
export const SkeletonProjectCard: React.FC = () => (
  <div className="bg-card p-6 rounded-xl border border-border shadow-sm h-full flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Skeleton variant="circular" width={56} height={56} animation="shimmer" />
        <div className="flex-1 min-w-0">
          <Skeleton variant="text" height={20} width="70%" className="mb-2" animation="shimmer" />
          <Skeleton variant="text" height={16} width="90%" animation="shimmer" />
        </div>
      </div>
      <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" animation="shimmer" />
    </div>

    <div className="grid grid-cols-2 gap-3 my-5 flex-1">
      <div className="bg-background p-3 rounded-lg border border-border">
        <Skeleton variant="text" height={12} width="50%" className="mb-1" animation="shimmer" />
        <Skeleton variant="text" height={18} width="80%" animation="shimmer" />
      </div>
      <div className="bg-background p-3 rounded-lg border border-border">
        <Skeleton variant="text" height={12} width="50%" className="mb-1" animation="shimmer" />
        <Skeleton variant="text" height={18} width="80%" animation="shimmer" />
      </div>
    </div>

    <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
      <Skeleton variant="text" height={14} width={100} animation="shimmer" />
      <Skeleton variant="rectangular" width={80} height={32} className="rounded-lg" animation="shimmer" />
    </div>
  </div>
);

// Componente de loading genérico para Suspense
export const SkeletonLoader: React.FC = () => (
  <div className="flex-1 overflow-y-auto bg-background p-6">
    <div className="space-y-4">
      <Skeleton variant="rectangular" height={48} width="100%" className="mb-6" animation="shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  </div>
);

