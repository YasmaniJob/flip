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

async function checkInstitutions() {
    console.log('🏫 Instituciones en la base de datos:\n');

    try {
        const institutions = await db.select().from(schema.institutions);

        if (institutions.length === 0) {
            console.log('❌ No hay instituciones registradas');
        } else {
            console.log(`✅ Total de instituciones: ${institutions.length}\n`);
            institutions.forEach((inst, index) => {
                console.log(`Institución ${index + 1}:`);
                console.log(`  ID: ${inst.id}`);
                console.log(`  Nombre: ${inst.name}`);
                console.log(`  Código Modular: ${inst.codigoModular || 'N/A'}`);
                console.log(`  Nivel: ${inst.nivel || 'N/A'}`);
                console.log(`  Slug: ${inst.slug}`);
                console.log(`  Plan: ${inst.plan}`);
                console.log(`  Is Platform Owner: ${inst.isPlatformOwner ? 'SÍ' : 'NO'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkInstitutions();
