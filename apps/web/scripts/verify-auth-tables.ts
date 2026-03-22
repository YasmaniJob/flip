import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function verifyAuthTables() {
  console.log('🔍 Verificando tablas de autenticación en Neon...\n');

  try {
    // Verificar tabla users
    const users = await db.execute(sql`SELECT COUNT(*) FROM users`);
    console.log('✅ Tabla users existe:', users.rows[0]);

    // Verificar tabla sessions
    const sessions = await db.execute(sql`SELECT COUNT(*) FROM sessions`);
    console.log('✅ Tabla sessions existe:', sessions.rows[0]);

    // Verificar tabla accounts
    const accounts = await db.execute(sql`SELECT COUNT(*) FROM accounts`);
    console.log('✅ Tabla accounts existe:', accounts.rows[0]);

    // Verificar tabla verification
    const verification = await db.execute(sql`SELECT COUNT(*) FROM verification`);
    console.log('✅ Tabla verification existe:', verification.rows[0]);

    console.log('\n✅ Todas las tablas de autenticación existen en Neon');
  } catch (error: any) {
    console.error('❌ Error verificando tablas:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

verifyAuthTables();
