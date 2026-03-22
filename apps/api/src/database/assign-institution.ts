import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as path from 'path';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

// Cargar variables de entorno
config({ path: path.resolve(__dirname, '../../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function assignInstitution() {
    const userId = '3b0mrzWTJ1SFYudOpsGQmA7adP36rpB2'; // Yasmani's user ID
    const institutionId = 'a8a41ed9-021e-4a43-a3ab-3a6ff836bee6'; // Institution with categories

    console.log('🔗 Asignando institución al usuario...\n');

    try {
        await db
            .update(schema.users)
            .set({ institutionId })
            .where(eq(schema.users.id, userId));

        console.log('✅ Institución asignada correctamente!');
        console.log(`   Usuario ID: ${userId}`);
        console.log(`   Institución: 40238 NUESTRA SEÑORA DEL CARMEN`);
        console.log(`   Institution ID: ${institutionId}`);
        console.log('\n📦 Ahora deberías poder ver las 45 categorías en el inventario.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

assignInstitution();
