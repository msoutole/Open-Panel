import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Erro desconhecido';
      const errorStack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full bg-card rounded-xl shadow-xl border border-error/20 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-error/10 rounded-xl flex-shrink-0">
                <AlertTriangle className="text-error" size={28} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-textPrimary mb-1">Algo deu errado</h2>
                <p className="text-sm text-textSecondary">
                  Ocorreu um erro inesperado. Por favor, tente recarregar a página.
                </p>
              </div>
            </div>

            {/* Error Details - Collapsible */}
            {this.state.error && (
              <div className="mb-4">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between text-sm text-textSecondary hover:text-textPrimary transition-colors duration-200 p-2 rounded-lg hover:bg-background"
                >
                  <span className="font-medium">Detalhes do erro</span>
                  <X 
                    size={16} 
                    strokeWidth={1.5} 
                    className={`transition-transform duration-200 ${this.state.showDetails ? 'rotate-45' : ''}`}
                  />
                </button>
                {this.state.showDetails && (
                  <div className="mt-2 bg-background border border-border rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">Mensagem</div>
                      <div className="text-xs font-mono text-error bg-error/5 p-2 rounded border border-error/20 break-all">
                        {errorMessage}
                      </div>
                    </div>
                    {errorStack && (
                      <div>
                        <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">Stack Trace</div>
                        <pre className="text-[10px] font-mono text-textSecondary bg-background p-2 rounded border border-border overflow-auto max-h-40">
                          {errorStack}
                        </pre>
                      </div>
                    )}
                    {componentStack && (
                      <div>
                        <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">Component Stack</div>
                        <pre className="text-[10px] font-mono text-textSecondary bg-background p-2 rounded border border-border overflow-auto max-h-32">
                          {componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primaryHover active:bg-primaryActive transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <RefreshCw size={16} strokeWidth={1.5} />
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-background text-textPrimary px-4 py-2.5 rounded-lg hover:bg-white border border-border transition-all duration-200 font-medium hover:shadow-sm"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

