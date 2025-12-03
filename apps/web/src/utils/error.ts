export function getErrorMessage(err: unknown): { message: string; code?: string } {
  if (err instanceof Error) {
    return { message: err.message };
  }
  if (typeof err === 'string') {
    return { message: err };
  }
  if (err && typeof err === 'object') {
    try {
      const anyErr = err as Record<string, unknown>;
      if (typeof anyErr.message === 'string') {
        return { message: anyErr.message, code: typeof anyErr.code === 'string' ? (anyErr.code) : undefined };
      }
    } catch {
      // ignore
    }
  }
  try {
    return { message: String(err) };
  } catch {
    return { message: 'An unexpected error occurred' };
  }
}
