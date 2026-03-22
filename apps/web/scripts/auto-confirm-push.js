#!/usr/bin/env node

/**
 * Script para confirmar automáticamente el push a Neon
 */

const { spawn } = require('child_process');

console.log('🚀 Ejecutando push a Neon con confirmación automática...\n');

const child = spawn('pnpm', ['drizzle-kit', 'push'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
  
  // Detectar cuando pide confirmación
  if (text.includes('Yes, I want to execute all statements') || 
      text.includes('❯ No, abort')) {
    console.log('\n✅ Enviando confirmación "Yes"...\n');
    child.stdin.write('\x1B[B\n'); // Flecha abajo para seleccionar "Yes"
  }
});

child.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  process.stderr.write(text);
});

child.on('close', (code) => {
  console.log(`\n📊 Proceso terminado con código: ${code}`);
  
  if (code === 0) {
    console.log('✅ Push completado exitosamente!');
  } else {
    console.error('❌ Error durante el push');
  }
  
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Error al ejecutar:', error);
  process.exit(1);
});
