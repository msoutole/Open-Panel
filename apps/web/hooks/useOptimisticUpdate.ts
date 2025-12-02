import { useState, useCallback } from 'react';

/**
 * Hook for optimistic updates
 * Updates UI immediately, then syncs with server
 */
export function useOptimisticUpdate<T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (newValue: T) => {
      // Optimistic update
      const previousValue = value;
      setValue(newValue);
      setIsUpdating(true);
      setError(null);

      try {
        // Sync with server
        const syncedValue = await updateFn(newValue);
        setValue(syncedValue);
        return syncedValue;
      } catch (err) {
        // Rollback on error
        setValue(previousValue);
        setError(err instanceof Error ? err : new Error('Update failed'));
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [value, updateFn]
  );

  return { value, update, isUpdating, error };
}

