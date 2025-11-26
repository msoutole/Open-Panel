import { useState, useCallback } from 'react';

interface ErrorState {
  message: string;
  code?: string;
  timestamp: number;
}

/**
 * Hook para gerenciamento global de erros
 *
 * @example
 * const { error, handleError, clearError } = useErrorHandler();
 *
 * try {
 *   await riskyOperation();
 * } catch (err) {
 *   handleError(err, 'Service Creation');
 * }
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((err: unknown, context?: string) => {
    // Log do erro no console para debugging
    console.error(`[Error Handler${context ? ` - ${context}` : ''}]:`, err);

    let message = 'An unexpected error occurred';
    let code = 'UNKNOWN';

    // Extrair mensagem baseado no tipo do erro
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      message = String((err as any).message);
      code = (err as any).code || code;
    }

    setError({
      message,
      code,
      timestamp: Date.now()
    });

    // Auto-clear após 5 segundos
    setTimeout(() => setError(null), 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};
