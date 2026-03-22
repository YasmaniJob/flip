/**
 * Script para analizar el tamaño de las tablas en la base de datos
 */

import { Pool } from 'pg';

async function analyzeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está definida');
    console.error('   Agrega DATABASE_URL a tu archivo .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔍 Analizando base de datos...\n');

    // Obtener tamaño de todas las tablas
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC;
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  No se encontraron tablas en el schema public');
      await pool.end();
      process.exit(0);
    }

    // Calcular tamaño total
    const totalBytes = result.rows.reduce((sum, row) => sum + parseInt(row.size_bytes), 0);
    const totalSize = formatBytes(totalBytes);

    console.log('📊 RESUMEN DE TABLAS');
    console.log('═'.repeat(80));
    console.log(`Total de tablas: ${result.rows.length}`);
    console.log(`Tamaño total: ${totalSize}`);
    console.log('═'.repeat(80));
    console.log('');

    // Mostrar tabla formateada
    console.log('┌─────┬────────────────────────────────────────┬──────────────┬──────────────┐');
    console.log('│ #   │ Tabla                                  │ Tamaño       │ % del Total  │');
    console.log('├─────┼────────────────────────────────────────┼──────────────┼──────────────┤');

    result.rows.forEach((row, index) => {
      const percentage = ((parseInt(row.size_bytes) / totalBytes) * 100).toFixed(2);
      const num = (index + 1).toString().padStart(3);
      const table = row.tablename.padEnd(38);
      const size = row.size.padStart(12);
      const pct = `${percentage}%`.padStart(12);
      
      console.log(`│ ${num} │ ${table} │ ${size} │ ${pct} │`);
    });

    console.log('└─────┴────────────────────────────────────────┴──────────────┴──────────────┘');
    console.log('');

    // Mostrar tablas más grandes (top 10)
    console.log('🔝 TOP 10 TABLAS MÁS GRANDES:');
    console.log('─'.repeat(80));
    result.rows.slice(0, 10).forEach((row, index) => {
      const bar = '█'.repeat(Math.floor((parseInt(row.size_bytes) / totalBytes) * 50));
      console.log(`${(index + 1).toString().padStart(2)}. ${row.tablename.padEnd(35)} ${row.size.padStart(10)} ${bar}`);
    });
    console.log('');

    // Verificar tabla de instituciones MINEDU
    const minedRow = result.rows.find(r => r.tablename === 'education_institutions_minedu');
    if (minedRow) {
      console.log('🏫 TABLA DE INSTITUCIONES MINEDU:');
      console.log('─'.repeat(80));
      console.log(`   Tamaño: ${minedRow.size}`);
      
      // Contar registros
      const countResult = await pool.query(`
        SELECT COUNT(*) as count FROM education_institutions_minedu
      `);
      console.log(`   Registros: ${countResult.rows[0].count.toLocaleString()}`);
      
      // Calcular tamaño promedio por registro
      const avgSize = parseInt(minedRow.size_bytes) / parseInt(countResult.rows[0].count);
      console.log(`   Tamaño promedio por registro: ${formatBytes(avgSize)}`);
    } else {
      console.log('⚠️  Tabla education_institutions_minedu no encontrada o vacía');
    }

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

analyzeDatabase();
