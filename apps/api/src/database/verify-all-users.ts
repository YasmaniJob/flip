import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as path from 'path';
import * as schema from './schema';

// Cargar variables de entorno
config({ path: path.resolve(__dirname, '../../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function verifyAllUsers() {
    console.log('✅ Marcando todos los usuarios como verificados...\n');

    try {
        const result = await db
            .update(schema.users)
            .set({ emailVerified: true })
            .returning();

        console.log(`✅ ${result.length} usuarios actualizados:\n`);

        result.forEach((user) => {
            console.log(`  - ${user.email} → Email Verified: ✅`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

verifyAllUsers();
