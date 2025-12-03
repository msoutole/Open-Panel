import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  status?: 'loading' | 'success' | 'error';
  estimatedTime?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  status = 'loading',
  estimatedTime,
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const statusColors = {
    loading: 'bg-primary',
    success: 'bg-success',
    error: 'bg-error',
  };

  const statusIcons = {
    loading: <Loader2 size={16} className="animate-spin" />,
    success: <CheckCircle size={16} />,
    error: null,
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage || estimatedTime) && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {status === 'loading' && statusIcons.loading}
            {status === 'success' && statusIcons.success}
            {label && (
              <span className={`font-medium ${
                status === 'error' ? 'text-error' : 
                status === 'success' ? 'text-success' : 
                'text-textPrimary'
              }`}>
                {label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {estimatedTime && status === 'loading' && (
              <span className="text-xs text-textSecondary">{estimatedTime}</span>
            )}
            {showPercentage && (
              <span className={`text-xs font-medium ${
                status === 'error' ? 'text-error' : 
                status === 'success' ? 'text-success' : 
                'text-textPrimary'
              }`}>
                {Math.round(clampedProgress)}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
        <div
          className={`h-full transition-all duration-300 ease-out ${statusColors[status]}`}
          style={{ width: `${clampedProgress}%` }}
        >
          {status === 'loading' && (
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
          )}
        </div>
      </div>
    </div>
  );
};

