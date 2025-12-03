import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-border rounded';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[wave_1.6s_ease-in-out_infinite]',
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

// Componente de loading genérico para Suspense
export const SkeletonLoader: React.FC = () => (
  <div className="flex-1 overflow-y-auto bg-background p-6">
    <div className="space-y-4">
      <Skeleton variant="rectangular" height={48} width="100%" className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  </div>
);

