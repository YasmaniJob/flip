/**
 * Script para corregir el primer usuario de cada institución
 * El primer usuario debe ser superadmin automáticamente
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db';
import { users, staff } from '../src/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

async function fixFirstUserSuperAdmin() {
  console.log('🔧 Iniciando corrección de primer usuario...\n');

  try {
    // Obtener todas las instituciones con usuarios
    const institutionsWithUsers = await db.execute(sql`
      SELECT DISTINCT institution_id
      FROM users
      WHERE institution_id IS NOT NULL
      ORDER BY institution_id
    `);

    console.log(`📊 Instituciones encontradas: ${institutionsWithUsers.rows.length}\n`);

    for (const row of institutionsWithUsers.rows) {
      const institutionId = (row as any).institution_id;
      
      console.log(`\n🏫 Procesando institución: ${institutionId}`);

      // Obtener el primer usuario de esta institución (por fecha de creación)
      const firstUser = await db.query.users.findFirst({
        where: eq(users.institutionId, institutionId),
        orderBy: (users, { asc }) => [asc(users.createdAt)],
      });

      if (!firstUser) {
        console.log('  ⚠️  No se encontró usuario');
        continue;
      }

      console.log(`  👤 Primer usuario: ${firstUser.email}`);
      console.log(`  📋 Rol actual: ${firstUser.role}`);
      console.log(`  🔐 isSuperAdmin actual: ${firstUser.isSuperAdmin}`);

      // Si ya es superadmin, skip
      if (firstUser.isSuperAdmin && firstUser.role === 'superadmin') {
        console.log('  ✅ Ya es superadmin, no requiere cambios');
        continue;
      }

      // Actualizar usuario a superadmin
      await db
        .update(users)
        .set({
          role: 'superadmin',
          isSuperAdmin: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, firstUser.id));

      console.log('  ✅ Usuario actualizado a superadmin');

      // Buscar staff record asociado y actualizarlo también
      if (firstUser.dni) {
        const staffRecord = await db.query.staff.findFirst({
          where: and(
            eq(staff.dni, firstUser.dni),
            eq(staff.institutionId, institutionId)
          ),
        });

        if (staffRecord) {
          await db
            .update(staff)
            .set({
              role: 'admin',
              updatedAt: new Date(),
            })
            .where(eq(staff.id, staffRecord.id));

          console.log('  ✅ Staff record actualizado a admin');
        }
      }
    }

    console.log('\n\n✅ Corrección completada exitosamente');
    console.log('🔄 Por favor, cierra sesión y vuelve a iniciar sesión para ver los cambios');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    throw error;
  }
}

// Ejecutar
fixFirstUserSuperAdmin()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
