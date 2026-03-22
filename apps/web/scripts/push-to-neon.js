#!/usr/bin/env node

/**
 * Script para ejecutar drizzle-kit push con confirmación automática
 * Uso: node scripts/push-to-neon.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando push del schema a Neon...\n');

const drizzleKit = spawn('pnpm', ['drizzle-kit', 'push'], {
  cwd: path.join(__dirname, '..'),
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

// Esperar un momento para que drizzle-kit muestre el preview
setTimeout(() => {
  console.log('\n✅ Confirmando push...\n');
  drizzleKit.stdin.write('y\n');
  drizzleKit.stdin.end();
}, 5000);

drizzleKit.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Push completado exitosamente!');
  } else {
    console.log(`\n❌ Push falló con código: ${code}`);
  }
  process.exit(code);
});

drizzleKit.on('error', (err) => {
  console.error('❌ Error al ejecutar drizzle-kit:', err);
  process.exit(1);
});
