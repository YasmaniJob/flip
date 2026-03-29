import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  // Actualizar sortOrder: menor = más reciente
  await turso.execute({
    sql: 'UPDATE changelog SET sort_order = ? WHERE version = ?',
    args: [0, '0.0.2']
  });
  
  await turso.execute({
    sql: 'UPDATE changelog SET sort_order = ? WHERE version = ?',
    args: [1, '2.6.0']
  });
  
  await turso.execute({
    sql: 'UPDATE changelog SET sort_order = ? WHERE version = ?',
    args: [2, '2.5.0']
  });
  
  await turso.execute({
    sql: 'UPDATE changelog SET sort_order = ? WHERE version = ?',
    args: [3, '2.4.0']
  });

  console.log('✅ SortOrder actualizado: 0.0.2 (0), 2.6.0 (1), 2.5.0 (2), 2.4.0 (3)');
}

main().catch(console.error);
