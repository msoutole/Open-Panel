import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, Maximize2, Minimize2, Terminal as TerminalIcon, Power, Play, Square } from 'lucide-react';

interface WebTerminalProps {
  onClose: () => void;
  serviceName?: string;
}

export const WebTerminal: React.FC<WebTerminalProps> = ({ onClose, serviceName = 'system' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected'>('connected');

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

    // Initial greeting and mock connection
    term.writeln(`\x1b[32m✔\x1b[0m Connected to \x1b[1;34m${serviceName}\x1b[0m via OpenPanel Secure Shell`);
    term.writeln(`\x1b[2mType 'help' for available commands.\x1b[0m`);
    term.write('\r\n$ ');

    // Handle Resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // Basic Shell Simulation
    let currentLine = '';
    term.onData(e => {
      switch (e) {
        case '\r': // Enter
          term.write('\r\n');
          if (currentLine.trim()) {
             processCommand(term, currentLine.trim());
          } else {
             term.write('$ ');
          }
          currentLine = '';
          break;
        case '\u007F': // Backspace
          if (currentLine.length > 0) {
            term.write('\b \b');
            currentLine = currentLine.substring(0, currentLine.length - 1);
          }
          break;
        default:
          // Simple filtering for printable characters
          if (e >= ' ' && e <= '~') {
              term.write(e);
              currentLine += e;
          }
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [serviceName]);

  // Adjust fit when maximized changes
  useEffect(() => {
      setTimeout(() => {
          fitAddonRef.current?.fit();
      }, 300); // Wait for transition
  }, [isMaximized]);

  const processCommand = (term: Terminal, cmd: string) => {
      switch (cmd) {
          case 'help':
              term.writeln('Available commands:');
              term.writeln('  help     Show this help message');
              term.writeln('  clear    Clear the terminal screen');
              term.writeln('  status   Show service status');
              term.writeln('  logs     Tail recent logs');
              term.writeln('  exit     Close the terminal session');
              break;
          case 'clear':
              term.clear();
              break;
          case 'status':
              term.writeln(`Service: ${serviceName}`);
              term.writeln('Uptime: 14d 2h 12m');
              term.writeln('CPU: 12%  MEM: 450MB');
              break;
          case 'logs':
              term.writeln('[INFO] Starting application...');
              term.writeln('[INFO] Listening on port 8080');
              term.writeln('[WARN] High latency on DB connection');
              term.writeln('[INFO] Health check passed');
              break;
          case 'exit':
              onClose();
              return;
          default:
              term.writeln(`bash: ${cmd}: command not found`);
      }
      term.write('$ ');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isMaximized ? 'p-0' : 'bg-slate-900/50 backdrop-blur-sm'}`}>
      <div 
        className={`bg-[#1a1d21] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border border-slate-700 ${
            isMaximized ? 'w-full h-full rounded-none' : 'w-[800px] h-[500px]'
        }`}
      >
        {/* Terminal Header */}
        <div className="h-10 bg-[#21252b] border-b border-[#181a1f] flex items-center justify-between px-4 shrink-0 select-none">
            <div className="flex items-center gap-3">
                <TerminalIcon size={14} className="text-slate-400" />
                <span className="text-xs font-mono text-slate-300">root@{serviceName}:~</span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {status === 'connected' ? 'Connected' : 'Offline'}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setStatus(s => s === 'connected' ? 'disconnected' : 'connected')}
                    className="p-1.5 text-slate-500 hover:text-white rounded transition-colors"
                    title="Restart Session"
                >
                    <Power size={14} />
                </button>
                <button 
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 text-slate-500 hover:text-white rounded transition-colors"
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                    onClick={onClose}
                    className="p-1.5 text-slate-500 hover:bg-red-500 hover:text-white rounded transition-colors ml-2"
                >
                    <X size={14} />
                </button>
            </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 overflow-hidden bg-[#1a1d21] relative">
            <div ref={terminalRef} className="w-full h-full" />
            
            {status === 'disconnected' && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-slate-400 z-10 backdrop-blur-[1px]">
                    <div className="text-red-500 mb-2 font-bold flex items-center gap-2">
                        <Square size={16} fill="currentColor" /> Disconnected
                    </div>
                    <p className="text-sm mb-4">Socket connection lost to remote host.</p>
                    <button 
                        onClick={() => {
                            setStatus('connected');
                            xtermRef.current?.writeln('\r\n\x1b[32m✔\x1b[0m Reconnecting...\r\n$ ');
                            xtermRef.current?.focus();
                        }} 
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                        <Play size={14} fill="currentColor" /> Reconnect
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};