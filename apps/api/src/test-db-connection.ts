import { db } from './database';
import * as schema from './database/schema';

async function test() {
    try {
        console.log('Testing connection...');
        const result = await db.select().from(schema.users).limit(1);
        console.log('✅ Connection to users table successful. Found:', result.length);
        
        const staffResult = await db.select().from(schema.staff).limit(1);
        console.log('✅ Connection to staff table successful. Found:', staffResult.length);
        
        console.log('✅ Database schema check passed.');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
    }
    process.exit(0);
}

test();
