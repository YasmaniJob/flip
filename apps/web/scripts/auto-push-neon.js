#!/usr/bin/env node

/**
 * Script para ejecutar drizzle-kit push con confirmación automática
 * Usa un enfoque más robusto para simular la entrada del usuario
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando push del schema a Neon...\n');

const drizzleKit = spawn('pnpm', ['drizzle-kit', 'push'], {
  cwd: path.join(__dirname, '..'),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';
let errorOutput = '';

// Capturar stdout
drizzleKit.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
  
  // Detectar cuando drizzle-kit está esperando confirmación
  if (text.includes('❯ No, abort') || text.includes('Yes, I want to execute')) {
    console.log('\n✅ Detectado prompt de confirmación, enviando "Yes"...\n');
    // Enviar tecla de flecha abajo para seleccionar "Yes"
    drizzleKit.stdin.write('\x1B[B'); // Arrow down
    setTimeout(() => {
      drizzleKit.stdin.write('\n'); // Enter
    }, 500);
  }
});

// Capturar stderr
drizzleKit.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  process.stderr.write(text);
});

drizzleKit.on('close', (code) => {
  console.log('\n' + '='.repeat(60));
  if (code === 0) {
    console.log('✅ Push completado exitosamente!');
    console.log('\nPróximos pasos:');
    console.log('1. Verificar tablas creadas en Neon');
    console.log('2. Confirmar que education_institutions_minedu NO existe');
    console.log('3. Revisar docs/INSTRUCCIONES_PUSH_NEON.md para queries de verificación');
  } else {
    console.log(`❌ Push falló con código: ${code}`);
    console.log('\nPosibles causas:');
    console.log('- Confirmación no detectada correctamente');
    console.log('- Error de conexión a Neon');
    console.log('- Tablas ya existen en Neon');
    console.log('\nIntenta ejecutar manualmente: pnpm drizzle-kit push');
  }
  console.log('='.repeat(60) + '\n');
  process.exit(code);
});

drizzleKit.on('error', (err) => {
  console.error('❌ Error al ejecutar drizzle-kit:', err);
  process.exit(1);
});

// Timeout de seguridad (60 segundos)
setTimeout(() => {
  console.log('\n⏱️  Timeout alcanzado. Terminando proceso...');
  drizzleKit.kill();
  process.exit(1);
}, 60000);
