import { db } from '../src/lib/db';
import { staff, users } from '../src/lib/db/schema';

async function main() {
  console.log('Dumping ALL staff members in DB...');
  const allStaff = await db.select().from(staff);
  for (const s of allStaff) {
    console.log(`STAFF: id=${s.id} | name="${s.name}" | dni="${s.dni}" | email="${s.email}" | instId=${s.institutionId}`);
  }

  console.log('Dumping ALL users in DB...');
  const allUsers = await db.select().from(users);
  for (const u of allUsers) {
    console.log(`USER: id=${u.id} | name="${u.name}" | email="${u.email}" | role="${u.role}" | instId=${u.institutionId}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error running script:', err);
    process.exit(1);
  });
