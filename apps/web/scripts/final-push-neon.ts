#!/usr/bin/env tsx

/**
 * Script final para migrar schema a Neon
 * Genera SQL con drizzle-kit y lo ejecuta directamente
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida en .env.local');
  process.exit(1);
}

async function pushToNeon() {
  console.log('🚀 Iniciando migración a Neon...\n');
  
  try {
    // 1. Generar SQL con drizzle-kit
    console.log('📝 Generando SQL de migración...');
    execSync('pnpm drizzle-kit generate', {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    console.log('✅ SQL generado\n');

    // 2. Leer el archivo SQL más reciente
    const drizzleDir = join(process.cwd(), 'drizzle');
    const files = readdirSync(drizzleDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error('No se encontró archivo SQL de migración');
    }

    const sqlFile = join(drizzleDir, files[0]);
    console.log(`📄 Leyendo SQL desde: ${files[0]}`);
    const sqlContent = readFileSync(sqlFile, 'utf-8');
    console.log('✅ SQL leído\n');

    // 3. Conectar a Neon y ejecutar SQL
    console.log('🔌 Conectando a Neon...');
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Conectado a Neon\n');

    // 4. Ejecutar SQL
    console.log('⚡ Ejecutando SQL en Neon...');
    await client.query(sqlContent);
    console.log('✅ SQL ejecutado\n');

    // 5. Verificar tablas creadas
    console.log('🔍 Verificando tablas creadas...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n📊 Total de tablas: ${result.rows.length}\n`);
    console.log('Tablas creadas:');
    result.rows.forEach((row, i) => {
      console.log(`  ${(i + 1).toString().padStart(2, ' ')}. ${row.table_name}`);
    });

    // 6. Verificar que education_institutions_minedu NO existe
    const minedCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'education_institutions_minedu'
    `);

    console.log('');
    if (minedCheck.rows.length === 0) {
      console.log('✅ Confirmado: education_institutions_minedu NO existe en Neon');
    } else {
      console.log('⚠️  ADVERTENCIA: education_institutions_minedu SÍ existe en Neon');
    }

    await client.end();

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Próximos pasos:');
    console.log('1. Verificar tablas en la consola de Neon');
    console.log('2. Configurar Turso para education_institutions_minedu');
    console.log('3. Migrar datos de instituciones a Turso');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  }
}

pushToNeon().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
