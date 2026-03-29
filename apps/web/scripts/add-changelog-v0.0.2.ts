import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  const newChangelog = {
    id: 'v0.0.2',
    version: '0.0.2',
    title: 'Mejoras de Usabilidad',
    date: Date.now(),
    improvements: JSON.stringify([
      'Editor de acuerdos con botones visuales (check/cancelar) para mejor experiencia',
      'Sistema de sincronización de versiones entre app y landing',
    ]),
    fixes: JSON.stringify([
      'Corrección de errores de sintaxis en componentes',
    ]),
    published: 1,
    sortOrder: 2,
    createdAt: Date.now(),
  };

  try {
    await turso.execute({
      sql: `INSERT INTO changelog (id, version, title, date, improvements, fixes, published, sort_order, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newChangelog.id,
        newChangelog.version,
        newChangelog.title,
        newChangelog.date,
        newChangelog.improvements,
        newChangelog.fixes,
        newChangelog.published,
        newChangelog.sortOrder,
        newChangelog.createdAt,
      ]
    });
    console.log('✅ Changelog v0.0.2 creado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
