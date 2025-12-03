import React from 'react';
import { RotateCw, AlertCircle } from 'lucide-react';

export interface RetryButtonProps {
  onRetry: () => void;
  error?: string | null;
  isLoading?: boolean;
  maxRetries?: number;
  retryCount?: number;
  className?: string;
  variant?: 'button' | 'inline';
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  error,
  isLoading = false,
  maxRetries = 3,
  retryCount = 0,
  className = '',
  variant = 'button',
}) => {
  const canRetry = retryCount < maxRetries;

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {error && (
          <>
            <AlertCircle size={16} className="text-error flex-shrink-0" />
            <span className="text-sm text-error">{error}</span>
          </>
        )}
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primaryHover font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Tentando...' : 'Tentar novamente'}
          </button>
        )}
        {!canRetry && (
          <span className="text-sm text-textSecondary">
            Máximo de tentativas atingido
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl ${className}`}>
      {error && (
        <div className="flex items-center gap-2 text-error">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}
      
      {canRetry ? (
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Tentando novamente...' : `Tentar novamente (${retryCount + 1}/${maxRetries})`}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-textSecondary mb-2">
            Máximo de tentativas ({maxRetries}) atingido
          </p>
          <button
            onClick={onRetry}
            className="text-sm text-primary hover:text-primaryHover underline"
          >
            Forçar nova tentativa
          </button>
        </div>
      )}
    </div>
  );
};

