
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as path from 'path';
import * as schema from '../src/database/schema';
import { eq, inArray, or } from 'drizzle-orm';

// Load env vars
const envPath = path.join(process.cwd(), 'apps/api/.env');
config({ path: envPath });

if (!process.env.DATABASE_URL) {
    // Try .env.local
    const localEnvPath = path.join(process.cwd(), 'apps/api/.env.local');
    config({ path: localEnvPath });
}

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found.');
    process.exit(1);
}

console.log('✅ Loaded DB URL');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function fixResourceStatus() {
    console.log('🔧 Starting Resource Status Sync...');

    try {
        // 1. Get all active or overdue loans
        const activeLoans = await db.query.loans.findMany({
            where: or(
                eq(schema.loans.status, 'active'),
                eq(schema.loans.status, 'overdue')
            ),
            with: {
                loanResources: true
            }
        });

        console.log(`Found ${activeLoans.length} active/overdue loans.`);

        // 2. Collect all resource IDs that SHOULD be 'prestado' in a flat array
        // Use a Set to avoid duplicates if data is weird
        const resourcesOnLoan = new Set<string>();

        activeLoans.forEach(loan => {
            loan.loanResources.forEach(lr => {
                resourcesOnLoan.add(lr.resourceId);
            });
        });

        const idsToUpdate = Array.from(resourcesOnLoan);
        console.log(`Identified ${idsToUpdate.length} resources that should be 'prestado'.`);

        if (idsToUpdate.length > 0) {
            // 3. Bulk update those resources to 'prestado'
            const result = await db.update(schema.resources)
                .set({ status: 'prestado' })
                .where(inArray(schema.resources.id, idsToUpdate))
                .returning();

            console.log(`✅ Updated ${result.length} resources to 'prestado'.`);

            // Log details
            result.forEach(r => {
                console.log(`   - ${r.name} (${r.internalId}) -> prestado`);
            });
        } else {
            console.log('✨ No resources need updating.');
        }

    } catch (error) {
        console.error('❌ Error fixing statuses:', error);
    } finally {
        await pool.end();
    }
}

fixResourceStatus();
