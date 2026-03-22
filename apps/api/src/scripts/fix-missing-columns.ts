import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env.local') });
dotenv.config({ path: join(__dirname, '../../.env') });

async function run() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Adding settings column to users...');
        await pool.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings" jsonb;');
        console.log('✅ settings column added/verified in users table.');

        console.log('Adding settings column to institutions...');
        await pool.query('ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "settings" jsonb;');
        console.log('✅ settings column added/verified in institutions table.');

    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await pool.end();
    }
}

run();
