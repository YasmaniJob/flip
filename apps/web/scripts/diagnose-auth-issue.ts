// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

/**
 * Script de diagnóstico para problemas de autenticación y permisos
 * Revisa usuarios, sesiones, roles y permisos
 */

import { db } from '../src/lib/db';
import { users, sessions, institutions } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function diagnoseAuthIssue() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN Y PERMISOS\n');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Listar todos los usuarios activos
    console.log('1️⃣  USUARIOS EN LA BASE DE DATOS\n');
    const allUsers = await db.query.users.findMany({
      with: {
        institution: true,
      },
    });

    console.log(`Total de usuarios: ${allUsers.length}\n`);

    for (const user of allUsers) {
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Rol: ${user.role || 'NULL'}`);
      console.log(`   isSuperAdmin: ${user.isSuperAdmin || false}`);
      console.log(`   Institución ID: ${user.institutionId || 'NULL'}`);
      console.log(`   Institución: ${user.institution?.name || 'N/A'}`);
      console.log('');
    }

    console.log('='.repeat(80) + '\n');

    // 2. Listar sesiones activas
    console.log('2️⃣  SESIONES ACTIVAS\n');
    const now = new Date();
    const activeSessions = await db.query.sessions.findMany({
      with: {
        user: {
          with: {
            institution: true,
          },
        },
      },
    });

    const validSessions = activeSessions.filter(s => s.expiresAt > now);
    console.log(`Total de sesiones: ${activeSessions.length}`);
    console.log(`Sesiones válidas (no expiradas): ${validSessions.length}\n`);

    for (const session of validSessions) {
      console.log(`🎫 Sesión: ${session.id}`);
      console.log(`   Usuario: ${session.user?.name} (${session.user?.email})`);
      console.log(`   User ID: ${session.userId}`);
      console.log(`   Token: ${session.token.substring(0, 20)}...`);
      console.log(`   Expira: ${session.expiresAt.toLocaleString('es-PE')}`);
      console.log(`   Institución Activa: ${session.activeInstitutionId || 'NULL'}`);
      console.log(`   IP: ${session.ipAddress || 'N/A'}`);
      console.log('');
    }

    console.log('='.repeat(80) + '\n');

    // 3. Verificar configuración de Better Auth
    console.log('3️⃣  CONFIGURACIÓN DE BETTER AUTH\n');
    console.log(`   BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? '✓ Configurado' : '✗ NO configurado'}`);
    console.log(`   AUTH_SECRET: ${process.env.AUTH_SECRET ? '✓ Configurado' : '✗ NO configurado'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Configurado' : '✗ NO configurado'}`);
    console.log('');

    console.log('='.repeat(80) + '\n');

    // 4. Verificar roles permitidos en el middleware
    console.log('4️⃣  ROLES PERMITIDOS EN MIDDLEWARE DE DIAGNÓSTICO\n');
    const adminRoles = ['director', 'coordinador', 'admin'];
    console.log(`   Roles con acceso admin: ${adminRoles.join(', ')}`);
    console.log(`   También: isSuperAdmin = true`);
    console.log('');

    // 5. Análisis de permisos por usuario
    console.log('='.repeat(80) + '\n');
    console.log('5️⃣  ANÁLISIS DE PERMISOS POR USUARIO\n');

    for (const user of allUsers) {
      const hasAdminRole = adminRoles.includes(user.role || '');
      const isSuperAdmin = user.isSuperAdmin === true;
      const hasAccess = hasAdminRole || isSuperAdmin;

      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   Rol actual: "${user.role || 'NULL'}"`);
      console.log(`   ¿Rol es admin? ${hasAdminRole ? '✓ SÍ' : '✗ NO'}`);
      console.log(`   ¿Es SuperAdmin? ${isSuperAdmin ? '✓ SÍ' : '✗ NO'}`);
      console.log(`   ¿Tiene acceso al diagnóstico? ${hasAccess ? '✅ SÍ' : '❌ NO'}`);
      
      if (!hasAccess && user.role) {
        console.log(`   ⚠️  PROBLEMA: Rol "${user.role}" no está en la lista de roles permitidos`);
      }
      
      console.log('');
    }

    console.log('='.repeat(80) + '\n');

    // 6. Verificar instituciones
    console.log('6️⃣  INSTITUCIONES\n');
    const allInstitutions = await db.query.institutions.findMany();
    
    for (const inst of allInstitutions) {
      const usersInInst = allUsers.filter(u => u.institutionId === inst.id);
      console.log(`🏫 ${inst.name}`);
      console.log(`   ID: ${inst.id}`);
      console.log(`   Slug: ${inst.slug}`);
      console.log(`   Usuarios: ${usersInInst.length}`);
      usersInInst.forEach(u => {
        console.log(`      - ${u.name} (${u.role || 'sin rol'})`);
      });
      console.log('');
    }

    console.log('='.repeat(80) + '\n');

    // 7. Recomendaciones
    console.log('7️⃣  RECOMENDACIONES\n');
    
    const usersWithoutRole = allUsers.filter(u => !u.role || u.role === 'NULL');
    if (usersWithoutRole.length > 0) {
      console.log(`⚠️  ${usersWithoutRole.length} usuario(s) sin rol asignado:`);
      usersWithoutRole.forEach(u => console.log(`   - ${u.email}`));
      console.log('');
    }

    const usersWithInvalidRole = allUsers.filter(u => 
      u.role && 
      !adminRoles.includes(u.role) && 
      u.role !== 'docente' && 
      u.role !== 'superadmin' &&
      !u.isSuperAdmin
    );
    if (usersWithInvalidRole.length > 0) {
      console.log(`⚠️  ${usersWithInvalidRole.length} usuario(s) con rol no estándar:`);
      usersWithInvalidRole.forEach(u => console.log(`   - ${u.email}: "${u.role}"`));
      console.log('');
    }

    const usersWithoutInstitution = allUsers.filter(u => !u.institutionId);
    if (usersWithoutInstitution.length > 0) {
      console.log(`⚠️  ${usersWithoutInstitution.length} usuario(s) sin institución:`);
      usersWithoutInstitution.forEach(u => console.log(`   - ${u.email}`));
      console.log('');
    }

    console.log('✅ Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    throw error;
  }
}

// Ejecutar
diagnoseAuthIssue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Diagnóstico fallido:', error);
    process.exit(1);
  });
