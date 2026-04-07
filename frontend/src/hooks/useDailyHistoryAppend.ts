import { useEffect, useRef } from 'react';
import { useSafeActor } from './useSafeActor';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that manages daily historical portfolio point appending at 18:00 Europe/Oslo (CET/CEST).
 * 
 * Behavior:
 * - On mount/refresh: checks if today's point needs to be added (if app was closed at 18:00)
 * - While running: schedules a timer to trigger at 18:00 Europe/Oslo
 * - Backend prevents duplicate points for the same date
 * - Safe: never throws, handles actor unavailability gracefully
 */
export function useDailyHistoryAppend() {
  const { actor, isFetching, isReady } = useSafeActor();
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRunInitialCheck = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || !isReady) return;

    // Run initial check once on mount/refresh
    if (!hasRunInitialCheck.current) {
      hasRunInitialCheck.current = true;
      checkAndAppendHistoricalPoint();
    }

    // Schedule next 18:00 Europe/Oslo trigger
    scheduleNext18OOTrigger();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [actor, isFetching, isReady]);

  const checkAndAppendHistoricalPoint = async () => {
    if (!actor) {
      console.warn('[useDailyHistoryAppend] ⚠️ Actor not available, skipping daily check');
      return;
    }

    try {
      console.log('[useDailyHistoryAppend] 🔄 Checking if daily point needs to be appended...');
      await actor.checkAndAppendDailyHistoricalPoint();
      console.log('[useDailyHistoryAppend] ✅ Daily check complete');

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['caller-portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['historical-portfolio-data'] });
    } catch (error) {
      console.error('[useDailyHistoryAppend] ❌ Error checking/appending daily point:', error);
      // Don't throw - just log and continue
    }
  };

  const scheduleNext18OOTrigger = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const now = new Date();
    
    // Calculate next 18:00 Europe/Oslo (CET = UTC+1, CEST = UTC+2)
    // For simplicity, we use UTC+1 (CET) as the backend also uses this offset
    const osloOffset = 1 * 60; // minutes
    const localOffset = now.getTimezoneOffset(); // minutes from UTC (negative for east of UTC)
    const offsetDiff = osloOffset + localOffset; // total offset to apply

    // Get current time in Oslo
    const osloNow = new Date(now.getTime() + offsetDiff * 60 * 1000);
    
    // Calculate next 18:00 Oslo time
    let next18OO = new Date(osloNow);
    next18OO.setHours(18, 0, 0, 0);
    
    // If we've passed 18:00 today, schedule for tomorrow
    if (osloNow >= next18OO) {
      next18OO.setDate(next18OO.getDate() + 1);
    }

    // Convert back to local time
    const next18OOLocal = new Date(next18OO.getTime() - offsetDiff * 60 * 1000);
    const msUntil18OO = next18OOLocal.getTime() - now.getTime();

    console.log(
      `[useDailyHistoryAppend] ⏰ Scheduling next trigger at 18:00 Oslo time (${next18OOLocal.toLocaleString()}) - in ${Math.round(msUntil18OO / 1000 / 60)} minutes`
    );

    timerRef.current = setTimeout(() => {
      console.log('[useDailyHistoryAppend] 🕐 18:00 Oslo time reached, triggering daily append...');
      checkAndAppendHistoricalPoint();
      // Schedule next day's trigger
      scheduleNext18OOTrigger();
    }, msUntil18OO);
  };
}
