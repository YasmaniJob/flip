/**
 * Simple Rate Limiting for Diagnostic Module
 * In-memory implementation (for production, consider Upstash Redis)
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const requestCounts = new Map<string, RateLimitRecord>();

// Clean up old records every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(ip);
    }
  }
}, 3600000); // 1 hour

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number;
}

/**
 * Simple rate limiter
 * @param ip IP address to rate limit
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns Rate limit result
 */
export function rateLimit(
  ip: string,
  maxRequests = 10,
  windowMs = 3600000 // 1 hour
): RateLimitResult {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetAt) {
    // New window
    const resetAt = now + windowMs;
    requestCounts.set(ip, { count: 1, resetAt });
    return {
      success: true,
      remaining: maxRequests - 1,
      limit: maxRequests,
      reset: resetAt,
    };
  }
  
  if (record.count >= maxRequests) {
    // Limit exceeded
    return {
      success: false,
      remaining: 0,
      limit: maxRequests,
      reset: record.resetAt,
    };
  }
  
  // Increment count
  record.count++;
  return {
    success: true,
    remaining: maxRequests - record.count,
    limit: maxRequests,
    reset: record.resetAt,
  };
}
