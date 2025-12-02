import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card rounded-xl shadow-lg border border-error/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-lg">
                <AlertTriangle className="text-error" size={24} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-textPrimary">Algo deu errado</h2>
            </div>
            <p className="text-textSecondary mb-4">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-textSecondary cursor-pointer mb-2">
                  Detalhes do erro
                </summary>
                <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-32 border border-border">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primaryHover active:bg-primaryActive transition-all duration-200 shadow-sm"
              >
                <RefreshCw size={16} strokeWidth={1.5} />
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-background text-textPrimary px-4 py-2 rounded-lg hover:bg-white border border-border transition-colors duration-200"
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

