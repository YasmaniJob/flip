
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function checkData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query('SELECT count(*) FROM education_institutions_minedu');
        console.log('Total records in education_institutions_minedu:', res.rows[0].count);

        if (parseInt(res.rows[0].count) > 0) {
            const sample = await client.query('SELECT departamento, provincia, distrito FROM education_institutions_minedu LIMIT 3');
            console.log('Sample data:', sample.rows);
        }
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

checkData();
