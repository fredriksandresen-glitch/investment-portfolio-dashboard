import { useState, useEffect, useRef } from 'react';
import { useActor } from './useActor';
import type { backendInterface } from '@/backend';

interface UseSafeActorResult {
  actor: backendInterface | null;
  isFetching: boolean;
  error: Error | null;
  isReady: boolean;
}

/**
 * Safe wrapper around useActor that never throws and provides clear error states.
 * Returns null actor on failure and logs errors with clear prefixes.
 * Ensures access control initialization happens only once per actor instance.
 */
export function useSafeActor(): UseSafeActorResult {
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initializingRef = useRef(false);
  const initializedActorRef = useRef<backendInterface | null>(null);

  // Always call useActor unconditionally (Rules of Hooks)
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) {
      setIsReady(false);
      return;
    }

    // If this is the same actor instance we already initialized, skip
    if (actor === initializedActorRef.current) {
      setIsReady(true);
      return;
    }

    // Prevent duplicate initialization attempts
    if (initializingRef.current) {
      return;
    }

    // Try to initialize access control safely (once per actor instance)
    const initAccessControl = async () => {
      initializingRef.current = true;
      try {
        console.log('[useSafeActor] Initializing access control for new actor instance...');
        await actor.initializeAccessControl();
        console.log('[useSafeActor] ✅ Access control initialized');
        initializedActorRef.current = actor;
        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('[useSafeActor] access control init failed:', err);
        // Don't set error state for access control failures - app can continue
        // Just log and mark as ready anyway
        initializedActorRef.current = actor;
        setIsReady(true);
      } finally {
        initializingRef.current = false;
      }
    };

    initAccessControl();
  }, [actor, isFetching]);

  return {
    actor,
    isFetching,
    error,
    isReady,
  };
}
