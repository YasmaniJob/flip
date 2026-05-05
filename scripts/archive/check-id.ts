import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./apps/api/src/database/schema";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/flip",
});

const db = drizzle(pool, { schema });

async function main() {
    const id = "3b0mrzWTJ1SFYudOpsGQmA7adP36rpB2";
    console.log("Checking for ID:", id);

    const users = await db.query.users.findMany({
        where: (u, { eq }) => eq(u.id, id),
    });
    console.log("Users found:", users.length);
    if (users.length > 0) console.log(users);

    const staff = await db.query.staff.findMany({
        where: (s, { eq }) => eq(s.id, id),
    });
    console.log("Staff found:", staff.length);
    if (staff.length > 0) console.log(staff);

    // Let's also run the exact same logic as staff.service.ts
    // with some institutionId that this user belongs to
    if (users.length > 0) {
        const instId = users[0].institutionId;
        const staffData = await db.query.staff.findMany({
            where: (s, { eq }) => eq(s.institutionId, instId),
        });

        const admins = await db.query.users.findMany({
            where: (u, { eq, and, or }) => and(
                eq(u.institutionId, instId),
                or(eq(u.role, 'admin'), eq(u.isSuperAdmin, true))
            ),
        });

        console.log("Institution staff count:", staffData.length);
        console.log("Institution admins count:", admins.length);

        const mappedAdmins = admins.map(u => ({
            id: u.id,
            email: u.email
        }));

        const staffIds = new Set(staffData.map(s => s.id));
        const uniqueAdmins = mappedAdmins.filter(a => !staffIds.has(a.id));

        console.log("Unique admins count:", uniqueAdmins.length);
        console.log("Are there duplicates if we combine uniqueAdmins and staffData?");
        const combined = [...uniqueAdmins, ...staffData];
        const combinedIds = combined.map(c => c.id);
        const uniqueCombinedIds = new Set(combinedIds);
        console.log("Combined count:", combined.length);
        console.log("Unique combined count:", uniqueCombinedIds.size);
    }

    process.exit(0);
}

main().catch(console.error);
