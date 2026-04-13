// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

/**
 * Initialize trial configuration in database
 * Sets default trial period to 15 days
 */

import { db } from '../src/lib/db';
import { globalConfig } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function initTrialConfig() {
  console.log('🔧 Initializing trial configuration...');

  try {
    // Check if config already exists
    const existing = await db
      .select()
      .from(globalConfig)
      .where(eq(globalConfig.key, 'trial_days'))
      .limit(1);

    if (existing.length > 0) {
      console.log('✅ Trial configuration already exists:', existing[0]);
      return;
    }

    // Insert default configuration
    await db.insert(globalConfig).values({
      id: crypto.randomUUID(),
      key: 'trial_days',
      value: JSON.stringify({ trialDays: 15 }),
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Trial configuration initialized with 15 days');
  } catch (error) {
    console.error('❌ Error initializing trial config:', error);
    throw error;
  }
}

initTrialConfig()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
