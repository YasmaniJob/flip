
import { Client } from 'pg';

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/flip_v2',
});

async function run() {
    await client.connect();
    try {
        console.log("Adding maintenance_progress...");
        await client.query(`
            ALTER TABLE resources 
            ADD COLUMN IF NOT EXISTS maintenance_progress integer DEFAULT 0;
        `);
        console.log("Added maintenance_progress (IF NOT EXISTS)");

        console.log("Adding maintenance_state...");
        await client.query(`
            ALTER TABLE resources 
            ADD COLUMN IF NOT EXISTS maintenance_state jsonb;
        `);
        console.log("Added maintenance_state (IF NOT EXISTS)");
    } catch (e) {
        console.error("Error executing queries:", e);
    } finally {
        await client.end();
    }
}

run();
