#!/usr/bin/env tsx

/**
 * Script para verificar datos en Turso
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL o TURSO_AUTH_TOKEN no están definidas');
  process.exit(1);
}

async function verifyTurso() {
  console.log('🔍 Verificando datos en Turso...\n');

  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });

  try {
    // Verificar si la tabla existe
    const tablesResult = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='education_institutions_minedu'
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  La tabla education_institutions_minedu NO existe en Turso');
      return;
    }

    console.log('✅ Tabla education_institutions_minedu existe\n');

    // Contar registros
    const countResult = await client.execute(`
      SELECT COUNT(*) as count FROM education_institutions_minedu
    `);
    const count = countResult.rows[0].count as number;
    console.log(`📊 Total de registros: ${count.toLocaleString()}\n`);

    // Estadísticas por nivel
    console.log('📊 Estadísticas por nivel:');
    const statsResult = await client.execute(`
      SELECT nivel, COUNT(*) as count 
      FROM education_institutions_minedu 
      GROUP BY nivel 
      ORDER BY count DESC
    `);
    statsResult.rows.forEach((row: any) => {
      console.log(`  - ${row.nivel}: ${row.count.toLocaleString()} instituciones`);
    });

    // Estadísticas por departamento (top 10)
    console.log('\n📊 Top 10 departamentos:');
    const deptResult = await client.execute(`
      SELECT departamento, COUNT(*) as count 
      FROM education_institutions_minedu 
      WHERE departamento IS NOT NULL
      GROUP BY departamento 
      ORDER BY count DESC
      LIMIT 10
    `);
    deptResult.rows.forEach((row: any, i: number) => {
      console.log(`  ${i + 1}. ${row.departamento}: ${row.count.toLocaleString()} instituciones`);
    });

    // Muestra de datos
    console.log('\n📋 Muestra de datos (primeros 5 registros):');
    const sampleResult = await client.execute(`
      SELECT codigo_modular, nombre, nivel, departamento 
      FROM education_institutions_minedu 
      LIMIT 5
    `);
    sampleResult.rows.forEach((row: any, i: number) => {
      console.log(`  ${i + 1}. ${row.codigo_modular} - ${row.nombre} (${row.nivel}, ${row.departamento})`);
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Verificación completada');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    throw error;
  } finally {
    client.close();
  }
}

verifyTurso().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
