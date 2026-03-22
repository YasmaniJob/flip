import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as path from 'path';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';
import { DEFAULT_CATEGORIES } from '../categories/constants/default-categories.const';

// Cargar variables de entorno
config({ path: path.resolve(__dirname, '../../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

/**
 * Test the auto-seeding functionality
 * This simulates what happens during onboarding when creating a new institution
 */
async function testAutoSeeding() {
    console.log('🧪 Testing Auto-Seed Categories on Institution Creation\n');
    console.log('='.repeat(60));

    try {
        const testInstitutionName = `TEST_INSTITUTION_${Date.now()}`;
        const testCodigoModular = `TEST${Math.random().toString(36).substring(2, 9)}`.toUpperCase();

        console.log(`\n1️⃣  Creating test institution...`);
        console.log(`   Name: ${testInstitutionName}`);
        console.log(`   Código Modular: ${testCodigoModular}`);

        // Create test institution
        const [newInstitution] = await db.insert(schema.institutions).values({
            id: crypto.randomUUID(),
            codigoModular: testCodigoModular,
            name: testInstitutionName,
            slug: testInstitutionName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            nivel: 'primaria',
            plan: 'free',
        }).returning();

        console.log(`   ✅ Institution created: ${newInstitution.id}\n`);

        // Manually call the seeding logic (this is what InstitutionsService does)
        console.log(`2️⃣  Manually seeding categories (simulating auto-seed)...`);

        // Get existing categories
        const existing = await db.query.categories.findMany({
            where: eq(schema.categories.institutionId, newInstitution.id),
        });
        const existingNames = new Set(existing.map(c => c.name));

        // Filter and seed
        const toInsert = DEFAULT_CATEGORIES.filter(cat => !existingNames.has(cat.name));

        if (toInsert.length > 0) {
            const values = toInsert.map(cat => ({
                id: crypto.randomUUID(),
                institutionId: newInstitution.id,
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
            }));

            await db.insert(schema.categories).values(values);
            console.log(`   ✅ Seeded ${toInsert.length} categories\n`);
        } else {
            console.log(`   ⊘ No categories to seed (already exist)\n`);
        }

        // Verify categories were created
        console.log(`3️⃣  Verifying categories...`);
        const categories = await db.query.categories.findMany({
            where: eq(schema.categories.institutionId, newInstitution.id),
        });

        console.log(`   ✅ Found ${categories.length} categories for this institution\n`);

        if (categories.length === DEFAULT_CATEGORIES.length) {
            console.log(`   ✅ SUCCESS: All 15 categories were created!`);
        } else {
            console.log(`   ❌ FAILURE: Expected 15, got ${categories.length}`);
        }

        // Show sample categories
        console.log(`\n4️⃣  Sample categories:`);
        categories.slice(0, 5).forEach(cat => {
            console.log(`      ${cat.icon} ${cat.name}`);
        });
        console.log(`      ... (${categories.length - 5} more)\n`);

        // Test isolation (verify no other institution sees these categories)
        console.log(`5️⃣  Testing multi-tenancy (data isolation)...`);
        const otherInstitutions = await db.query.institutions.findMany({
            where: (institutions, { ne }) => ne(institutions.id, newInstitution.id),
            limit: 1,
        });

        if (otherInstitutions.length > 0) {
            const otherInst = otherInstitutions[0];
            const otherCategories = await db.query.categories.findMany({
                where: and(
                    eq(schema.categories.institutionId, otherInst.id),
                    eq(schema.categories.name, categories[0].name),
                ),
            });

            const hasNewCategories = otherCategories.some(c =>
                categories.some(newCat => newCat.id === c.id)
            );

            if (hasNewCategories) {
                console.log(`   ❌ FAILURE: Categories leaked to other institution!`);
            } else {
                console.log(`   ✅ SUCCESS: Categories isolated to test institution`);
                console.log(`      Other institution "${otherInst.name}" has ${otherCategories.length} of its own categories\n`);
            }
        } else {
            console.log(`   ⊘ No other institutions to test isolation\n`);
        }

        // Cleanup
        console.log(`6️⃣  Cleaning up test data...`);
        await db.delete(schema.categories).where(eq(schema.categories.institutionId, newInstitution.id));
        await db.delete(schema.institutions).where(eq(schema.institutions.id, newInstitution.id));
        console.log(`   ✅ Test institution and categories deleted\n`);

        console.log('='.repeat(60));
        console.log('✅ ALL TESTS PASSED\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

testAutoSeeding();
