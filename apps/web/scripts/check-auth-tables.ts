import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkAuthTables() {
  try {
    console.log('🔍 Checking Better Auth tables in Neon...\n');

    const tables = ['users', 'sessions', 'accounts', 'verification'];

    for (const table of tables) {
      try {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        `);

        const exists = result.rows[0]?.count === '1';
        console.log(`${exists ? '✅' : '❌'} Table "${table}": ${exists ? 'EXISTS' : 'NOT FOUND'}`);

        if (exists) {
          const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table}"`));
          console.log(`   Records: ${countResult.rows[0]?.count || 0}`);
        }
      } catch (error) {
        console.log(`❌ Table "${table}": ERROR - ${error}`);
      }
    }

    console.log('\n✅ Check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAuthTables();
