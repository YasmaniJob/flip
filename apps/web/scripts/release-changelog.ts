import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { changelog } from '../src/lib/db/schema';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Leer versión del package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

// Cliente Turso
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const db = drizzle(turso);

// Interfaz para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log(`\n🚀 Creando changelog para versión: ${currentVersion}\n`);

  const title = await question('Título de la versión: ');
  
  console.log('\nMejoras (una por línea, línea vacía para terminar):');
  const improvements: string[] = [];
  while (true) {
    const improvement = await question('  - ');
    if (!improvement.trim()) break;
    improvements.push(improvement.trim());
  }

  console.log('\nCorrecciones (una por línea, línea vacía para terminar):');
  const fixes: string[] = [];
  while (true) {
    const fix = await question('  - ');
    if (!fix.trim()) break;
    fixes.push(fix.trim());
  }

  // Calcular sortOrder basado en la versión
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  const sortOrder = major * 10000 + minor * 100 + patch;

  // Insertar en Turso
  const newChangelog = {
    id: `v${currentVersion}`,
    version: currentVersion,
    title,
    date: new Date(),
    improvements,
    fixes,
    published: true,
    sortOrder,
  };

  try {
    await db.insert(changelog).values(newChangelog);
    console.log(`\n✅ Changelog v${currentVersion} creado exitosamente en Turso`);
    console.log(`\n📝 Resumen:`);
    console.log(`   Versión: ${currentVersion}`);
    console.log(`   Título: ${title}`);
    console.log(`   Mejoras: ${improvements.length}`);
    console.log(`   Correcciones: ${fixes.length}`);
  } catch (error) {
    console.error('\n❌ Error al insertar changelog:', error);
    process.exit(1);
  }

  rl.close();
}

main();
