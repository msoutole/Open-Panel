import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data?: unknown;
  timestamp?: string;
  level?: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message?: string;
  event?: unknown;
  token?: string;
  containerId?: string;
  interval?: number;
  [key: string]: unknown;
}

export interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  shouldConnect?: boolean;
}

export interface UseWebSocketReturn {
  send: (message: WebSocketMessage) => void;
  close: () => void;
  reconnect: () => void;
  readyState: number;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
}

const READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnect: shouldReconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 10,
    shouldConnect = true,
  } = options;

  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const shouldReconnectRef = useRef(shouldReconnect);

  useEffect(() => {
    shouldReconnectRef.current = shouldReconnect;
  }, [shouldReconnect]);

  const connect = useCallback(() => {
    if (!shouldConnect) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setReadyState(WebSocket.OPEN);
        setIsConnected(true);
        reconnectCountRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        onError?.(error);
      };

      ws.onclose = () => {
        setReadyState(WebSocket.CLOSED);
        setIsConnected(false);
        onClose?.();

        // Attempt to reconnect if enabled
        if (shouldReconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnectInterval, reconnectAttempts, shouldConnect]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  const close = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    close();
    reconnectCountRef.current = 0;
    setTimeout(() => {
      shouldReconnectRef.current = true;
      connect();
    }, 1000);
  }, [close, connect]);

  useEffect(() => {
    if (shouldConnect) {
      connect();
    }

    return () => {
      close();
    };
  }, [shouldConnect, connect, close]);

  return {
    send,
    close,
    reconnect,
    readyState,
    isConnected,
    lastMessage,
  };
};

