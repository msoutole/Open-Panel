import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAuditLogs, getAuditLogStats, AuditLog, AuditLogStats } from '../services/api';
import { useLogs } from '../hooks/useLogs';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../src/i18n/i18n-react';
import { Shield, Activity, FileText, AlertTriangle, CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const SecurityView: React.FC = () => {
  const LL = useTranslations();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditLogStats | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showToast } = useToast();

  // Use WebSocket for real-time Docker events
  const { logs: dockerLogs, isConnected: logsConnected } = useLogs({
    autoConnect: true,
    maxLogs: 100,
  });

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoadingLogs(true);
        const response = await getAuditLogs({ page, limit: 20 });
        setAuditLogs(response.logs);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error('Failed to load audit logs', error);
        showToast({
          type: 'error',
          title: 'Erro ao carregar logs',
          message: error instanceof Error ? error.message : 'Não foi possível carregar os logs de auditoria',
        });
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAuditLogs().catch(console.error);
  }, [page, showToast]);

  // Fetch audit stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getAuditLogStats();
        setAuditStats(stats);
      } catch (error) {
        console.error('Failed to load audit stats', error);
      }
    };

    fetchStats().catch(console.error);
    // Refresh stats every 30 seconds
    const interval = setInterval(() => void fetchStats(), 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleExportCSV = useCallback(async () => {
    try {
      showToast({
        type: 'info',
        title: 'Exportando logs',
        message: 'Preparando arquivo CSV...',
        duration: 2000,
      });

      // Fetch all audit logs for export (with higher limit)
      const response = await getAuditLogs({ page: 1, limit: 1000 });
      const allLogs = response.logs;

      // Convert audit logs to CSV format
      const headers = [LL.security.timestamp(), LL.security.action(), LL.security.userEmail(), LL.security.userId(), LL.security.targetResource(), LL.security.ipAddress(), LL.security.status()];
      const csvRows = [headers.join(',')];

      allLogs.forEach(log => {
        const row = [
          log.timestamp,
          log.action,
          log.userEmail,
          log.userId,
          log.resourceId || '',
          log.ipAddress || '',
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
      showToast({
        type: 'success',
        title: 'Exportação concluída',
        message: `Arquivo CSV com ${allLogs.length} logs foi baixado`,
      });
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to export audit logs', error);
      showToast({
        type: 'error',
        title: 'Erro na exportação',
        message: error instanceof Error ? error.message : 'Não foi possível exportar os logs',
      });
    }
  }, [showToast]);

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
            audit_logs: auditLogs.slice(0, 50).map(log => ({
                time: log.timestamp,
                action: log.action,
                user: log.userEmail,
                ip: log.ipAddress,
                status: log.status,
                resource: log.resourceId || log.resourceType
            })),
            docker_events: dockerLogs.slice(0, 50).map(log => ({
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
            <h2 className="text-2xl font-bold text-textPrimary">Security & Auditing</h2>
            <p className="text-textSecondary text-sm">Monitor system access, audit trails, and real-time docker events.</p>
        </div>
        <button 
            onClick={() => void handleAnalyze()} 
            disabled={analyzing}
            className="flex items-center gap-2 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
            {analyzing ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={18} strokeWidth={1.5} />}
            {analyzing ? LL.security.analyzing() : 'Análise de Ameaças por IA'}
        </button>
      </div>

      {/* AI Analysis Result */}
      {analysis && (
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                  <Sparkles size={18} strokeWidth={1.5} />
                  <h3>Avaliação de Segurança por IA</h3>
              </div>
              <div className="prose prose-sm text-textPrimary max-w-none">
                  <pre className="whitespace-pre-wrap font-sans bg-transparent border-0 p-0 text-textPrimary text-sm leading-relaxed">{analysis}</pre>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Overview Cards */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-success/10 text-success rounded-lg">
                    <Shield size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-textPrimary">Status de Segurança</h3>
             </div>
             <p className="text-2xl font-bold text-textPrimary">
               {auditStats ? (auditStats.failed > 0 ? 'Aviso' : 'Saudável') : LL.common.loading()}
             </p>
             <p className="text-xs text-textSecondary mt-1">
               {auditStats ? `${auditStats.failed} ações falharam nas últimas 24h` : 'Carregando status...'}
             </p>
          </div>
          
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Activity size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-textPrimary">Eventos (24h)</h3>
             </div>
             <p className="text-2xl font-bold text-textPrimary">
               {auditStats ? auditStats.recent24h.toLocaleString() : '...'}
             </p>
             <p className="text-xs text-textSecondary mt-1">Eventos de auditoria processados.</p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-warning/10 text-warning rounded-lg">
                    <AlertTriangle size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-textPrimary">Ações Falhadas</h3>
             </div>
             <p className="text-2xl font-bold text-textPrimary">
               {auditStats ? auditStats.failed : '...'}
             </p>
             <p className="text-xs text-textSecondary mt-1">
               {auditStats ? `De ${auditStats.total} eventos totais` : LL.common.loading()}
             </p>
          </div>
      </div>

      {/* Audit Log Table */}
      <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
           <div className="flex items-center gap-2">
                <FileText className="text-textSecondary" size={18} strokeWidth={1.5} />
                <h3 className="font-semibold text-textPrimary">Log de Auditoria (Imutável)</h3>
           </div>
           <button
            onClick={handleExportCSV}
            className={`text-xs border px-3 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 ${
              exportSuccess
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-white border-border text-textSecondary hover:bg-background'
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckCircle size={12} strokeWidth={2} />
                Exportado!
              </>
            ) : (
              LL.security.exportLogs()
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
            {totalPages > 1 && (
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {LL.common.back()}
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            )}
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3">{LL.security.timestamp()}</th>
                        <th className="px-6 py-3">{LL.security.action()}</th>
                        <th className="px-6 py-3">{LL.security.userEmail()}</th>
                        <th className="px-6 py-3">{LL.security.targetResource()}</th>
                        <th className="px-6 py-3">{LL.security.ipAddress()}</th>
                        <th className="px-6 py-3 text-right">{LL.security.status()}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {isLoadingLogs ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                                <Loader2 size={24} className="animate-spin text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">{LL.common.loading()}</p>
                            </td>
                        </tr>
                    ) : auditLogs.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                                <p className="text-sm text-slate-500">Nenhum log de auditoria encontrado.</p>
                            </td>
                        </tr>
                    ) : (
                        auditLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">{log.action}</td>
                                <td className="px-6 py-4">
                                    <div className="text-slate-800">{log.userEmail}</div>
                                    <div className="text-xs text-slate-400">ID: {log.userId}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-600 bg-slate-50 rounded w-fit px-2 py-1">
                                    {log.resourceId || log.resourceType || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{log.ipAddress || 'N/A'}</td>
                                <td className="px-6 py-4 text-right">
                                    {log.status === 'Success' && <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><CheckCircle size={12}/> Sucesso</span>}
                                    {log.status === 'Failure' && <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><XCircle size={12}/> Falha</span>}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </section>

      {/* Live Docker Events Stream */}
      <section className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800">
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-mono font-medium text-slate-200 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${logsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                Stream de Eventos do Docker em Tempo Real
            </h3>
            <span className="text-xs text-slate-500">
                {logsConnected ? 'Conectado' : 'Desconectado'}
            </span>
        </div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-2 terminal-scroll">
            {dockerLogs.length === 0 ? (
                <div className="flex gap-3 animate-pulse opacity-50">
                    <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString('pt-BR')}]</span>
                    <span className="text-slate-300">Aguardando eventos...</span>
                </div>
            ) : (
                dockerLogs.slice(0, 100).map((log) => (
                    <div key={log.id} className="flex gap-3 hover:bg-slate-800/50 transition-colors rounded px-1 py-0.5">
                        <span className="text-slate-500 shrink-0">
                            [{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                        </span>
                        <span className={`${
                            log.level === 'ERROR' ? 'text-red-400' : 
                            log.level === 'WARN' ? 'text-yellow-400' : 
                            log.level === 'DEBUG' ? 'text-blue-400' : 'text-slate-300'
                        } font-bold w-12 shrink-0`}>{log.level}</span>
                        <span className="text-slate-300 break-words flex-1">{log.message}</span>
                    </div>
                ))
            )}
        </div>
      </section>
    </div>
  );
};