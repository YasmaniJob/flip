// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Now import everything else
import { db } from '../src/lib/db';
import {
  users,
  accounts,
  sessions,
  institutions,
  diagnosticSessions,
  diagnosticResponses,
  reservationSlots,
  reservationAttendance,
  reservationTasks,
  classroomReservations,
  meetingAttendance,
  meetingTasks,
  meetings,
  loanResources,
  loans,
  resources,
  categorySequences,
  categories,
  resourceTemplates,
  staff,
  pedagogicalHours,
  classrooms,
  sections,
  grades,
  curricularAreas,
  subscriptionHistory,
} from '../src/lib/db/schema';
import { inArray } from 'drizzle-orm';

/**
 * Script para eliminar usuarios de prueba y TODOS sus datos relacionados
 * Incluye: instituciones, inventario, préstamos, reservaciones, diagnósticos, etc.
 */

const TEST_EMAILS = [
  'heraldguillen@gmail.com',
  'yasmaniguillen@ugelchucuito.edu.pe',
  'temp-1776041265881-avilmor.22.04@gmail.com',
  'temp-1776041318493-avilmor.22.04@gmail.com',
];

async function deleteTestUsers() {
  console.log('🗑️  Iniciando eliminación completa de usuarios de prueba...\n');

  // 1. Encontrar todos los usuarios de prueba
  const testUsers = await db.query.users.findMany({
    where: inArray(users.email, TEST_EMAILS),
  });

  if (testUsers.length === 0) {
    console.log('⚠️  No se encontraron usuarios de prueba\n');
    return;
  }

  console.log(`📋 Encontrados ${testUsers.length} usuarios de prueba:`);
  testUsers.forEach((u) => console.log(`   - ${u.email} (${u.id})`));
  console.log('');

  // 2. Encontrar instituciones asociadas a estos usuarios
  const institutionIds = [...new Set(testUsers.map((u) => u.institutionId).filter(Boolean))] as string[];

  if (institutionIds.length === 0) {
    console.log('⚠️  No hay instituciones asociadas\n');
  } else {
    console.log(`🏫 Instituciones a eliminar: ${institutionIds.length}`);
    const institutionsToDelete = await db.query.institutions.findMany({
      where: inArray(institutions.id, institutionIds),
    });
    institutionsToDelete.forEach((i) => console.log(`   - ${i.name} (${i.id})`));
    console.log('');

    // 3. Eliminar TODOS los datos relacionados con estas instituciones
    console.log('🧹 Eliminando datos relacionados...\n');

    // Diagnostic data
    console.log('  📊 Diagnósticos...');
    const diagnosticSessionsToDelete = await db.query.diagnosticSessions.findMany({
      where: inArray(diagnosticSessions.institutionId, institutionIds),
    });
    if (diagnosticSessionsToDelete.length > 0) {
      const sessionIds = diagnosticSessionsToDelete.map((s) => s.id);
      const deletedResponses = await db
        .delete(diagnosticResponses)
        .where(inArray(diagnosticResponses.sessionId, sessionIds))
        .returning();
      console.log(`     ✓ ${deletedResponses.length} respuestas de diagnóstico`);

      const deletedSessions = await db
        .delete(diagnosticSessions)
        .where(inArray(diagnosticSessions.id, sessionIds))
        .returning();
      console.log(`     ✓ ${deletedSessions.length} sesiones de diagnóstico`);
    } else {
      console.log(`     ✓ 0 sesiones de diagnóstico`);
    }

    // Reservation data
    console.log('  📅 Reservaciones...');
    const reservationsToDelete = await db.query.classroomReservations.findMany({
      where: inArray(classroomReservations.institutionId, institutionIds),
    });
    if (reservationsToDelete.length > 0) {
      const reservationIds = reservationsToDelete.map((r) => r.id);

      const deletedSlots = await db
        .delete(reservationSlots)
        .where(inArray(reservationSlots.reservationId, reservationIds))
        .returning();
      console.log(`     ✓ ${deletedSlots.length} slots de reservación`);

      const deletedAttendance = await db
        .delete(reservationAttendance)
        .where(inArray(reservationAttendance.reservationId, reservationIds))
        .returning();
      console.log(`     ✓ ${deletedAttendance.length} asistencias de reservación`);

      const deletedTasks = await db
        .delete(reservationTasks)
        .where(inArray(reservationTasks.reservationId, reservationIds))
        .returning();
      console.log(`     ✓ ${deletedTasks.length} tareas de reservación`);

      const deletedReservations = await db
        .delete(classroomReservations)
        .where(inArray(classroomReservations.id, reservationIds))
        .returning();
      console.log(`     ✓ ${deletedReservations.length} reservaciones`);
    } else {
      console.log(`     ✓ 0 reservaciones`);
    }

    // Meeting data
    console.log('  🤝 Reuniones...');
    const meetingsToDelete = await db.query.meetings.findMany({
      where: inArray(meetings.institutionId, institutionIds),
    });
    if (meetingsToDelete.length > 0) {
      const meetingIds = meetingsToDelete.map((m) => m.id);

      const deletedMeetingAttendance = await db
        .delete(meetingAttendance)
        .where(inArray(meetingAttendance.meetingId, meetingIds))
        .returning();
      console.log(`     ✓ ${deletedMeetingAttendance.length} asistencias de reunión`);

      const deletedMeetingTasks = await db
        .delete(meetingTasks)
        .where(inArray(meetingTasks.meetingId, meetingIds))
        .returning();
      console.log(`     ✓ ${deletedMeetingTasks.length} tareas de reunión`);

      const deletedMeetings = await db
        .delete(meetings)
        .where(inArray(meetings.id, meetingIds))
        .returning();
      console.log(`     ✓ ${deletedMeetings.length} reuniones`);
    } else {
      console.log(`     ✓ 0 reuniones`);
    }

    // Loan data
    console.log('  📦 Préstamos...');
    const loansToDelete = await db.query.loans.findMany({
      where: inArray(loans.institutionId, institutionIds),
    });
    if (loansToDelete.length > 0) {
      const loanIds = loansToDelete.map((l) => l.id);

      const deletedLoanResources = await db
        .delete(loanResources)
        .where(inArray(loanResources.loanId, loanIds))
        .returning();
      console.log(`     ✓ ${deletedLoanResources.length} recursos prestados`);

      const deletedLoans = await db
        .delete(loans)
        .where(inArray(loans.id, loanIds))
        .returning();
      console.log(`     ✓ ${deletedLoans.length} préstamos`);
    } else {
      console.log(`     ✓ 0 préstamos`);
    }

    // Inventory data
    console.log('  🎒 Inventario...');
    const deletedResources = await db
      .delete(resources)
      .where(inArray(resources.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedResources.length} recursos`);

    const deletedTemplates = await db
      .delete(resourceTemplates)
      .where(inArray(resourceTemplates.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedTemplates.length} plantillas de recursos`);

    const deletedCategorySequences = await db
      .delete(categorySequences)
      .where(inArray(categorySequences.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedCategorySequences.length} secuencias de categoría`);

    const deletedCategories = await db
      .delete(categories)
      .where(inArray(categories.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedCategories.length} categorías`);

    // Staff
    console.log('  👥 Personal...');
    const deletedStaff = await db
      .delete(staff)
      .where(inArray(staff.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedStaff.length} miembros del personal`);

    // Academic structure
    console.log('  🏫 Estructura académica...');
    const deletedPedagogicalHours = await db
      .delete(pedagogicalHours)
      .where(inArray(pedagogicalHours.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedPedagogicalHours.length} horas pedagógicas`);

    const deletedClassrooms = await db
      .delete(classrooms)
      .where(inArray(classrooms.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedClassrooms.length} aulas`);

    const deletedSections = await db
      .delete(sections)
      .where(inArray(sections.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedSections.length} secciones`);

    const deletedGrades = await db
      .delete(grades)
      .where(inArray(grades.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedGrades.length} grados`);

    const deletedAreas = await db
      .delete(curricularAreas)
      .where(inArray(curricularAreas.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedAreas.length} áreas curriculares`);

    // Subscription history
    console.log('  💳 Historial de suscripción...');
    const deletedSubHistory = await db
      .delete(subscriptionHistory)
      .where(inArray(subscriptionHistory.institutionId, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedSubHistory.length} registros de historial`);

    // Finally, delete institutions
    console.log('  🏢 Instituciones...');
    const deletedInstitutions = await db
      .delete(institutions)
      .where(inArray(institutions.id, institutionIds))
      .returning();
    console.log(`     ✓ ${deletedInstitutions.length} instituciones eliminadas\n`);
  }

  // 4. Eliminar datos de usuario
  console.log('👤 Eliminando usuarios...\n');
  const userIds = testUsers.map((u) => u.id);

  const deletedAccounts = await db
    .delete(accounts)
    .where(inArray(accounts.userId, userIds))
    .returning();
  console.log(`  ✓ ${deletedAccounts.length} accounts`);

  const deletedSessions = await db
    .delete(sessions)
    .where(inArray(sessions.userId, userIds))
    .returning();
  console.log(`  ✓ ${deletedSessions.length} sesiones`);

  const deletedUsers = await db
    .delete(users)
    .where(inArray(users.id, userIds))
    .returning();
  console.log(`  ✓ ${deletedUsers.length} usuarios eliminados\n`);

  console.log('✨ Proceso completado - Todos los datos relacionados han sido eliminados');
}

// Ejecutar
deleteTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
