import React, { useState } from 'react';
import { Play, Loader2, Download, Trash2, Database } from 'lucide-react';
import { executeQuery, ExecuteQueryResult, DatabaseType } from '../services/databaseClient';

interface PostgresConsoleProps {
  containerId: string;
  type?: 'postgresql' | 'mysql' | 'mariadb'; // Shared UI for SQL databases
}

export const PostgresConsole: React.FC<PostgresConsoleProps> = ({ containerId, type = 'postgresql' }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ExecuteQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleExecute = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await executeQuery({
        containerId,
        type: type as DatabaseType,
        query
      });
      setResult(response);
      if (!history.includes(query)) {
        setHistory(prev => [query, ...prev].slice(0, 10));
      }
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

  const handleDownloadCSV = () => {
    if (!result?.data || result.data.length === 0) return;

    const headers = Object.keys(result.data[0]);
    const csvContent = [
      headers.join(','),
      ...result.data.map(row => headers.map(fieldName => {
        const value = row[fieldName];
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_result_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700 capitalize">{type} Console</span>
        </div>
        <div className="flex items-center gap-2">
          {result?.data && result.data.length > 0 && (
            <button
              onClick={handleDownloadCSV}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Download CSV"
            >
              <Download size={16} />
            </button>
          )}
          <button
            onClick={() => { setQuery(''); setResult(null); }}
            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Query Editor */}
        <div className="h-40 border-b border-slate-200 bg-white relative flex-shrink-0">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`SELECT * FROM users LIMIT 10;`}
            className="w-full h-full p-4 font-mono text-sm text-slate-800 resize-none focus:outline-none"
            spellCheck={false}
          />
          <button
            onClick={handleExecute}
            disabled={isLoading || !query.trim()}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
            Run
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <Loader2 size={32} className="animate-spin mb-2" />
            </div>
          ) : result?.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 font-mono text-sm whitespace-pre-wrap">
              {result.error}
              {result.details && <div className="mt-2 text-xs opacity-75">{result.details}</div>}
            </div>
          ) : result?.data ? (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              {result.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {Object.keys(result.data[0]).map((key) => (
                          <th key={key} className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.data.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-4 py-2 text-slate-600 whitespace-nowrap font-mono text-xs">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No results found
                  {result.rowsAffected !== undefined && (
                    <div className="mt-1 text-xs font-mono">Rows affected: {result.rowsAffected}</div>
                  )}
                </div>
              )}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <span>{result.data.length} rows</span>
                <span>{result.executionTime}ms</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Database size={48} className="mb-4 opacity-20" />
              <p>Enter a query and press Run to see results</p>
              {history.length > 0 && (
                <div className="mt-8 w-full max-w-md">
                  <p className="text-xs uppercase font-bold tracking-wide mb-2">Recent Queries</p>
                  <div className="space-y-1">
                    {history.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(q)}
                        className="w-full text-left text-xs font-mono truncate p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
