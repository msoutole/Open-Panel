import { useState, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { SystemMetrics, ContainerMetrics } from '../services/api';

export interface UseMetricsOptions {
  containerId?: string;
  autoConnect?: boolean;
  interval?: number;
  maxHistory?: number;
}

export interface UseMetricsReturn {
  metrics: SystemMetrics | ContainerMetrics | null;
  history: Array<SystemMetrics | ContainerMetrics>;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  clearHistory: () => void;
  error: string | null;
}

const getWebSocketUrl = (path: string): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_API_URL 
    ? new URL(import.meta.env.VITE_API_URL).host
    : window.location.host;
  
  return `${protocol}//${host}${path}`;
};

export const useMetrics = (options: UseMetricsOptions = {}): UseMetricsReturn => {
  const { containerId, autoConnect = true, interval = 2000, maxHistory = 100 } = options;
  
  const [metrics, setMetrics] = useState<SystemMetrics | ContainerMetrics | null>(null);
  const [history, setHistory] = useState<Array<SystemMetrics | ContainerMetrics>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'metrics' || message.type === 'stats') {
      const metricsData = message.data as SystemMetrics | ContainerMetrics;
      
      // Use functional updates to prevent stale closures
      setMetrics(metricsData);
      
      setHistory((prev) => {
        // Prevent duplicate entries
        if (prev.length > 0 && prev[0]?.timestamp === metricsData.timestamp) {
          return prev;
        }
        const newHistory = [metricsData, ...prev];
        return newHistory.slice(0, maxHistory);
      });
    } else if (message.type === 'error') {
      setError((message.message as string | undefined) || 'Unknown error');
    }
  }, [maxHistory]);

  const { isConnected, send, close, reconnect } = useWebSocket({
    url: containerId 
      ? getWebSocketUrl('/ws/containers')
      : getWebSocketUrl('/ws/metrics'),
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
        
        // Subscribe to metrics
        if (containerId) {
          setTimeout(() => {
            send({ type: 'subscribe_stats', containerId, interval });
          }, 100);
        } else {
          setTimeout(() => {
            send({ type: 'subscribe', interval });
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
      send({ type: 'unsubscribe_stats', containerId });
    } else {
      send({ type: 'unsubscribe' });
    }
    close();
  }, [containerId, send, close]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    metrics,
    history,
    isConnected,
    connect,
    disconnect,
    clearHistory,
    error,
  };
};

