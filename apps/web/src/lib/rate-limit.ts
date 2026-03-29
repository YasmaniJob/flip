import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number[]>({ max: 500 });

/**
 * Basic in-memory rate limiting.
 * @param identifier Unique key (e.g. user ID, IP)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns boolean true if allowed, false if rate limited
 */
export function rateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const requests = (cache.get(identifier) || []).filter(t => t > windowStart);
  
  if (requests.length >= limit) return false;
  
  requests.push(now);
  cache.set(identifier, requests);
  return true;
}
