import * as dotenv from 'dotenv';
import * as path from 'path';

// Force dotenv to load .env.local from current app root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@libsql/client';
import * as fs from 'fs';

// Cliente Turso
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  const version = '0.0.5';
  const title = 'Módulo de Diagnóstico, Nueva Landing y Diseño Jira Flat';

  const improvements = [
    'Lanzamiento del Panel Administrativo del Módulo de Diagnóstico de Habilidades Digitales, permitiendo controlar accesos y previsualización estandarizada.',
    'Implementación del sistema "Catálogo Cerrado" para preguntas: Los administradores ahora pueden alternar entre preguntas institucionales base y preguntas personalizadas.',
    'Rediseño completo de la Landing Page pública en Astro (flip.org.pe), inspirada en principios anti-gravity con componentes dinámicos de alta velocidad.',
    'Expansión progresiva del sistema de diseño "Jira Flat" a módulos de Inventario y Control de Reservas PIP para máxima consistencia.',
    'Superadmins ahora tienen visión panorámica y control de asistencia sobre todos los talleres institucionales desde el hub principal.',
  ];

  const fixes = [
    'Corrección de cascadas de peticiones (Architectural double-fetching) en selectores de institución, reduciendo drásticamente la carga de red.',
    'Solución al error de superposición (z-index) y desbordamiento en selectores del onboarding móvil para institutos.',
    'Corrección en la asignación masiva concurrente de IDs de recursos (condiciones de carrera) durante la carga en inventario.',
  ];

  // Calcular sortOrder basado en la versión
  const [major, minor, patch] = version.split('.').map(Number);
  const sortOrder = major * 10000 + minor * 100 + patch;

  try {
    // Intentar borrar versión existente si existe (para re-ejecución segura)
    await turso.execute({
      sql: `DELETE FROM changelog WHERE id = ?`,
      args: [`v${version}`],
    });

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
    console.log(`\n📝 Resumen:`);
    console.log(`   Versión: ${version}`);
    console.log(`   Título: ${title}`);
    console.log(`   Mejoras: ${improvements.length}`);
    console.log(`   Correcciones: ${fixes.length}`);

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
