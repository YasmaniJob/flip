
import { Client } from 'pg';

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/flip_v2',
});

async function run() {
    await client.connect();
    try {
        const res = await client.query(`
            SELECT id, damage_reports, suggestion_reports 
            FROM loans 
            WHERE damage_reports IS NOT NULL OR suggestion_reports IS NOT NULL
            ORDER BY loan_date DESC 
            LIMIT 1;
        `);

        if (res.rows.length === 0) {
            console.log("No loans with reports found.");
        } else {
            console.log("Last Loan Report Structure:");
            console.log(JSON.stringify(res.rows[0], null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
