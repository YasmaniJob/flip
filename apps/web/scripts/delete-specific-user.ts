// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Now import everything else
import { db } from '../src/lib/db';
import {
  users,
  accounts,
  sessions,
  meetings,
  diagnosticSessions,
} from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Script para eliminar un usuario específico y sus datos relacionados
 * Usuario: yasmaniguillen@ugelchucuito.edu.pe
 */

const USER_EMAIL = 'yasmaniguillen@ugelchucuito.edu.pe';

async function deleteSpecificUser() {
  console.log(`🗑️  Eliminando usuario: ${USER_EMAIL}\n`);

  try {
    // 1. Buscar usuario
    const user = await db.query.users.findFirst({
      where: eq(users.email, USER_EMAIL),
      with: {
        institution: true,
      },
    });

    if (!user) {
      console.log('⚠️  Usuario no encontrado\n');
      return;
    }

    console.log(`✓ Usuario encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Institución: ${user.institution?.name || 'N/A'}\n`);

    // 2. Eliminar reuniones creadas por este usuario
    console.log('🤝 Eliminando reuniones creadas por el usuario...');
    const deletedMeetings = await db
      .delete(meetings)
      .where(eq(meetings.createdByUserId, user.id))
      .returning();
    console.log(`   ✓ ${deletedMeetings.length} reuniones eliminadas\n`);

    // 3. Eliminar sesiones de diagnóstico asociadas
    console.log('📊 Eliminando sesiones de diagnóstico...');
    const deletedDiagnosticSessions = await db
      .delete(diagnosticSessions)
      .where(eq(diagnosticSessions.userId, user.id))
      .returning();
    console.log(`   ✓ ${deletedDiagnosticSessions.length} sesiones de diagnóstico eliminadas\n`);

    // 4. Eliminar accounts
    console.log('🔐 Eliminando cuentas de autenticación...');
    const deletedAccounts = await db
      .delete(accounts)
      .where(eq(accounts.userId, user.id))
      .returning();
    console.log(`   ✓ ${deletedAccounts.length} accounts eliminadas\n`);

    // 5. Eliminar sessions
    console.log('🎫 Eliminando sesiones...');
    const deletedSessions = await db
      .delete(sessions)
      .where(eq(sessions.userId, user.id))
      .returning();
    console.log(`   ✓ ${deletedSessions.length} sesiones eliminadas\n`);

    // 6. Eliminar usuario
    console.log('👤 Eliminando usuario...');
    await db.delete(users).where(eq(users.id, user.id));
    console.log(`   ✓ Usuario eliminado\n`);

    console.log('✨ Proceso completado exitosamente');
    console.log('\nResumen:');
    console.log(`   - ${deletedMeetings.length} reuniones`);
    console.log(`   - ${deletedDiagnosticSessions.length} sesiones de diagnóstico`);
    console.log(`   - ${deletedAccounts.length} accounts`);
    console.log(`   - ${deletedSessions.length} sesiones`);
    console.log(`   - 1 usuario`);
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    throw error;
  }
}

// Ejecutar
deleteSpecificUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
