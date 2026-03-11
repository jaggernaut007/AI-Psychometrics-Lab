/**
 * In-memory sliding window rate limiter for API v1 endpoints.
 * Uses a simple counter-based approach with automatic cleanup of expired windows.
 *
 * @author Shreyas Jagannath
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_MAX_REQUESTS = 60;
const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const MAX_TRACKED_KEYS = 10_000; // Prevent unbounded Map growth

const windows = new Map<string, WindowEntry>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic cleanup of expired windows.
 * Called automatically on first use.
 */
function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows) {
      if (now >= entry.resetAt) {
        windows.delete(key);
      }
    }
  }, 60_000);

  // Allow the process to exit even if the timer is still running
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check and consume a rate limit token for the given key.
 *
 * @param key - Identifier for the rate limit bucket (e.g., IP address or "global")
 * @param maxRequests - Maximum requests allowed per window (default: 60)
 * @param windowMs - Window duration in milliseconds (default: 60000)
 * @returns RateLimitResult with allowed status, remaining tokens, and reset timestamp
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  let entry = windows.get(key);

  // Window expired or doesn't exist — start a new one
  if (!entry || now >= entry.resetAt) {
    // Evict expired entries if approaching capacity
    if (!entry && windows.size >= MAX_TRACKED_KEYS) {
      for (const [k, v] of windows) {
        if (now >= v.resetAt) windows.delete(k);
      }
    }
    // If still at capacity after cleanup, reject to prevent memory exhaustion
    if (!entry && windows.size >= MAX_TRACKED_KEYS) {
      return { allowed: false, remaining: 0, resetAt: now + windowMs };
    }
    entry = { count: 0, resetAt: now + windowMs };
    windows.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset all rate limit windows. Useful for testing.
 */
export function resetRateLimiter(): void {
  windows.clear();
}
