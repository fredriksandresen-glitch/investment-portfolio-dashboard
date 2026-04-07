/**
 * Utility for building React Query keys that are safe for JSON serialization.
 * React Query internally uses JSON.stringify on queryKey arrays, which fails on BigInt.
 * 
 * This module provides helpers to normalize values (especially BigInt → string)
 * and optionally validate keys in development.
 */

/**
 * Convert a value to a JSON-serializable primitive.
 * - BigInt → string
 * - Date → ISO string
 * - null/undefined → null
 * - Objects/Arrays → throw error (use primitives only in query keys)
 */
export function toPrimitive(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'bigint') {
    return value.toString();
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  // In development, throw on objects/arrays to catch mistakes early
  if (process.env.NODE_ENV === 'development') {
    if (typeof value === 'object') {
      throw new Error(
        `[reactQueryKey] Query keys must contain only primitives. Received: ${JSON.stringify(value)}`
      );
    }
  }
  
  // In production, convert to string as fallback
  return String(value);
}

/**
 * Build a query key array with all values normalized to JSON-serializable primitives.
 * 
 * @example
 * buildQueryKey('portfolio', { lastModified: BigInt(123), rate: 9.96 })
 * // Returns: ['portfolio', '123', 9.96]
 */
export function buildQueryKey(...parts: unknown[]): (string | number | boolean | null)[] {
  const normalized: (string | number | boolean | null)[] = [];
  
  for (const part of parts) {
    if (Array.isArray(part)) {
      // Flatten arrays
      normalized.push(...part.map(toPrimitive));
    } else if (part && typeof part === 'object' && !(part instanceof Date)) {
      // Extract primitive values from objects
      const obj = part as Record<string, unknown>;
      for (const key of Object.keys(obj).sort()) {
        normalized.push(key, toPrimitive(obj[key]));
      }
    } else {
      normalized.push(toPrimitive(part));
    }
  }
  
  return normalized;
}

/**
 * Assert that a query key is safe for JSON serialization (development only).
 * Throws if the key contains BigInt or non-primitive values.
 */
export function assertSafeQueryKey(queryKey: unknown[]): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  try {
    JSON.stringify(queryKey);
  } catch (error) {
    console.error('[reactQueryKey] Unsafe query key detected:', queryKey);
    throw new Error(
      `[reactQueryKey] Query key contains non-serializable values (likely BigInt). Use buildQueryKey() or toPrimitive().`
    );
  }
}
