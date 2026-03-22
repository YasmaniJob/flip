import { db } from '../index';
import { categories } from '../schema';
import { randomUUID } from 'crypto';
import { DEFAULT_CATEGORIES } from '../../categories/constants/default-categories.const';

/**
 * Seed default categories for all institutions
 * Run with: pnpm tsx apps/api/src/database/seeds/seed-categories.ts
 * 
 * Note: This script is now primarily for seeding existing institutions.
 * New institutions automatically get categories via SeedDefaultCategoriesUseCase
 */

async function main() {
    console.log('🌱 Starting base categories seeding...\n');

    try {
        // Get all institutions
        const institutions = await db.query.institutions.findMany();

        if (institutions.length === 0) {
            console.error('❌ No institutions found. Please create at least one institution first.');
            process.exit(1);
        }

        let totalInserted = 0;

        for (const institution of institutions) {
            console.log(`📌 Seeding for institution: ${institution.name} (${institution.id})\n`);

            // Get existing categories for this institution
            const existing = await db.query.categories.findMany({
                where: (categories, { eq }) => eq(categories.institutionId, institution.id),
            });

            const existingNames = new Set(existing.map(c => c.name));
            let inserted = 0;

            for (const cat of DEFAULT_CATEGORIES) {
                if (existingNames.has(cat.name)) {
                    console.log(`   ⊘ ${cat.icon} ${cat.name} - ya existe`);
                    continue;
                }

                await db.insert(categories).values({
                    id: randomUUID(),
                    institutionId: institution.id,
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                });

                console.log(`   ✓ ${cat.icon} ${cat.name}`);
                inserted++;
            }

            console.log(`\n   Insertadas: ${inserted}/${DEFAULT_CATEGORIES.length}\n`);
            totalInserted += inserted;
        }

        console.log(`✅ Seed completed!`);
        console.log(`   Total insertedciones: ${institutions.length}`);
        console.log(`   Total categorías insertadas: ${totalInserted}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

main();
