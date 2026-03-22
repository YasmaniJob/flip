
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { sql } from 'drizzle-orm';

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../.env.local') });

async function run() {
    console.log('Fixing Loans Schema...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool);

    try {
        await db.execute(sql`
            ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "damage_reports" jsonb;
            ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "suggestion_reports" jsonb;
            ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "missing_resources" jsonb;
        `);
        console.log('Successfully added columns to loans table');
    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        await pool.end();
    }
}

run();
