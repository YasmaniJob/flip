
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function checkTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        if (res.rows.length === 0) {
            console.log('No tables found in the database.');
        } else {
            console.log('Tables found:', res.rows.map(row => row.table_name).join(', '));
        }
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

checkTables();
