/**
 * Test admin permissions logic
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testAdminPermissions() {
  console.log('🔍 Testing admin permissions logic...\n');

  // Get AMERICO user
  const americo = await db.query.users.findFirst({
    where: eq(users.email, 'avilmor.22.04@gmail.com'),
  });

  if (!americo) {
    console.log('❌ User not found');
    return;
  }

  console.log('📋 User:', americo.name);
  console.log('   Email:', americo.email);
  console.log('   Role:', americo.role);
  console.log('   isSuperAdmin:', americo.isSuperAdmin);
  console.log('   Institution:', americo.institutionId);
  console.log('');

  // Simulate middleware check
  const adminRoles = ['director', 'coordinador', 'admin', 'superadmin'];
  const isInAdminRoles = adminRoles.includes(americo.role);
  const isAdmin = isInAdminRoles || americo.isSuperAdmin;

  console.log('🔐 Permission Check:');
  console.log('   adminRoles:', adminRoles);
  console.log('   user.role in adminRoles:', isInAdminRoles);
  console.log('   user.isSuperAdmin:', americo.isSuperAdmin);
  console.log('   Final isAdmin:', isAdmin);
  console.log('');

  if (isAdmin) {
    console.log('✅ User SHOULD have access to diagnostic module');
  } else {
    console.log('❌ User SHOULD NOT have access to diagnostic module');
  }
}

testAdminPermissions()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
