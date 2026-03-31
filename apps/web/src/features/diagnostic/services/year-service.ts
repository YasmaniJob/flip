/**
 * Year Detection Service
 * 
 * Provides year detection and validation for the diagnostic annual periodization system.
 * This service handles automatic year detection, validation, and extraction of available years.
 * 
 * @module YearService
 */

import type { DiagnosticSession } from '../types';

/**
 * Get the current calendar year
 * 
 * @returns The current year (e.g., 2026)
 * 
 * @example
 * const year = getCurrentYear(); // 2026
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Validate if a year is within the acceptable range
 * 
 * Valid years must be:
 * - Greater than or equal to 2025 (system start year)
 * - Less than or equal to current year + 1 (allow next year planning)
 * 
 * @param year - The year to validate
 * @returns true if the year is valid, false otherwise
 * 
 * @example
 * isValidYear(2025); // true
 * isValidYear(2024); // false (before system start)
 * isValidYear(2030); // false (too far in future)
 */
export function isValidYear(year: number): boolean {
  const currentYear = getCurrentYear();
  return year >= 2025 && year <= currentYear + 1;
}

/**
 * Extract unique years from diagnostic sessions, sorted in descending order
 * 
 * @param sessions - Array of diagnostic sessions
 * @returns Array of unique years sorted DESC (most recent first)
 * 
 * @example
 * const sessions = [
 *   { year: 2027, ... },
 *   { year: 2026, ... },
 *   { year: 2027, ... }, // duplicate
 *   { year: 2025, ... }
 * ];
 * getAvailableYears(sessions); // [2027, 2026, 2025]
 */
export function getAvailableYears(sessions: Pick<DiagnosticSession, 'year'>[]): number[] {
  const uniqueYears = new Set(sessions.map(session => session.year));
  return Array.from(uniqueYears).sort((a, b) => b - a);
}

/**
 * Optional: Cached year with daily invalidation
 * This cache helps avoid repeated Date() calls in high-traffic scenarios
 */
let cachedYear: number | null = null;
let cacheDate: Date | null = null;

/**
 * Get current year with optional caching
 * Cache is invalidated daily to ensure accuracy across year boundaries
 * 
 * @returns The current year
 */
export function getCurrentYearCached(): number {
  const now = new Date();
  
  // Invalidate cache if the date has changed
  if (cacheDate && cacheDate.getDate() !== now.getDate()) {
    cachedYear = null;
  }
  
  if (!cachedYear) {
    cachedYear = now.getFullYear();
    cacheDate = now;
  }
  
  return cachedYear;
}
