import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Cliente Turso
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  const version = '2.7.0';
  const title = 'Configuración Flexible de Suscripciones';
  
  const improvements = [
    'Panel de configuración para período de prueba: ahora puedes establecer cuántos días de trial tendrán las nuevas instituciones (1-365 días)',
    'Configuración manual del año del diagnóstico: permite asignar el año del período de evaluación desde el panel de administración',
    'Interfaz visual para gestión de trials: configura el período de prueba con clicks, sin editar archivos de configuración'
  ];
  
  const fixes: string[] = [];

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
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Versión actualizada a ${version} en package.json`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
