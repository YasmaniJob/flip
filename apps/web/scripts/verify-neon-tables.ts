#!/usr/bin/env tsx

/**
 * Script para verificar las tablas creadas en Neon
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida en .env.local');
  process.exit(1);
}

async function verifyTables() {
  const sql = neon(DATABASE_URL);

  try {
    console.log('🔍 Verificando tablas en Neon...\n');

    // Obtener todas las tablas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(`📊 Total de tablas: ${tables.length}\n`);
    console.log('Tablas creadas:');
    tables.forEach((t: any, i: number) => {
      console.log(`  ${(i + 1).toString().padStart(2, ' ')}. ${t.table_name}`);
    });

    // Verificar que education_institutions_minedu NO existe
    const minedTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'education_institutions_minedu'
    `;

    console.log('');
    if (minedTable.length === 0) {
      console.log('✅ Confirmado: education_institutions_minedu NO existe en Neon');
    } else {
      console.log('⚠️  ADVERTENCIA: education_institutions_minedu SÍ existe en Neon');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Verificación completada');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    throw error;
  }
}

verifyTables().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
