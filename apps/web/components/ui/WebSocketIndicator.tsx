import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

export interface WebSocketIndicatorProps {
  isConnected: boolean;
  isConnecting?: boolean;
  error?: string | null;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  onRetry?: () => void;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const WebSocketIndicator: React.FC<WebSocketIndicatorProps> = ({
  isConnected,
  isConnecting = false,
  error,
  reconnectAttempts = 0,
  maxReconnectAttempts = 10,
  onRetry,
  className = '',
  showLabel = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const getStatus = () => {
    if (isConnected) return 'connected';
    if (isConnecting) return 'connecting';
    if (error || reconnectAttempts >= maxReconnectAttempts) return 'error';
    return 'disconnected';
  };

  const status = getStatus();

  const statusConfig = {
    connected: {
      icon: <Wifi size={iconSizes[size]} className="text-success" />,
      label: 'Conectado',
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      pulse: true,
    },
    connecting: {
      icon: <Loader2 size={iconSizes[size]} className="text-primary animate-spin" />,
      label: 'Conectando...',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      pulse: false,
    },
    disconnected: {
      icon: <WifiOff size={iconSizes[size]} className="text-warning" />,
      label: reconnectAttempts > 0 
        ? `Reconectando... (${reconnectAttempts}/${maxReconnectAttempts})`
        : 'Desconectado',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      pulse: false,
    },
    error: {
      icon: <AlertCircle size={iconSizes[size]} className="text-error" />,
      label: error || 'Erro de conexão',
      bgColor: 'bg-error/10',
      textColor: 'text-error',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative flex items-center justify-center p-1.5 rounded-lg ${config.bgColor}`}>
        {config.icon}
        {config.pulse && (
          <span className="absolute inset-0 rounded-lg bg-success/20 animate-ping" />
        )}
      </div>
      
      {showLabel && (
        <div className="flex items-center gap-2">
          <span className={`${sizeClasses[size]} font-medium ${config.textColor}`}>
            {config.label}
          </span>
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className={`${sizeClasses[size]} text-primary hover:text-primaryHover underline transition-colors`}
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
    </div>
  );
};

