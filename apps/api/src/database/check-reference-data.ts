
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function check() {
    console.log('Checking DB data...');

    const staffCount = await db.select().from(schema.staff).limit(5);
    console.log(`Staff found: ${staffCount.length}`, staffCount.map(s => ({ id: s.id, name: s.name })));

    const gradesCount = await db.select().from(schema.grades).limit(5);
    console.log(`Grades found: ${gradesCount.length}`, gradesCount.map(g => ({ id: g.id, name: g.name })));

    const sectionsCount = await db.select().from(schema.sections).limit(5);
    console.log(`Sections found: ${sectionsCount.length}`);

    const hoursCount = await db.select().from(schema.pedagogicalHours).limit(5);
    console.log(`Pedagogical Hours found: ${hoursCount.length}`);

    await pool.end();
}

check().catch(console.error);
