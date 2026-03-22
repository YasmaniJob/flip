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

async function checkCategories() {
    console.log('📦 Categorías en la base de datos:\n');

    try {
        const categories = await db.select().from(schema.categories);

        if (categories.length === 0) {
            console.log('❌ No hay categorías registradas');
        } else {
            console.log(`✅ Total de categorías: ${categories.length}\n`);
            categories.forEach((cat, index) => {
                console.log(`Categoría ${index + 1}:`);
                console.log(`  ID: ${cat.id}`);
                console.log(`  Nombre: ${cat.name}`);
                console.log(`  Institution ID: ${cat.institutionId}`);
                console.log(`  Icon: ${cat.icon || 'N/A'}`);
                console.log(`  Color: ${cat.color || 'N/A'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkCategories();
