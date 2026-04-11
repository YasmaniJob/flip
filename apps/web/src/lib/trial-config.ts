/**
 * Trial Configuration Helper
 * 
 * Provides functions to read the global trial period configuration from database
 */

import { db } from '@/lib/db';
import { globalConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const TRIAL_DAYS_KEY = 'trial_days';
const DEFAULT_TRIAL_DAYS = 15;

interface TrialConfig {
  trialDays: number;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Get the configured trial days from database
 * Returns 15 days if no configuration exists
 */
export async function getTrialDays(): Promise<number> {
  try {
    const config = await db
      .select()
      .from(globalConfig)
      .where(eq(globalConfig.key, TRIAL_DAYS_KEY))
      .limit(1);

    if (config.length > 0) {
      const data = JSON.parse(config[0].value);
      return data.trialDays || DEFAULT_TRIAL_DAYS;
    }
  } catch (error) {
    console.error('Error reading trial config from DB, using default:', error);
  }
  
  return DEFAULT_TRIAL_DAYS;
}

/**
 * Get the full trial configuration from database
 */
export async function getTrialConfig(): Promise<TrialConfig> {
  try {
    const config = await db
      .select()
      .from(globalConfig)
      .where(eq(globalConfig.key, TRIAL_DAYS_KEY))
      .limit(1);

    if (config.length > 0) {
      const data = JSON.parse(config[0].value);
      return {
        trialDays: data.trialDays || DEFAULT_TRIAL_DAYS,
        updatedAt: config[0].updatedAt?.toISOString() || new Date().toISOString(),
        updatedBy: config[0].updatedBy || 'system',
      };
    }
  } catch (error) {
    console.error('Error reading trial config from DB:', error);
  }
  
  return {
    trialDays: DEFAULT_TRIAL_DAYS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}

/**
 * Set the trial days configuration in database
 */
export async function setTrialDays(trialDays: number, updatedBy: string): Promise<void> {
  const configData = {
    trialDays,
  };

  const existingConfig = await db
    .select()
    .from(globalConfig)
    .where(eq(globalConfig.key, TRIAL_DAYS_KEY))
    .limit(1);

  if (existingConfig.length > 0) {
    // Update existing
    await db
      .update(globalConfig)
      .set({
        value: JSON.stringify(configData),
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(globalConfig.key, TRIAL_DAYS_KEY));
  } else {
    // Insert new
    await db.insert(globalConfig).values({
      id: crypto.randomUUID(),
      key: TRIAL_DAYS_KEY,
      value: JSON.stringify(configData),
      updatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
