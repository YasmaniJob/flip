
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
dotenv.config({ path: '../../.env.local' });

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'resources';
        `);
        console.log("Columns in resources table:");
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    } catch (e) {
        console.error("Error querying schema:", e);
    } finally {
        await client.end();
    }
}

check();
