import React from 'react';
import { CircleStop } from 'lucide-react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  className?: string;
  showIconForStopped?: boolean; // Adicionar ícone para status "STOPPED"
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
  showIconForStopped = false,
}) => {
  const childrenStr = typeof children === 'string' ? children : '';
  const isStopped = showIconForStopped && childrenStr.toUpperCase() === 'STOPPED';
  const variantStyles = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    neutral: 'bg-background text-textSecondary border-border',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[10px]',
    lg: 'px-3 py-1.5 text-xs',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {isStopped && !Icon && <CircleStop size={iconSizes[size]} strokeWidth={1.5} />}
      {Icon && <Icon size={iconSizes[size]} strokeWidth={1.5} />}
      <span>{children}</span>
    </div>
  );
};

