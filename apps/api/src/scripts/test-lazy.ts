import { db } from '../database';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../auth/auth';
import { randomUUID } from 'crypto';

async function run() {
    const testEmail = 'profesora.prueba@escuela.edu.pe';
    const testDni = '88888888';
    const testInstitutionId = 'test-inst-uuid';

    console.log('--- TEST LAZY REGISTRATION ---');

    console.log('1. Cleaning up previous test data...');
    // Delete dependencies first
    const existingUsers = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, testEmail));
    if (existingUsers.length > 0) {
        for (const u of existingUsers) {
            await db.delete(schema.accounts).where(eq(schema.accounts.userId, u.id));
            await db.delete(schema.sessions).where(eq(schema.sessions.userId, u.id));
        }
    }
    await db.delete(schema.users).where(eq(schema.users.email, testEmail));
    await db.delete(schema.staff).where(eq(schema.staff.email, testEmail));

    // Check if test institution exists, create if not
    const [inst] = await db.select().from(schema.institutions).limit(1);
    const instId = inst ? inst.id : testInstitutionId;

    if (!inst) {
        await db.insert(schema.institutions).values({
            id: instId,
            name: 'Institución de Prueba',
            slug: 'test-inst',
        });
    }

    console.log(`2. Inserting staff record for ${testEmail} with DNI ${testDni}`);
    await db.insert(schema.staff).values({
        id: randomUUID(),
        institutionId: instId,
        name: 'Profesora Prueba',
        dni: testDni,
        email: testEmail,
        role: 'docente',
        status: 'active'
    });

    console.log('3. Triggering Login Request (Simulating frontend signIn)...');

    // Rather than HTTP, let's just simulate what the hook does since we are in a pure TS script
    // Or we can just try to run auth.api.signUpEmail directly as the hook would do to verify it works
    // and doesn't throw.

    try {
        console.log('Checking user existence initially...');
        const [userBefore] = await db.select().from(schema.users).where(eq(schema.users.email, testEmail));
        console.log('User before login:', userBefore ? 'Exists' : 'Does not exist (Correct)');

        console.log('Calling auth.api.signUpEmail manually (like the hook does)...');
        await auth.api.signUpEmail({
            body: {
                email: testEmail,
                password: testDni,
                name: 'Profesora Prueba',
                institutionId: instId,
                role: 'docente' // Custom field from schema
            }
        });

        console.log('Checking user existence AFTER login...');
        const [userAfter] = await db.select().from(schema.users).where(eq(schema.users.email, testEmail));
        if (userAfter) {
            console.log('✅ User successfully created by Better Auth! DB ID:', userAfter.id);
        } else {
            console.log('❌ User was NOT created.');
        }

    } catch (err) {
        console.error('❌ Error during simulated login/signup:', err);
    }

    process.exit(0);
}

run();
