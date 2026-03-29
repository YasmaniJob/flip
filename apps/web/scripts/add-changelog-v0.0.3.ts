import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { changelog } from '../src/lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';

// Cliente Turso
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const db = drizzle(turso);

async function main() {
  const version = '0.0.3';
  const title = 'Optimización de Performance Institucional';
  
  const improvements = [
    'Optimización de carga en Dashboard: Reducción del payload de agendas y préstamos en un 98% mediante límites dinámicos (limit=5).',
    'Eliminación de waterfalls de datos: Paralelización de peticiones de sesión e institución mediante un nuevo hook unificado.',
    'Carga de gestión sin latencia: Reducción drástica del tiempo de entrada a los módulos de Personal y Dashboard mediante desacoplamiento de validación de sesión.',
    'Limpieza de componentes legacy: Remoción de moléculas y alertas obsoletas para unificar la experiencia Jira Flat.'
  ];

  const fixes = [
    'Corrección de dependencias secuenciales en el ciclo de vida de React Query para evitar cuellos de botella.',
    'Sincronización de loaders y estados de carga entre Sidebar y contenido principal.'
  ];

  // Calcular sortOrder basado en la versión
  const [major, minor, patch] = version.split('.').map(Number);
  const sortOrder = major * 10000 + minor * 100 + patch;

  // Insertar en Turso (Usar Date.now() para consistencia con v0.0.2)
  try {
    // Usar turso.execute directamente para evitar problemas de Drizzle con SQLite now()
    await turso.execute({
      sql: `INSERT INTO changelog (id, version, title, date, improvements, fixes, published, sort_order, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `v${version}`,
        version,
        title,
        Date.now(),
        JSON.stringify(improvements),
        JSON.stringify(fixes),
        1,
        sortOrder,
        Date.now(),
      ]
    });

    console.log(`✅ Changelog v${version} creado exitosamente en Turso`);
    
    // Actualizar package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        packageJson.version = version;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
        console.log(`✅ Versión actualizada a ${version} en package.json`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
