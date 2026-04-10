/**
 * Trial Configuration Helper
 * 
 * Provides functions to read the global trial period configuration
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG_FILE_PATH = join(process.cwd(), '.trial-config.json');

interface TrialConfig {
  trialDays: number;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Get the configured trial days
 * Returns 15 days if no configuration exists
 */
export function getTrialDays(): number {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const data = readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const config: TrialConfig = JSON.parse(data);
      return config.trialDays || 15;
    }
  } catch (error) {
    console.error('Error reading trial config, using default:', error);
  }
  
  // Default to 15 days
  return 15;
}

/**
 * Get the full trial configuration
 */
export function getTrialConfig(): TrialConfig {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const data = readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading trial config:', error);
  }
  
  return {
    trialDays: 15,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}
