import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as path from 'path';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

// Cargar variables de entorno
config({ path: path.resolve(__dirname, '../../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function clearUsers() {
    console.log('🗑️  Limpiando usuarios de la base de datos...\n');

    try {
        // Borrar en orden por dependencias FK
        console.log('Borrando sesiones...');
        await db.delete(schema.sessions);

        console.log('Borrando cuentas...');
        await db.delete(schema.accounts);

        console.log('Borrando tokens de verificación...');
        await db.delete(schema.verification);

        console.log('Borrando usuarios...');
        const deletedUsers = await db.delete(schema.users);

        console.log('\n✅ Base de datos limpiada exitosamente!');
        console.log('📊 Ahora puedes registrar usuarios nuevamente.\n');

        // Mostrar estadísticas
        const userCount = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
        console.log('Usuarios actuales:', userCount[0].count);

    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

clearUsers();
