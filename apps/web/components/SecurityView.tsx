import React, { useState } from 'react';
import { AUDIT_LOGS, INITIAL_LOGS } from '../constants';
import { Shield, Activity, FileText, AlertTriangle, CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const SecurityView: React.FC = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Sanitização de campos CSV para prevenir injection
  const sanitizeCSVField = (field: string | number): string => {
    const str = String(field);

    // Prevent CSV injection (formulas starting with =, +, -, @, |, %)
    if (/^[=+\-@|%]/.test(str)) {
      return `'${str.replace(/"/g, '""')}`; // Prefix with quote and escape quotes
    }

    // Escape quotes
    return str.replace(/"/g, '""');
  };

  const handleExportCSV = () => {
    // Convert audit logs to CSV format
    const headers = ['Timestamp', 'Action', 'User Email', 'User ID', 'Target Resource', 'IP Address', 'Status'];
    const csvRows = [headers.join(',')];

    AUDIT_LOGS.forEach(log => {
      const row = [
        log.timestamp,
        log.action,
        log.userEmail,
        log.userId,
        log.targetResource,
        log.ipAddress,
        log.status
      ];
      csvRows.push(row.map(field => `"${sanitizeCSVField(field)}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `openpanel-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Feedback de sucesso
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
        // NOTE: AI analysis requires Gemini API key
        // In production, this should call a backend endpoint that securely uses the API key
        const apiKey = localStorage.getItem('gemini_api_key') || '';
        if (!apiKey) {
            throw new Error('Gemini API key not configured. Please set it in the settings first.');
        }
        const ai = new GoogleGenAI({ apiKey });
        
        // Prepare detailed context data for the AI
        const contextData = {
            audit_logs: AUDIT_LOGS.map(log => ({
                time: log.timestamp,
                action: log.action,
                user: log.userEmail,
                ip: log.ipAddress,
                status: log.status,
                resource: log.targetResource
            })),
            docker_events: INITIAL_LOGS.map(log => ({
                time: log.timestamp,
                level: log.level,
                msg: log.message
            }))
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a cyber security expert analyzing server logs for the OpenPanel infrastructure dashboard. Your goal is to identify threats, anomalies, and operational issues.",
            },
            contents: `Analyze the provided Audit Logs and Docker Events.
            
            Key objectives:
            1. **Suspicious Activity**: Identify failed login attempts and potential brute-force patterns.
            2. **IP Analysis**: Flag any suspicious or external IP addresses (non-local) performing sensitive actions.
            3. **Operational Health**: Summarize critical Docker events or resource warnings.
            4. **Summary**: Provide a concise status report with a threat level assessment (Low/Medium/High).

            Dataset:
            ${JSON.stringify(contextData, null, 2)}
            
            Format output in clean Markdown.`,
        });
        
        setAnalysis(response.text || "No analysis generated.");
    } catch (error) {
        console.error("Analysis failed", error);
        setAnalysis("Failed to generate analysis. Please try again.");
    } finally {
        setAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Security & Auditing</h2>
            <p className="text-slate-500 text-sm">Monitor system access, audit trails, and real-time docker events.</p>
        </div>
        <button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70 disabled:scale-100"
        >
            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {analyzing ? 'Analyzing...' : 'AI Threat Analysis'}
        </button>
      </div>

      {/* AI Analysis Result */}
      {analysis && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2 mb-3 text-purple-700 font-bold">
                  <Sparkles size={18} />
                  <h3>AI Security Assessment</h3>
              </div>
              <div className="prose prose-sm text-slate-700 max-w-none">
                  <pre className="whitespace-pre-wrap font-sans bg-transparent border-0 p-0 text-slate-700 text-sm leading-relaxed">{analysis}</pre>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Overview Cards */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Shield size={20} />
                </div>
                <h3 className="font-semibold text-slate-700">Security Status</h3>
             </div>
             <p className="text-2xl font-bold text-slate-800">Healthy</p>
             <p className="text-xs text-slate-500 mt-1">Firewall active, MFA enforced for admins.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Activity size={20} />
                </div>
                <h3 className="font-semibold text-slate-700">Events (24h)</h3>
             </div>
             <p className="text-2xl font-bold text-slate-800">1,204</p>
             <p className="text-xs text-slate-500 mt-1">Docker events processed.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <AlertTriangle size={20} />
                </div>
                <h3 className="font-semibold text-slate-700">Failed Logins</h3>
             </div>
             <p className="text-2xl font-bold text-slate-800">3</p>
             <p className="text-xs text-slate-500 mt-1">Detected from 2 distinct IPs.</p>
          </div>
      </div>

      {/* Audit Log Table */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
                <FileText className="text-slate-500" size={18} />
                <h3 className="font-semibold text-slate-700">Audit Log (Immutable)</h3>
           </div>
           <button
            onClick={handleExportCSV}
            className={`text-xs border px-3 py-1.5 rounded font-medium transition-all flex items-center gap-1.5 ${
              exportSuccess
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckCircle size={12} />
                Exported!
              </>
            ) : (
              'Export CSV'
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Target</th>
                        <th className="px-6 py-3">IP Address</th>
                        <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {AUDIT_LOGS.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">{log.timestamp}</td>
                            <td className="px-6 py-4 font-medium text-slate-700">{log.action}</td>
                            <td className="px-6 py-4">
                                <div className="text-slate-800">{log.userEmail}</div>
                                <div className="text-xs text-slate-400">ID: {log.userId}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600 bg-slate-50 rounded w-fit px-2 py-1">{log.targetResource}</td>
                            <td className="px-6 py-4 text-slate-500">{log.ipAddress}</td>
                            <td className="px-6 py-4 text-right">
                                {log.status === 'Success' && <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><CheckCircle size={12}/> Success</span>}
                                {log.status === 'Failure' && <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><XCircle size={12}/> Failure</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      {/* Live Docker Events Stream */}
      <section className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800">
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-mono font-medium text-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Live Docker Events Stream
            </h3>
            <span className="text-xs text-slate-500">Connected to /var/run/docker.sock</span>
        </div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-2 terminal-scroll">
            {INITIAL_LOGS.map((log) => (
                <div key={log.id} className="flex gap-3">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span className={`${
                        log.level === 'ERROR' ? 'text-red-400' : 
                        log.level === 'WARN' ? 'text-yellow-400' : 
                        log.level === 'DEBUG' ? 'text-blue-400' : 'text-slate-300'
                    } font-bold w-12 shrink-0`}>{log.level}</span>
                    <span className="text-slate-300">{log.message}</span>
                </div>
            ))}
            <div className="flex gap-3 animate-pulse opacity-50">
                 <span className="text-slate-500 shrink-0">[14:32:20]</span>
                 <span className="text-slate-300">Listening for events...</span>
            </div>
        </div>
      </section>
    </div>
  );
};