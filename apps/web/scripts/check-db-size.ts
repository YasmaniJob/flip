/**
 * Script para verificar el tamaño de la base de datos
 */

import { Pool } from 'pg';

async function checkDatabaseSize() {
  // Extraer el nombre de la base de datos de DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está definida');
    process.exit(1);
  }

  // Extraer nombre de la base de datos de la URL
  const dbNameMatch = databaseUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : 'flip_v2';

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log(`🔍 Verificando tamaño de la base de datos: ${dbName}\n`);

    // Tamaño total de la base de datos
    const sizeResult = await pool.query(
      `SELECT pg_size_pretty(pg_database_size($1)) as size`,
      [dbName]
    );
    console.log(`📊 Tamaño total: ${sizeResult.rows[0].size}`);

    // Tamaño de cada tabla
    const tablesResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
      LIMIT 20;
    `);

    console.log('\n📋 Top 20 tablas más grandes:');
    console.log('─'.repeat(60));
    tablesResult.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.tablename.padEnd(40)} ${row.size}`);
    });

    // Contar registros en education_institutions_minedu
    const countResult = await pool.query(`
      SELECT COUNT(*) as count FROM education_institutions_minedu
    `);
    console.log('\n🏫 Instituciones MINEDU en la base de datos:');
    console.log(`   Total: ${countResult.rows[0].count} registros`);

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkDatabaseSize();
