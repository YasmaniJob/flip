import 'dotenv/config';
import { db } from './apps/web/src/lib/db';
import { resources } from './apps/web/src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const allResources = await db.select().from(resources);
    console.log("Total resources in DB:", allResources.length);
    if (allResources.length > 0) {
      console.log("Sample resource:");
      console.log(allResources[0]);
    }
  } catch (err) {
    console.error("DB Error:", err);
  }
  process.exit(0);
}
main();
