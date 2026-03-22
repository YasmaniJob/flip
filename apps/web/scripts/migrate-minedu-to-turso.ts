#!/usr/bin/env tsx

/**
 * Script para migrar datos de education_institutions_minedu
 * desde PostgreSQL local a Turso
 */

import { Client } from 'pg';
import { createClient } from '@libsql/client';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/libsql';
import { educationInstitutionsMinedu } from '../src/lib/db/schema-turso';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Configuración de PostgreSQL local
const LOCAL_PG_URL = 'postgresql://postgres:postgres@localhost:5432/flip_v2';

// Configuración de Turso
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL o TURSO_AUTH_TOKEN no están definidas');
  process.exit(1);
}

async function migrateMineduData() {
  console.log('🚀 Iniciando migración de datos MINEDU a Turso...\n');

  // Conectar a PostgreSQL local
  console.log('📍 Conectando a PostgreSQL local...');
  const pgClient = new Client({ connectionString: LOCAL_PG_URL });
  await pgClient.connect();
  const pgDb = drizzlePg(pgClient);
  console.log('✅ Conectado a PostgreSQL local\n');

  // Conectar a Turso
  console.log('📍 Conectando a Turso...');
  const tursoClient = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });
  const tursoDb = drizzleSqlite(tursoClient, {
    schema: { educationInstitutionsMinedu }
  });
  console.log('✅ Conectado a Turso\n');

  try {
    // 1. Crear tabla en Turso
    console.log('📋 Creando tabla en Turso...');
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS education_institutions_minedu (
        codigo_modular TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        nivel TEXT NOT NULL,
        tipo_gestion TEXT,
        departamento TEXT,
        provincia TEXT,
        distrito TEXT,
        direccion TEXT,
        estado TEXT DEFAULT 'Activo'
      )
    `);
    console.log('✅ Tabla creada\n');

    // 2. Crear índices
    console.log('📋 Creando índices...');
    await tursoClient.execute(`
      CREATE INDEX IF NOT EXISTS idx_ie_minedu_nivel 
      ON education_institutions_minedu(nivel)
    `);
    await tursoClient.execute(`
      CREATE INDEX IF NOT EXISTS idx_ie_minedu_departamento 
      ON education_institutions_minedu(departamento)
    `);
    await tursoClient.execute(`
      CREATE INDEX IF NOT EXISTS idx_ie_minedu_nombre 
      ON education_institutions_minedu(nombre)
    `);
    console.log('✅ Índices creados\n');

    // 3. Obtener datos de PostgreSQL
    console.log('📥 Obteniendo datos de PostgreSQL local...');
    const result = await pgClient.query(`
      SELECT 
        codigo_modular,
        nombre,
        nivel,
        tipo_gestion,
        departamento,
        provincia,
        distrito,
        direccion,
        estado
      FROM education_institutions_minedu
      ORDER BY codigo_modular
    `);
    
    const totalRecords = result.rows.length;
    console.log(`✅ ${totalRecords.toLocaleString()} registros obtenidos\n`);

    if (totalRecords === 0) {
      console.log('⚠️  No hay datos para migrar');
      return;
    }

    // 4. Insertar datos en Turso en lotes
    console.log('📤 Insertando datos en Turso...');
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < result.rows.length; i += batchSize) {
      const batch = result.rows.slice(i, i + batchSize);
      
      // Preparar valores para INSERT
      const values = batch.map(row => 
        `('${row.codigo_modular}', '${row.nombre.replace(/'/g, "''")}', '${row.nivel}', ` +
        `${row.tipo_gestion ? `'${row.tipo_gestion}'` : 'NULL'}, ` +
        `${row.departamento ? `'${row.departamento}'` : 'NULL'}, ` +
        `${row.provincia ? `'${row.provincia}'` : 'NULL'}, ` +
        `${row.distrito ? `'${row.distrito}'` : 'NULL'}, ` +
        `${row.direccion ? `'${row.direccion.replace(/'/g, "''")}'` : 'NULL'}, ` +
        `'${row.estado || 'Activo'}')`
      ).join(',\n');

      await tursoClient.execute(`
        INSERT OR REPLACE INTO education_institutions_minedu 
        (codigo_modular, nombre, nivel, tipo_gestion, departamento, provincia, distrito, direccion, estado)
        VALUES ${values}
      `);

      inserted += batch.length;
      const progress = ((inserted / totalRecords) * 100).toFixed(1);
      process.stdout.write(`\r  Progreso: ${inserted.toLocaleString()}/${totalRecords.toLocaleString()} (${progress}%)`);
    }

    console.log('\n✅ Datos insertados\n');

    // 5. Verificar datos en Turso
    console.log('🔍 Verificando datos en Turso...');
    const countResult = await tursoClient.execute(`
      SELECT COUNT(*) as count FROM education_institutions_minedu
    `);
    const count = countResult.rows[0].count as number;
    console.log(`✅ Total de registros en Turso: ${count.toLocaleString()}\n`);

    // 6. Estadísticas por nivel
    console.log('📊 Estadísticas por nivel:');
    const statsResult = await tursoClient.execute(`
      SELECT nivel, COUNT(*) as count 
      FROM education_institutions_minedu 
      GROUP BY nivel 
      ORDER BY count DESC
    `);
    statsResult.rows.forEach((row: any) => {
      console.log(`  - ${row.nivel}: ${row.count.toLocaleString()} instituciones`);
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Próximos pasos:');
    console.log('1. Actualizar endpoints para usar Turso');
    console.log('2. Probar búsqueda de instituciones');
    console.log('3. Verificar rendimiento de queries');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    await pgClient.end();
    tursoClient.close();
  }
}

migrateMineduData().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
