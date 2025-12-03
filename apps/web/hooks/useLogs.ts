import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
}

export interface UseLogsOptions {
  containerId?: string;
  autoConnect?: boolean;
  maxLogs?: number;
}

export interface UseLogsReturn {
  logs: LogEntry[];
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  clearLogs: () => void;
  error: string | null;
}

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    return '';
  }
  
  return envUrl || '';
};

const getWebSocketUrl = (path: string): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_API_URL 
    ? new URL(import.meta.env.VITE_API_URL).host
    : window.location.host;
  
  return `${protocol}//${host}${path}`;
};

export const useLogs = (options: UseLogsOptions = {}): UseLogsReturn => {
  const { containerId, autoConnect = true, maxLogs = 1000 } = options;
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logIdCounterRef = useRef(0);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'log' || message.type === 'docker_event') {
      const logEntry: LogEntry = {
        id: `log_${Date.now()}_${logIdCounterRef.current++}`,
        timestamp: message.timestamp || new Date().toISOString(),
        level: message.level || 'INFO',
        message: message.data || JSON.stringify(message.event || message),
      };
      
      setLogs((prev) => {
        // Prevent duplicate entries
        if (prev.length > 0 && prev[0]?.id === logEntry.id) {
          return prev;
        }
        const newLogs = [logEntry, ...prev];
        // Keep only the last maxLogs entries
        return newLogs.slice(0, maxLogs);
      });
    } else if (message.type === 'error') {
      setError(message.message || 'Unknown error');
    }
  }, [maxLogs]);

  const { isConnected, send, close, reconnect } = useWebSocket({
    url: containerId 
      ? getWebSocketUrl('/ws/containers')
      : getWebSocketUrl('/ws/logs'),
    onMessage: handleMessage,
    onError: (err) => {
      setError('WebSocket connection error');
      console.error('WebSocket error:', err);
    },
    onOpen: () => {
      setError(null);
      // Authenticate
      const token = localStorage.getItem('openpanel_access_token');
      if (token) {
        send({ type: 'auth', token });
        
        // Subscribe to logs
        if (containerId) {
          setTimeout(() => {
            send({ type: 'subscribe_logs', containerId });
          }, 100);
        }
      }
    },
    onClose: () => {
      setError('WebSocket connection closed');
    },
    shouldConnect: autoConnect,
    reconnect: true,
  });

  const connect = useCallback(() => {
    reconnect();
  }, [reconnect]);

  const disconnect = useCallback(() => {
    if (containerId) {
      send({ type: 'unsubscribe_logs', containerId });
    }
    close();
  }, [containerId, send, close]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    isConnected,
    connect,
    disconnect,
    clearLogs,
    error,
  };
};

