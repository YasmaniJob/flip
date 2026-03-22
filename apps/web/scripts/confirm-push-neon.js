#!/usr/bin/env node

/**
 * Script para confirmar automáticamente el push a Neon
 * Ejecuta drizzle-kit push y responde "Yes" automáticamente
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando push del schema a Neon...\n');

const drizzleKit = spawn('pnpm', ['drizzle-kit', 'push'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

// Esperar un momento para que drizzle-kit muestre el preview
setTimeout(() => {
  console.log('\n✅ Confirmando ejecución...\n');
  drizzleKit.stdin.write('Yes\n');
  drizzleKit.stdin.end();
}, 5000);

drizzleKit.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Push completado exitosamente!');
  } else {
    console.error(`\n❌ Error: El proceso terminó con código ${code}`);
    process.exit(code);
  }
});

drizzleKit.on('error', (error) => {
  console.error('❌ Error al ejecutar drizzle-kit:', error);
  process.exit(1);
});
