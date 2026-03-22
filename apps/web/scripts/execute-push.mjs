#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 Ejecutando push a Neon...\n');

const child = spawn('pnpm', ['drizzle-kit', 'push'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

// Esperar a que aparezca el prompt
await setTimeout(30000);

console.log('\n✅ Enviando confirmación...\n');

// Enviar flecha abajo y Enter para seleccionar "Yes"
child.stdin.write('\x1B[B'); // Flecha abajo
await setTimeout(500);
child.stdin.write('\n'); // Enter
child.stdin.end();

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Push completado exitosamente!');
  } else {
    console.error(`\n❌ Error: código ${code}`);
  }
  process.exit(code);
});
