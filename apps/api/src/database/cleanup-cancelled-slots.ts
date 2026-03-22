
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { eq, inArray } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function cleanup() {
    console.log('Cleaning up cancelled slots...');

    try {
        // Find cancelled reservations
        const cancelledReservations = await db.select({ id: schema.classroomReservations.id })
            .from(schema.classroomReservations)
            .where(eq(schema.classroomReservations.status, 'cancelled'));

        const cancelledIds = cancelledReservations.map(r => r.id);

        if (cancelledIds.length > 0) {
            console.log(`Found ${cancelledIds.length} cancelled reservations. Deleting their slots...`);
            const result = await db.delete(schema.reservationSlots)
                .where(inArray(schema.reservationSlots.reservationId, cancelledIds))
                .returning();
            console.log(`Deleted ${result.length} slots.`);
        } else {
            console.log('No cancelled reservations found.');
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await pool.end();
    }
}

cleanup().catch(console.error);
