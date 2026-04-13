/**
 * Check all admin users and their flags
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { inArray } from 'drizzle-orm';

async function checkAdminUsers() {
  console.log('🔍 Checking all admin users...\n');

  const adminUsers = await db.query.users.findMany({
    where: inArray(users.role, ['admin', 'superadmin', 'director', 'coordinador']),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperAdmin: true,
      institutionId: true,
    },
  });

  console.log(`Found ${adminUsers.length} admin users:\n`);

  adminUsers.forEach(user => {
    console.log(`📋 ${user.name} (${user.email})`);
    console.log(`   role: '${user.role}'`);
    console.log(`   isSuperAdmin: ${user.isSuperAdmin}`);
    console.log(`   institutionId: ${user.institutionId}`);
    console.log('');
  });
}

checkAdminUsers()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
