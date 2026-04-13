// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

/**
 * Verify trial configuration is working correctly
 */

import { getTrialDays, getTrialConfig } from '../src/lib/trial-config';

async function verifyTrialConfig() {
  console.log('🔍 Verificando configuración de trial...\n');

  try {
    // 1. Get trial days
    console.log('1️⃣  Obteniendo días de trial configurados...');
    const trialDays = await getTrialDays();
    console.log(`   ✓ Trial Days: ${trialDays} días\n`);

    // 2. Get full config
    console.log('2️⃣  Obteniendo configuración completa...');
    const config = await getTrialConfig();
    console.log(`   ✓ Trial Days: ${config.trialDays} días`);
    console.log(`   ✓ Última actualización: ${config.updatedAt}`);
    console.log(`   ✓ Actualizado por: ${config.updatedBy}\n`);

    // 3. Calculate example trial end date
    console.log('3️⃣  Calculando fecha de fin de trial para nueva institución...');
    const now = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
    
    console.log(`   ✓ Fecha actual: ${now.toLocaleDateString('es-PE')}`);
    console.log(`   ✓ Trial terminaría: ${trialEndsAt.toLocaleDateString('es-PE')}`);
    console.log(`   ✓ Duración: ${trialDays} días\n`);

    console.log('✅ Configuración de trial funcionando correctamente');
    console.log('\n📝 Resumen:');
    console.log(`   - Las nuevas instituciones tendrán ${trialDays} días de prueba`);
    console.log(`   - La configuración se puede cambiar en /suscripciones`);
    console.log(`   - Los cambios solo afectan a instituciones nuevas`);
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    throw error;
  }
}

verifyTrialConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verificación fallida:', error);
    process.exit(1);
  });
