
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/lib/db/schema';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const INSTITUTION_ID = 'f218daed-5b3f-47c1-ac55-371b56e9d449';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log('🚀 Iniciando adición de items al inventario...');

    const categories = await db.query.categories.findMany({
        where: (c, { eq }) => eq(c.institutionId, INSTITUTION_ID)
    });

    const mainEquipCat = categories.find(c => c.name === 'Equipos Portátiles')?.id;
    const peripheralsCat = categories.find(c => c.name === 'Periféricos')?.id;

    if (!mainEquipCat || !peripheralsCat) {
        console.error('❌ No se encontraron las categorías necesarias.');
        await pool.end();
        return;
    }

    const newItems = [
        { name: 'Pizarra Interactiva', icon: '📺', categoryId: mainEquipCat },
        { name: 'Cable HDMI', icon: '🔌', categoryId: peripheralsCat },
        { name: 'Cable de Poder', icon: '🔌', categoryId: peripheralsCat },
        { name: 'Cable de Corriente', icon: '⚡', categoryId: peripheralsCat },
        { name: 'Supresor de Picos / Regleta', icon: '🔌', categoryId: peripheralsCat },
        { name: 'Cable VGA', icon: '🔌', categoryId: peripheralsCat },
        { name: 'Cable de Red (Patch Cord)', icon: '🌐', categoryId: peripheralsCat },
        { name: 'Adaptador de Video', icon: '🔌', categoryId: peripheralsCat }
    ];

    for (const item of newItems) {
        // Check if template exists
        const existing = await db.query.resourceTemplates.findFirst({
            where: (t, { and, eq }) => and(
                eq(t.institutionId, INSTITUTION_ID),
                eq(t.name, item.name)
            )
        });

        if (existing) {
            console.log(`⏩ El item "${item.name}" ya existe.`);
            continue;
        }

        await db.insert(schema.resourceTemplates).values({
            id: uuidv4(),
            institutionId: INSTITUTION_ID,
            categoryId: item.categoryId,
            name: item.name,
            icon: item.icon,
            isDefault: false,
            sortOrder: 0
        });

        console.log(`✅ Item "${item.name}" agregado.`);
    }

    console.log('🎉 Proceso completado.');
    await pool.end();
}

main().catch(console.error);
