/**
 * Fix Superadmin to Admin Migration
 * 
 * Converts users with role='superadmin' to role='admin'
 * EXCEPT for the true platform owner (first user ever created)
 * 
 * Architecture:
 * - 1 superadmin = Platform owner (SaaS owner)
 * - N admins = Institution administrators
 * - N docentes = Regular users
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixSuperadminToAdmin() {
  console.log('🔍 Finding users with role=superadmin...\n');

  // Get all superadmin users ordered by creation date
  const superadmins = await db.query.users.findMany({
    where: eq(users.role, 'superadmin'),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperAdmin: true,
      institutionId: true,
      createdAt: true,
    },
    orderBy: (users, { asc }) => [asc(users.createdAt)],
  });

  console.log(`Found ${superadmins.length} users with role='superadmin'\n`);

  if (superadmins.length === 0) {
    console.log('✅ No superadmin users found.');
    return;
  }

  // First user is the true platform owner - keep as superadmin
  const [platformOwner, ...institutionAdmins] = superadmins;

  console.log('👑 PLATFORM OWNER (will keep as superadmin):');
  console.log(`   ${platformOwner.name} (${platformOwner.email})`);
  console.log(`   Created: ${platformOwner.createdAt}`);
  console.log(`   Institution: ${platformOwner.institutionId || 'None'}`);
  console.log('');

  if (institutionAdmins.length === 0) {
    console.log('✅ No other superadmins found. Only platform owner exists.');
    return;
  }

  console.log(`🔧 CONVERTING ${institutionAdmins.length} users from superadmin to admin:\n`);

  for (const user of institutionAdmins) {
    console.log(`   📝 ${user.name} (${user.email})`);
    console.log(`      Institution: ${user.institutionId}`);
    console.log(`      Created: ${user.createdAt}`);
    
    await db
      .update(users)
      .set({ 
        role: 'admin',
        isSuperAdmin: false, // Remove superadmin flag
      })
      .where(eq(users.id, user.id));
    
    console.log(`      ✅ Converted to admin\n`);
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Platform owner: 1 (kept as superadmin)`);
  console.log(`   Converted to admin: ${institutionAdmins.length}`);
}

fixSuperadminToAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
