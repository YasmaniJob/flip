import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  // Eliminar el registro incorrecto
  await turso.execute({
    sql: 'DELETE FROM changelog WHERE id = ?',
    args: ['v0.0.2']
  });
  console.log('🗑️  Eliminado registro incorrecto');

  // Insertar con datos correctos
  const now = new Date('2026-03-28T12:00:00');
  
  await turso.execute({
    sql: `INSERT INTO changelog (id, version, title, date, improvements, fixes, published, sort_order, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'v0.0.2',
      '0.0.2',
      'Mejoras de Usabilidad',
      now.getTime(),
      JSON.stringify([
        'Editor de acuerdos con botones visuales (check/cancelar) para mejor experiencia',
        'Sistema de sincronización de versiones entre app y landing',
      ]),
      JSON.stringify([
        'Corrección de errores de sintaxis en componentes',
      ]),
      1,
      0, // sortOrder 0 = más reciente (aparece primero)
      Date.now(),
    ]
  });

  console.log('✅ Changelog v0.0.2 corregido exitosamente');
}

main().catch(console.error);
