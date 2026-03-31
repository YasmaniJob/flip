/**
 * Delete user by email
 * Usage: npx tsx scripts/delete-user-by-email.ts <email>
 */

import { db } from '../src/lib/db';
import { users, sessions, accounts } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email is required');
  console.log('Usage: npx tsx scripts/delete-user-by-email.ts <email>');
  process.exit(1);
}

async function deleteUser() {
  console.log(`🔍 Looking for user: ${email}`);
  
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(0);
  }
  
  console.log(`✅ Found user: ${user.id} - ${user.name}`);
  console.log('🗑️  Deleting sessions...');
  
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  
  console.log('🗑️  Deleting accounts...');
  await db.delete(accounts).where(eq(accounts.userId, user.id));
  
  console.log('🗑️  Deleting user...');
  await db.delete(users).where(eq(users.id, user.id));
  
  console.log('✅ User deleted successfully');
  console.log('💡 The user can now login again and will be recreated');
}

deleteUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
