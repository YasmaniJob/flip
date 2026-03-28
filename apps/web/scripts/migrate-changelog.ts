import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function migrate() {
  console.log('🚀 Migrando tabla de changelog a Turso...');
  
  try {
    // Create table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS "changelog" (
        "id" text PRIMARY KEY NOT NULL,
        "version" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "date" integer NOT NULL,
        "improvements" text,
        "fixes" text,
        "published" integer DEFAULT 1,
        "sort_order" integer DEFAULT 0,
        "created_at" integer NOT NULL
      )
    `);
    console.log('✅ Tabla creada');

    // Create indexes
    await turso.execute(`CREATE INDEX IF NOT EXISTS "idx_changelog_version" ON "changelog" ("version")`);
    await turso.execute(`CREATE INDEX IF NOT EXISTS "idx_changelog_published" ON "changelog" ("published")`);
    await turso.execute(`CREATE INDEX IF NOT EXISTS "idx_changelog_sort" ON "changelog" ("sort_order")`);
    console.log('✅ Índices creados');

    // Insert data
    const entries = [
      {
        id: 'cl-2.6.0',
        version: '2.6.0',
        title: 'Optimización de Rendimiento',
        date: new Date('2026-03-28').getTime(),
        improvements: JSON.stringify([
          'Carga 40% más rápida en vista móvil de reservaciones',
          'Búsqueda ampliada en personal: ahora incluye teléfono y rol',
          'Reducción de 20-23% en tamaño de páginas principales',
          'Animaciones de carga más fluidas en todas las listas',
          'Índices de base de datos para búsquedas instantáneas'
        ]),
        fixes: JSON.stringify([
          'Corregido solapamiento en registro inicial desde móvil',
          'Solucionado error de colores en configuración de categorías',
          'Validación mejorada en plantillas de recursos'
        ]),
        sortOrder: 1
      },
      {
        id: 'cl-2.5.0',
        version: '2.5.0',
        title: 'Actualización Tecnológica Mayor',
        date: new Date('2026-03-20').getTime(),
        improvements: JSON.stringify([
          'Migración a Next.js 15 para mejor rendimiento',
          'Actualización a React 19 con nuevas capacidades',
          'Sistema de caché optimizado para consultas frecuentes',
          'Mejoras en velocidad de carga de componentes'
        ]),
        fixes: JSON.stringify([
          'Actualización de sistema de consultas al servidor',
          'Corrección en rutas de autenticación'
        ]),
        sortOrder: 2
      },
      {
        id: 'cl-2.4.0',
        version: '2.4.0',
        title: 'Renovación del Módulo de Préstamos',
        date: new Date('2026-02-15').getTime(),
        improvements: JSON.stringify([
          'Interfaz rediseñada más intuitiva para préstamos',
          'Historial completo de préstamos por docente y recurso',
          'Notificaciones automáticas de devoluciones pendientes',
          'Búsqueda avanzada por múltiples criterios',
          'Filtros por estado, fecha y tipo de recurso'
        ]),
        fixes: null,
        sortOrder: 3
      }
    ];

    for (const entry of entries) {
      await turso.execute({
        sql: `INSERT OR IGNORE INTO changelog (id, version, title, date, improvements, fixes, published, sort_order, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [
          entry.id,
          entry.version,
          entry.title,
          entry.date,
          entry.improvements,
          entry.fixes,
          entry.sortOrder,
          Date.now()
        ]
      });
      console.log(`✅ Insertada versión ${entry.version}`);
    }

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

migrate().catch(console.error);
