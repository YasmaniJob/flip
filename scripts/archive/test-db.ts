import { db } from './apps/api/src/database';
import * as schema from './apps/api/src/database/schema';
import { sql } from 'drizzle-orm';

async function test() {
    try {
        const email = 'yasmanijguillen@gmail.com';
        const password = 'test';
        console.log("Testing users query...");
        const [user] = await db.select()
            .from(schema.users)
            .where(sql`${schema.users.email} = ${email}`)
            .limit(1);
        console.log("User:", user);

        console.log("Testing staff query...");
        const [staff] = await db.select()
            .from(schema.staff)
            .where(
                sql`${schema.staff.email} = ${email} AND ${schema.staff.dni} = ${password}`
            )
            .limit(1);
        console.log("Staff:", staff);

    } catch (e) {
        console.error("DB Error:", e);
    }
    process.exit(0);
}

test();
