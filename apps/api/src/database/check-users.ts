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

async function checkUsers() {
    console.log('👥 Usuarios en la base de datos:\n');

    try {
        const users = await db.select().from(schema.users);

        if (users.length === 0) {
            console.log('✅ No hay usuarios registrados');
        } else {
            users.forEach((user, index) => {
                console.log(`Usuario ${index + 1}:`);
                console.log(`  Email: ${user.email}`);
                console.log(`  Name: ${user.name}`);
                console.log(`  Email Verified: ${user.emailVerified ? '✅ SÍ' : '❌ NO'}`);
                console.log(`  SuperAdmin: ${user.isSuperAdmin ? 'SÍ' : 'NO'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkUsers();
