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

async function revertInstitutionAssignment() {
    const userId = '3b0mrzWTJ1SFYudOpsGQmA7adP36rpB2'; // Yasmani's user ID

    console.log('🔄 Revirtiendo asignación manual de institución...\n');

    try {
        await db
            .update(schema.users)
            .set({ institutionId: null })
            .where(eq(schema.users.id, userId));

        console.log('✅ Asignación revertida correctamente');
        console.log('   El usuario ahora debe completar el onboarding apropiadamente\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

revertInstitutionAssignment();
