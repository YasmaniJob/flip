
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../database/schema';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env from apps/api/.env and .env.local
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../.env.local') });

console.log('DB URL defined:', !!process.env.DATABASE_URL);

async function run() {
    console.log('Testing DB connection...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    try {
        console.log('Querying users...');
        const users = await db.query.users.findMany({ limit: 1 });
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('First user:', users[0]);

            console.log('Querying accounts for user...');
            const accounts = await db.query.accounts.findMany({
                where: (accounts, { eq }) => eq(accounts.userId, users[0].id)
            });
            console.log('Accounts found:', accounts.length);
            if (accounts.length > 0) {
                console.log('Provider:', accounts[0].providerId);
                console.log('Password exists:', !!accounts[0].password);
            }
        }

        console.log('DB Connection successful!');
    } catch (error) {
        console.error('DB Error:', error);
    } finally {
        await pool.end();
    }
}

run();
