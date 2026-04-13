/**
 * Check user by email
 * 
 * Verifies user role and permissions
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkUserByEmail() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('❌ Usage: pnpm dotenv -e .env.local -- tsx scripts/check-user-by-email.ts <email>');
    process.exit(1);
  }

  console.log(`🔍 Checking user: ${email}\n`);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperAdmin: true,
      institutionId: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }

  console.log('📋 User Details:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   isSuperAdmin: ${user.isSuperAdmin}`);
  console.log(`   Institution ID: ${user.institutionId}`);
  console.log(`   Created: ${user.createdAt}`);
  console.log('');

  // Check permissions
  const adminRoles = ['director', 'coordinador', 'admin', 'superadmin'];
  const hasAdminRole = adminRoles.includes(user.role);
  const isAdmin = hasAdminRole || user.isSuperAdmin;

  console.log('🔐 Permission Check:');
  console.log(`   Role in adminRoles: ${hasAdminRole}`);
  console.log(`   isSuperAdmin flag: ${user.isSuperAdmin}`);
  console.log(`   Has admin access: ${isAdmin ? '✅ YES' : '❌ NO'}`);
  console.log('');

  if (isAdmin) {
    console.log('✅ User SHOULD have access to:');
    console.log('   - Diagnostic module configuration');
    console.log('   - Approve/reject diagnostic sessions');
    console.log('   - View diagnostic results');
    console.log('');
    console.log('⚠️  If user is getting 403 errors:');
    console.log('   1. User needs to logout');
    console.log('   2. User needs to login again');
    console.log('   3. Session will be updated with correct role');
  } else {
    console.log('❌ User does NOT have admin access');
    console.log('   Current role:', user.role);
    console.log('   Needs one of:', adminRoles.join(', '));
  }
}

checkUserByEmail()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
