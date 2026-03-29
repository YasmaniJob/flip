import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

// Cliente Turso
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  const version = '0.0.4';
  const title = 'Hardening de Seguridad y Reservas';

  const improvements = [
    'Rediseño completo del módulo de talleres PIP: gestión de asistencia, reservas y reagendamiento con interfaz Jira Flat.',
    'Paginación real en inventario de recursos: las listas ahora cargan bajo demanda con límites seguros (máx. 100 ítems por página).',
    'Paginación real en reservas de aulas: reemplaza la carga de 1,000 registros en memoria por consultas paginadas a base de datos.',
    'Rate limiting en endpoints sensibles: autenticación, registro, búsquedas de personal y recursos están protegidos contra abuso.',
    'Cabeceras de seguridad HTTP activadas: X-Frame-Options, HSTS, nosniff, Permissions-Policy y Referrer-Policy en todas las rutas.',
  ];

  const fixes = [
    'Corrección de asignación masiva en tareas de reuniones: solo se permiten actualizar campos autorizados.',
    'Eliminada exposición de stack traces internos en el panel de administración de suscripciones.',
    'Contraseña interna del flujo de registro simplificado ahora usa HMAC-SHA256 con secreto de servidor, reemplazando el patrón predecible anterior.',
    'Corrección de fechas y orden de versiones en el changelog.',
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
