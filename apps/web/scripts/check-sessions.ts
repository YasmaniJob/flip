// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

import { db } from '../src/lib/db';
import { sessions } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function checkSessions() {
  console.log('🔍 Verificando sesiones activas...\n');

  try {
    const now = new Date();
    
    // Query directa sin relaciones para evitar el error de Drizzle
    const result = await db.execute(sql`
      SELECT 
        s.id,
        s.user_id,
        s.token,
        s.expires_at,
        s.active_institution_id,
        s.ip_address,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        u.is_super_admin as user_is_super_admin
      FROM sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > ${now}
      ORDER BY s.created_at DESC
    `);

    console.log(`Sesiones activas: ${result.rows.length}\n`);

    for (const row: any of result.rows) {
      console.log(`🎫 Sesión: ${row.id}`);
      console.log(`   Usuario: ${row.user_name} (${row.user_email})`);
      console.log(`   Rol en BD: ${row.user_role || 'NULL'}`);
      console.log(`   isSuperAdmin en BD: ${row.user_is_super_admin || false}`);
      console.log(`   Expira: ${new Date(row.expires_at).toLocaleString('es-PE')}`);
      console.log(`   Institución Activa: ${row.active_institution_id || 'NULL'}`);
      console.log('');
    }

    console.log('✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkSessions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fallido:', error);
    process.exit(1);
  });
