import { useState, useCallback } from 'react';
import { getErrorMessage } from '../src/utils/error';

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

    const extracted = getErrorMessage(err);
    let message = extracted.message;
    let code = extracted.code ?? 'UNKNOWN';

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
