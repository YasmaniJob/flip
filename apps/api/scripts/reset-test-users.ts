import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from '../src/database/schema';

// Cargar variables de entorno (asumiendo que estás corriendo esto desde apps/api)
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function resetUsersAndInstitutions() {
    console.log('--- Iniciando limpieza de base de datos para pruebas ---');
    try {
        // En Drizzle, necesitamos vaciar las tablas que dependen de session / usuario / institución

        // Opcional: Eliminar primero las sesiones activas (si usaste Better-Auth, la tabla es "session")
        await db.delete(schema.session);
        console.log('✅ Sesiones eliminadas');

        // Eliminar las cuentas (accounts en Better Auth)
        await db.delete(schema.account);
        console.log('✅ Cuentas de Better Auth eliminadas');

        // Eliminar usuarios (users)
        await db.delete(schema.users);
        console.log('✅ Usuarios principales eliminados');

        // Eliminar también las instituciones si quieres hacer una prueba limpia 
        // porque si el colegio ya existe en DB, el segundo intento sería "admin".
        await db.delete(schema.institutions);
        console.log('✅ Instituciones creadas por usuarios eliminadas');

        console.log('--- Limpieza completada con éxito. Ya puedes crear un usuario "nuevo" ---');
    } catch (e) {
        console.error('Error al limpiar la base de datos:', e);
    } finally {
        await pool.end();
    }
}

resetUsersAndInstitutions();
