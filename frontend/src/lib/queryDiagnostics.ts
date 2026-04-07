/**
 * Lightweight diagnostics helper for React Query invalidation/refetch attribution.
 * Provides de-duplicated, clearly labeled console logs for debugging query behavior.
 */

interface DiagnosticEvent {
  reason: string;
  timestamp: number;
  count: number;
}

const eventLog = new Map<string, DiagnosticEvent>();
const THROTTLE_MS = 5000; // Only log same event once per 5 seconds

/**
 * Log a query invalidation/refetch event with automatic de-duplication.
 * Same reason will only be logged once per THROTTLE_MS period.
 */
export function logQueryEvent(reason: string, details?: Record<string, unknown>): void {
  const now = Date.now();
  const existing = eventLog.get(reason);

  if (existing && now - existing.timestamp < THROTTLE_MS) {
    // Update count but don't log again
    existing.count++;
    return;
  }

  // Log the event
  const event: DiagnosticEvent = {
    reason,
    timestamp: now,
    count: existing ? existing.count + 1 : 1,
  };

  eventLog.set(reason, event);

  const prefix = '[QueryDiagnostics]';
  const countSuffix = event.count > 1 ? ` (×${event.count})` : '';
  
  if (details && Object.keys(details).length > 0) {
    console.log(`${prefix} ${reason}${countSuffix}`, details);
  } else {
    console.log(`${prefix} ${reason}${countSuffix}`);
  }
}

/**
 * Clear all diagnostic event history.
 * Useful for testing or when starting a new session.
 */
export function clearDiagnostics(): void {
  eventLog.clear();
}

/**
 * Get a summary of all logged events.
 * Useful for debugging or analytics.
 */
export function getDiagnosticsSummary(): Record<string, { count: number; lastSeen: number }> {
  const summary: Record<string, { count: number; lastSeen: number }> = {};
  
  for (const [reason, event] of eventLog.entries()) {
    summary[reason] = {
      count: event.count,
      lastSeen: event.timestamp,
    };
  }
  
  return summary;
}
