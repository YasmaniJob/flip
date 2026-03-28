import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { changelog } from '../src/lib/schema';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const db = drizzle(turso);

const changelogData = [
  {
    id: 'cl-2.6.0',
    version: '2.6.0',
    title: 'Optimización de Rendimiento',
    date: new Date('2026-03-28'),
    improvements: [
      'Carga 40% más rápida en vista móvil de reservaciones',
      'Búsqueda ampliada en personal: ahora incluye teléfono y rol',
      'Reducción de 20-23% en tamaño de páginas principales',
      'Animaciones de carga más fluidas en todas las listas',
      'Índices de base de datos para búsquedas instantáneas'
    ],
    fixes: [
      'Corregido solapamiento en registro inicial desde móvil',
      'Solucionado error de colores en configuración de categorías',
      'Validación mejorada en plantillas de recursos'
    ],
    published: true,
    sortOrder: 1,
    createdAt: new Date()
  },
  {
    id: 'cl-2.5.0',
    version: '2.5.0',
    title: 'Actualización Tecnológica Mayor',
    date: new Date('2026-03-20'),
    improvements: [
      'Migración a Next.js 15 para mejor rendimiento',
      'Actualización a React 19 con nuevas capacidades',
      'Sistema de caché optimizado para consultas frecuentes',
      'Mejoras en velocidad de carga de componentes'
    ],
    fixes: [
      'Actualización de sistema de consultas al servidor',
      'Corrección en rutas de autenticación'
    ],
    published: true,
    sortOrder: 2,
    createdAt: new Date()
  },
  {
    id: 'cl-2.4.0',
    version: '2.4.0',
    title: 'Renovación del Módulo de Préstamos',
    date: new Date('2026-02-15'),
    improvements: [
      'Interfaz rediseñada más intuitiva para préstamos',
      'Historial completo de préstamos por docente y recurso',
      'Notificaciones automáticas de devoluciones pendientes',
      'Búsqueda avanzada por múltiples criterios',
      'Filtros por estado, fecha y tipo de recurso'
    ],
    fixes: [],
    published: true,
    sortOrder: 3,
    createdAt: new Date()
  }
];

async function seed() {
  console.log('🌱 Seeding changelog...');
  
  for (const entry of changelogData) {
    await db.insert(changelog).values(entry).onConflictDoNothing();
    console.log(`✓ Added version ${entry.version}`);
  }
  
  console.log('✅ Changelog seeded successfully');
}

seed().catch(console.error);
