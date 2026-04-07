import { useEffect } from 'react';
import { useGlobalErrorState } from '@/components/GlobalErrorState';

export function useGlobalErrorCapture() {
  const { setError } = useGlobalErrorState();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[useGlobalErrorCapture] window.onerror:', event.error || event.message);
      
      setError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: Date.now(),
        type: 'error',
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[useGlobalErrorCapture] unhandledrejection:', event.reason);
      
      const message = event.reason?.message || event.reason?.toString() || 'Unhandled promise rejection';
      const stack = event.reason?.stack;
      
      setError({
        message,
        stack,
        timestamp: Date.now(),
        type: 'rejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [setError]);
}
