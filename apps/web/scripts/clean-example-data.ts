#!/usr/bin/env tsx
/**
 * Script para limpiar datos de ejemplo de la base de datos
 * Mantiene la estructura (tablas, índices, constraints) intacta
 * Solo elimina los datos insertados para pruebas/ejemplos
 * 
 * PRECAUCIÓN: Este script eliminará TODOS los datos de las tablas.
 * Asegúrate de tener un backup antes de ejecutar en producción.
 * 
 * Uso:
 *   pnpm tsx --env-file=.env.local scripts/clean-example-data.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Importar schema para tener acceso a las tablas
import * as schema from '../src/lib/db/schema';

async function main() {
  console.log('🧹 Iniciando limpieza de datos de ejemplo...\n');
  console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de las tablas.');
  console.log('⚠️  La estructura de la base de datos se mantendrá intacta.\n');

  // Conectar a la base de datos
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida en las variables de entorno');
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log('📊 Contando registros antes de la limpieza...\n');

    // Contar registros en cada tabla (orden inverso de dependencias)
    const counts = {
      diagnosticResponses: await db.execute(sql`SELECT COUNT(*) FROM diagnostic_responses`),
      diagnosticSessions: await db.execute(sql`SELECT COUNT(*) FROM diagnostic_sessions`),
      diagnosticQuestions: await db.execute(sql`SELECT COUNT(*) FROM diagnostic_questions`),
      diagnosticCategories: await db.execute(sql`SELECT COUNT(*) FROM diagnostic_categories`),
      
      reservationTasks: await db.execute(sql`SELECT COUNT(*) FROM reservation_tasks`),
      reservationAttendance: await db.execute(sql`SELECT COUNT(*) FROM reservation_attendance`),
      reservationSlots: await db.execute(sql`SELECT COUNT(*) FROM reservation_slots`),
      classroomReservations: await db.execute(sql`SELECT COUNT(*) FROM classroom_reservations`),
      
      meetingTasks: await db.execute(sql`SELECT COUNT(*) FROM meeting_tasks`),
      meetingAttendance: await db.execute(sql`SELECT COUNT(*) FROM meeting_attendance`),
      meetings: await db.execute(sql`SELECT COUNT(*) FROM meetings`),
      
      loanResources: await db.execute(sql`SELECT COUNT(*) FROM loan_resources`),
      loans: await db.execute(sql`SELECT COUNT(*) FROM loans`),
      
      resources: await db.execute(sql`SELECT COUNT(*) FROM resources`),
      resourceTemplates: await db.execute(sql`SELECT COUNT(*) FROM resource_templates`),
      
      sections: await db.execute(sql`SELECT COUNT(*) FROM sections`),
      grades: await db.execute(sql`SELECT COUNT(*) FROM grades`),
      curricularAreas: await db.execute(sql`SELECT COUNT(*) FROM curricular_areas`),
      pedagogicalHours: await db.execute(sql`SELECT COUNT(*) FROM pedagogical_hours`),
      classrooms: await db.execute(sql`SELECT COUNT(*) FROM classrooms`),
      
      staff: await db.execute(sql`SELECT COUNT(*) FROM staff`),
      categories: await db.execute(sql`SELECT COUNT(*) FROM categories`),
      categorySequences: await db.execute(sql`SELECT COUNT(*) FROM category_sequences`),
      
      verification: await db.execute(sql`SELECT COUNT(*) FROM verification`),
      accounts: await db.execute(sql`SELECT COUNT(*) FROM accounts`),
      sessions: await db.execute(sql`SELECT COUNT(*) FROM sessions`),
      users: await db.execute(sql`SELECT COUNT(*) FROM users`),
      
      subscriptionHistory: await db.execute(sql`SELECT COUNT(*) FROM subscription_history`),
      institutions: await db.execute(sql`SELECT COUNT(*) FROM institutions`),
    };

    console.log('📈 Registros actuales:');
    Object.entries(counts).forEach(([table, result]) => {
      const count = result[0]?.count || 0;
      if (count > 0) {
        console.log(`   ${table}: ${count}`);
      }
    });
    console.log('');

    // Confirmar antes de proceder
    console.log('⏸️  Presiona Ctrl+C para cancelar o espera 5 segundos para continuar...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Eliminando datos en orden de dependencias...\n');

    // Eliminar en orden inverso de dependencias (de hijos a padres)
    
    // 1. Diagnóstico - Respuestas
    console.log('   Eliminando diagnostic_responses...');
    await db.execute(sql`DELETE FROM diagnostic_responses`);
    
    // 2. Diagnóstico - Sesiones
    console.log('   Eliminando diagnostic_sessions...');
    await db.execute(sql`DELETE FROM diagnostic_sessions`);
    
    // 3. Diagnóstico - Preguntas (solo las personalizadas, mantener las estándar)
    console.log('   Eliminando diagnostic_questions personalizadas...');
    await db.execute(sql`DELETE FROM diagnostic_questions WHERE institution_id IS NOT NULL`);
    
    // 4. Diagnóstico - Categorías (solo las personalizadas, mantener las estándar)
    console.log('   Eliminando diagnostic_categories personalizadas...');
    await db.execute(sql`DELETE FROM diagnostic_categories WHERE institution_id IS NOT NULL`);
    
    // 5. Reservaciones - Tareas y asistencia
    console.log('   Eliminando reservation_tasks...');
    await db.execute(sql`DELETE FROM reservation_tasks`);
    console.log('   Eliminando reservation_attendance...');
    await db.execute(sql`DELETE FROM reservation_attendance`);
    
    // 6. Reservaciones - Slots
    console.log('   Eliminando reservation_slots...');
    await db.execute(sql`DELETE FROM reservation_slots`);
    
    // 7. Reservaciones - Reservaciones
    console.log('   Eliminando classroom_reservations...');
    await db.execute(sql`DELETE FROM classroom_reservations`);
    
    // 8. Reuniones - Tareas y asistencia
    console.log('   Eliminando meeting_tasks...');
    await db.execute(sql`DELETE FROM meeting_tasks`);
    console.log('   Eliminando meeting_attendance...');
    await db.execute(sql`DELETE FROM meeting_attendance`);
    
    // 9. Reuniones
    console.log('   Eliminando meetings...');
    await db.execute(sql`DELETE FROM meetings`);
    
    // 10. Préstamos - Recursos
    console.log('   Eliminando loan_resources...');
    await db.execute(sql`DELETE FROM loan_resources`);
    
    // 11. Préstamos
    console.log('   Eliminando loans...');
    await db.execute(sql`DELETE FROM loans`);
    
    // 12. Recursos
    console.log('   Eliminando resources...');
    await db.execute(sql`DELETE FROM resources`);
    console.log('   Eliminando resource_templates...');
    await db.execute(sql`DELETE FROM resource_templates`);
    
    // 13. Estructura académica
    console.log('   Eliminando sections...');
    await db.execute(sql`DELETE FROM sections`);
    console.log('   Eliminando grades...');
    await db.execute(sql`DELETE FROM grades`);
    console.log('   Eliminando curricular_areas...');
    await db.execute(sql`DELETE FROM curricular_areas`);
    console.log('   Eliminando pedagogical_hours...');
    await db.execute(sql`DELETE FROM pedagogical_hours`);
    console.log('   Eliminando classrooms...');
    await db.execute(sql`DELETE FROM classrooms`);
    
    // 14. Personal
    console.log('   Eliminando staff...');
    await db.execute(sql`DELETE FROM staff`);
    
    // 15. Categorías de inventario
    console.log('   Eliminando categories...');
    await db.execute(sql`DELETE FROM categories`);
    console.log('   Eliminando category_sequences...');
    await db.execute(sql`DELETE FROM category_sequences`);
    
    // 16. Autenticación
    console.log('   Eliminando verification...');
    await db.execute(sql`DELETE FROM verification`);
    console.log('   Eliminando accounts...');
    await db.execute(sql`DELETE FROM accounts`);
    console.log('   Eliminando sessions...');
    await db.execute(sql`DELETE FROM sessions`);
    console.log('   Eliminando users...');
    await db.execute(sql`DELETE FROM users`);
    
    // 17. Instituciones
    console.log('   Eliminando subscription_history...');
    await db.execute(sql`DELETE FROM subscription_history`);
    console.log('   Eliminando institutions...');
    await db.execute(sql`DELETE FROM institutions`);
    
    console.log('\n✅ Limpieza completada exitosamente!\n');

    // Resetear secuencias de IDs (opcional, para que los nuevos IDs empiecen desde 1)
    console.log('🔄 Reseteando secuencias de auto-incremento...');
    // PostgreSQL no usa secuencias para UUIDs, pero si tuvieras campos serial/bigserial:
    // await db.execute(sql`ALTER SEQUENCE table_id_seq RESTART WITH 1`);
    console.log('   (No hay secuencias que resetear - usando UUIDs)\n');

    // Verificar que las tablas están vacías
    console.log('📊 Verificando limpieza...\n');
    const finalCounts = {
      institutions: await db.execute(sql`SELECT COUNT(*) FROM institutions`),
      users: await db.execute(sql`SELECT COUNT(*) FROM users`),
      staff: await db.execute(sql`SELECT COUNT(*) FROM staff`),
      resources: await db.execute(sql`SELECT COUNT(*) FROM resources`),
      loans: await db.execute(sql`SELECT COUNT(*) FROM loans`),
      classroomReservations: await db.execute(sql`SELECT COUNT(*) FROM classroom_reservations`),
      diagnosticSessions: await db.execute(sql`SELECT COUNT(*) FROM diagnostic_sessions`),
    };

    console.log('📈 Registros después de la limpieza:');
    Object.entries(finalCounts).forEach(([table, result]) => {
      const count = result[0]?.count || 0;
      console.log(`   ${table}: ${count}`);
    });
    console.log('');

    // Verificar que las preguntas y categorías estándar se mantuvieron
    const standardQuestions = await db.execute(
      sql`SELECT COUNT(*) FROM diagnostic_questions WHERE institution_id IS NULL`
    );
    const standardCategories = await db.execute(
      sql`SELECT COUNT(*) FROM diagnostic_categories WHERE institution_id IS NULL`
    );
    
    console.log('✅ Datos estándar preservados:');
    console.log(`   Categorías estándar: ${standardQuestions[0]?.count || 0}`);
    console.log(`   Preguntas estándar: ${standardCategories[0]?.count || 0}`);
    console.log('');

    console.log('🎉 Base de datos limpia y lista para datos de producción!\n');
    console.log('📝 Notas:');
    console.log('   - La estructura de la base de datos se mantuvo intacta');
    console.log('   - Todos los índices y constraints siguen activos');
    console.log('   - Las preguntas y categorías estándar del diagnóstico se preservaron');
    console.log('   - Puedes empezar a insertar datos de producción de forma segura\n');

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
