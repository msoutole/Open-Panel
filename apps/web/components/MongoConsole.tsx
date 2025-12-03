import React, { useState } from 'react';
import { Play, Loader2, Trash2, Database, Braces } from 'lucide-react';
import { executeQuery, ExecuteQueryResult } from '../services/databaseClient';

interface MongoConsoleProps {
  containerId: string;
}

export const MongoConsole: React.FC<MongoConsoleProps> = ({ containerId }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ExecuteQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await executeQuery({
        containerId,
        type: 'mongodb',
        query
      });
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-green-600" />
          <span className="text-sm font-semibold text-slate-700">MongoDB Console</span>
        </div>
        <button
          onClick={() => { setQuery(''); setResult(null); }}
          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Editor */}
        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white relative flex flex-col">
          <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Braces size={12} /> Query Object (JSON)
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`db.users.find({ role: "admin" })`}
            className="flex-1 p-4 font-mono text-sm text-slate-800 resize-none focus:outline-none"
            spellCheck={false}
          />
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleExecute}
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
              Run
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {result?.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 font-mono text-sm whitespace-pre-wrap">
              {result.error}
            </div>
          ) : result?.data ? (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm p-4">
              <div className="mb-2 text-xs text-slate-500 flex justify-between">
                <span>Result</span>
                <span>{result.executionTime}ms</span>
              </div>
              <pre className="font-mono text-xs text-slate-700 overflow-auto max-h-[500px]">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p>Enter a MongoDB query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
