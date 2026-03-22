import { db } from '../index';
import { pedagogicalHours, institutions } from '../schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

/**
 * Seed default pedagogical hours for institutions
 * Run with: pnpm tsx apps/api/src/database/seeds/seed-hours.ts
 */

const DEFAULT_HOURS = [
    { name: '1ra Hora', startTime: '08:00', endTime: '08:45', isBreak: false, sortOrder: 1 },
    { name: '2da Hora', startTime: '08:45', endTime: '09:30', isBreak: false, sortOrder: 2 },
    { name: '3ra Hora', startTime: '09:30', endTime: '10:15', isBreak: false, sortOrder: 3 },
    { name: 'Recreo', startTime: '10:15', endTime: '10:30', isBreak: true, sortOrder: 4 },
    { name: '4ta Hora', startTime: '10:30', endTime: '11:15', isBreak: false, sortOrder: 5 },
    { name: '5ta Hora', startTime: '11:15', endTime: '12:00', isBreak: false, sortOrder: 6 },
];

async function main() {
    console.log('⏰ Starting pedagogical hours seeding...\n');

    try {
        // Get all institutions
        const allInstitutions = await db.query.institutions.findMany();

        if (allInstitutions.length === 0) {
            console.error('❌ No institutions found. Please seed institutions first.');
            process.exit(1);
        }

        let totalInserted = 0;

        for (const institution of allInstitutions) {
            console.log(`📌 Checking hours for: ${institution.name}`);

            // Check if hours already exist
            const existing = await db.query.pedagogicalHours.findMany({
                where: (hours, { eq }) => eq(hours.institutionId, institution.id),
            });

            if (existing.length > 0) {
                console.log(`   ⚠️ Already has ${existing.length} hours configured. Skipping.`);
                continue;
            }

            console.log(`   ✨ Seeding default hours...`);

            const values = DEFAULT_HOURS.map(h => ({
                id: randomUUID(),
                institutionId: institution.id,
                name: h.name,
                startTime: h.startTime,
                endTime: h.endTime,
                sortOrder: h.sortOrder,
                isBreak: h.isBreak,
                active: true,
            }));

            await db.insert(pedagogicalHours).values(values);
            totalInserted += values.length;
            console.log(`   ✅ Added ${values.length} hours`);
        }

        console.log(`\n🎉 Seed completed! Total hours inserted: ${totalInserted}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

main();
