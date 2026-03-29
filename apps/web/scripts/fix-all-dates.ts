import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  // Corregir todas las fechas: dividir por 1000 para convertir ms a segundos
  const updates = [
    { version: '0.0.2', date: Math.floor(new Date('2026-03-28').getTime() / 1000) },
    { version: '2.6.0', date: Math.floor(new Date('2026-03-28').getTime() / 1000) },
    { version: '2.5.0', date: Math.floor(new Date('2026-03-20').getTime() / 1000) },
    { version: '2.4.0', date: Math.floor(new Date('2026-02-15').getTime() / 1000) },
  ];

  for (const { version, date } of updates) {
    await turso.execute({
      sql: 'UPDATE changelog SET date = ? WHERE version = ?',
      args: [date, version]
    });
    console.log(`✅ Fecha corregida para v${version}: ${new Date(date * 1000).toLocaleDateString('es-ES')}`);
  }

  console.log('\n✅ Todas las fechas corregidas');
}

main().catch(console.error);
