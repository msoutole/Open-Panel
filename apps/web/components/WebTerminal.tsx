import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { X, Maximize2, Minimize2, Terminal as TerminalIcon, Power, Play, Square, Loader2 } from 'lucide-react';

interface WebTerminalProps {
  onClose: () => void;
  serviceName?: string;
  containerId?: string;
}

type TerminalStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'authenticated';

export const WebTerminal: React.FC<WebTerminalProps> = ({ onClose, serviceName = 'system', containerId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [status, setStatus] = useState<TerminalStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to get WS URL
  const getWsUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    const isDev = import.meta.env.DEV;
    
    let baseUrl = '';
    if (isDev) {
      // In dev, we assume the API is running on port 3001
      // If VITE_API_URL is set, use it, otherwise default to localhost:3001
      baseUrl = envUrl || 'http://localhost:3001';
    } else {
      // In production, use the provided env var or fallback to current origin
      baseUrl = envUrl || window.location.origin;
    }

    // Ensure protocol is ws/wss
    if (baseUrl.startsWith('http')) {
      return baseUrl.replace(/^http/, 'ws') + '/ws/terminal';
    } else if (baseUrl.startsWith('https')) {
        return baseUrl.replace(/^https/, 'wss') + '/ws/terminal';
    }
    
    // If no protocol, assume it's relative or needs protocol prepended
    // For relative URLs in prod (same domain), use location.protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (baseUrl.startsWith('/')) {
        return `${protocol}//${window.location.host}${baseUrl}/ws/terminal`;
    }

    return `${protocol}//${baseUrl}/ws/terminal`;
  };

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      setStatus('connecting');
      setErrorMessage(null);
      
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        // Connection opened, waiting for 'connected' message from server
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse terminal message', e);
        }
      };

      ws.onclose = (e) => {
        setStatus('disconnected');
        if (e.reason) {
            setErrorMessage(`Connection closed: ${e.reason}`);
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorMessage('Connection error');
      };

    } catch (e) {
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to connect');
    }
  }, [containerId]);

  const handleMessage = (msg: Record<string, unknown> & { type: string }) => {
    const ws = wsRef.current;
    const term = xtermRef.current;

    switch (msg.type) {
      case 'connected':
        // Server ready, send auth
        const token = localStorage.getItem('openpanel_access_token');
        if (token && ws) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        } else {
          setStatus('error');
          setErrorMessage('No authentication token found');
        }
        break;

      case 'auth_success':
        setStatus('authenticated');
        // Auth success, open terminal
        if (containerId && ws) {
          ws.send(JSON.stringify({ 
            type: 'open_terminal', 
            containerId,
            shell: '/bin/bash' // Default shell, maybe make configurable?
          }));
        } else {
            term?.writeln('\x1b[31mError: Container ID missing.\x1b[0m');
        }
        break;

      case 'auth_error':
        setStatus('error');
        setErrorMessage(msg.message || 'Authentication failed');
        term?.writeln(`\r\n\x1b[31mAuthentication Error: ${msg.message}\x1b[0m`);
        break;

      case 'terminal_opened':
        setStatus('connected');
        term?.writeln(`\r\n\x1b[32m✔\x1b[0m Terminal session started for \x1b[1;34m${serviceName}\x1b[0m\r\n`);
        term?.focus();
        break;

      case 'output':
        term?.write(msg.data);
        break;

      case 'error':
        term?.writeln(`\r\n\x1b[31mError: ${msg.message}\x1b[0m`);
        break;
        
      case 'terminal_closed':
        term?.writeln('\r\n\x1b[33mTerminal session closed.\x1b[0m');
        setStatus('disconnected');
        break;
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#1a1d21',
        foreground: '#eff0f1',
        cursor: '#528bff',
        selectionBackground: '#3e4451',
        black: '#1a1d21',
        red: '#ff5c57',
        green: '#5af78e',
        yellow: '#f3f99d',
        blue: '#57c7ff',
        magenta: '#ff6ac1',
        cyan: '#9aedfe',
        white: '#f1f1f0',
        brightBlack: '#686868',
        brightRed: '#ff5c57',
        brightGreen: '#5af78e',
        brightYellow: '#f3f99d',
        brightBlue: '#57c7ff',
        brightMagenta: '#ff6ac1',
        brightCyan: '#9aedfe',
        brightWhite: '#f1f1f0',
      },
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln(`\x1b[2mConnecting to ${serviceName}...[0m`);

    // Handle Resize
    const handleResize = () => {
        fitAddon.fit();
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'resize',
                cols: term.cols,
                rows: term.rows
            }));
        }
    };
    window.addEventListener('resize', handleResize);
    
    // Also resize when terminal opens
    term.onResize((size) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'resize',
                cols: size.cols,
                rows: size.rows
            }));
        }
    });

    // Handle Input
    term.onData(data => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
            type: 'input',
            data
        }));
      }
    });

    // Connect to WebSocket
    connect();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [serviceName, containerId]); // Re-init if containerId changes

  // Adjust fit when maximized changes
  useEffect(() => {
      setTimeout(() => {
          fitAddonRef.current?.fit();
          // Send resize event
          if (xtermRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
             wsRef.current.send(JSON.stringify({
                type: 'resize',
                cols: xtermRef.current.cols,
                rows: xtermRef.current.rows
             }));
          }
      }, 300); 
  }, [isMaximized]);

  const handleReconnect = () => {
      xtermRef.current?.reset();
      connect();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 ${isMaximized ? 'p-0' : 'bg-slate-900/50 backdrop-blur-sm'}`}>
      <div 
        className={`bg-[#1a1d21] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border border-slate-700 ${ 
            isMaximized ? 'w-full h-full rounded-none' : 'w-full h-full sm:w-[800px] sm:h-[500px] max-w-[calc(100vw-1rem)] max-h-[calc(100vh-2rem)]' 
        }`}
      >
        {/* Terminal Header */}
        <div className="h-10 bg-[#21252b] border-b border-[#181a1f] flex items-center justify-between px-4 shrink-0 select-none">
            <div className="flex items-center gap-3">
                <TerminalIcon size={14} className="text-slate-400" />
                <span className="text-xs font-mono text-slate-300">root@{serviceName}:~</span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${ 
                    status === 'connected' || status === 'authenticated' ? 'bg-green-500/20 text-green-400' : 
                    status === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`}>
                    {status}
                </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
                <button 
                    onClick={handleReconnect}
                    className="p-2 sm:p-1.5 text-slate-500 hover:text-white rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                    title="Restart Session"
                    aria-label="Restart Session"
                >
                    <Power size={16} className="sm:w-[14px] sm:h-[14px]" />
                </button>
                <button 
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 sm:p-1.5 text-slate-500 hover:text-white rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                    title={isMaximized ? "Restore" : "Maximize"}
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? <Minimize2 size={16} className="sm:w-[14px] sm:h-[14px]" /> : <Maximize2 size={16} className="sm:w-[14px] sm:h-[14px]" />}
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 sm:p-1.5 text-slate-500 hover:bg-red-500 hover:text-white rounded transition-colors ml-1 sm:ml-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                    aria-label="Close terminal"
                >
                    <X size={16} className="sm:w-[14px] sm:h-[14px]" />
                </button>
            </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 overflow-hidden bg-[#1a1d21] relative">
            <div ref={terminalRef} className="w-full h-full" />
            
            {(status === 'disconnected' || status === 'error') && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-slate-400 z-10 backdrop-blur-[1px]">
                    <div className="text-red-500 mb-2 font-bold flex items-center gap-2">
                        <Square size={16} fill="currentColor" /> Disconnected
                    </div>
                    <p className="text-sm mb-4">{errorMessage || 'Socket connection lost to remote host.'}</p>
                    <button 
                        onClick={handleReconnect} 
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
                    >
                        <Play size={16} fill="currentColor" className="sm:w-[14px] sm:h-[14px]" /> Reconnect
                    </button>
                </div>
            )}

            {status === 'connecting' && (
                 <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-slate-400 z-10">
                    <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
                    <p className="text-xs">Establishing secure connection...</p>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};
