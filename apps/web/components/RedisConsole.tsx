import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, Trash2, Terminal as TerminalIcon } from 'lucide-react';
import { executeQuery, ExecuteQueryResult } from '../services/databaseClient';

interface RedisConsoleProps {
  containerId: string;
}

interface CommandHistory {
  command: string;
  result?: ExecuteQueryResult;
}

export const RedisConsole: React.FC<RedisConsoleProps> = ({ containerId }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleExecute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!command.trim()) return;

    const currentCmd = command;
    setCommand('');
    setIsLoading(true);

    // Optimistic update
    setHistory(prev => [...prev, { command: currentCmd }]);

    executeQuery({
      containerId,
      type: 'redis',
      query: currentCmd
    }).then(response => {
      setHistory(prev => {
        const newHistory = [...prev];
        const lastEntry = newHistory[newHistory.length - 1];
        if (lastEntry) {
          lastEntry.result = response;
        }
        return newHistory;
      });
    }).catch((error: unknown) => {
      setHistory(prev => {
        const newHistory = [...prev];
        const lastEntry = newHistory[newHistory.length - 1];
        if (lastEntry) {
          lastEntry.result = {
            success: false,
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        return newHistory;
      });
    }).finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1d21] border border-slate-700 rounded-lg overflow-hidden text-slate-300 font-mono">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-slate-700">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-slate-200">Redis CLI</span>
        </div>
        <button
          onClick={() => setHistory([])}
          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
          title="Clear"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4" ref={scrollRef}>
        <div className="text-xs text-slate-500">Connected to Redis container. Type commands like 'SET key value' or 'GET key'.</div>
        
        {history.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-green-500">➜</span>
              <span>{item.command}</span>
            </div>
            {item.result ? (
              <div className={`ml-5 text-sm ${item.result.success ? 'text-slate-200' : 'text-red-400'}`}>
                {item.result.error ? (
                  item.result.error
                ) : (
                  <pre className="whitespace-pre-wrap">{
                    typeof item.result.data === 'string' 
                      ? item.result.data 
                      : JSON.stringify(item.result.data, null, 2)
                  }</pre>
                )}
              </div>
            ) : (
              <div className="ml-5">
                <Loader2 size={14} className="animate-spin text-slate-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleExecute} className="p-2 bg-[#21252b] border-t border-slate-700 flex gap-2">
        <span className="text-green-500 py-2 pl-2">➜</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-600"
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !command.trim()}
          className="p-2 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <Play size={16} fill="currentColor" />
        </button>
      </form>
    </div>
  );
};
