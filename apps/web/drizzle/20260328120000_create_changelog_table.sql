-- Create changelog table for landing page
CREATE TABLE IF NOT EXISTS "changelog" (
    "id" text PRIMARY KEY NOT NULL,
    "version" text NOT NULL UNIQUE,
    "title" text NOT NULL,
    "date" timestamp NOT NULL,
    "improvements" jsonb,
    "fixes" jsonb,
    "published" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_changelog_version" ON "changelog" ("version");
CREATE INDEX IF NOT EXISTS "idx_changelog_published" ON "changelog" ("published");
CREATE INDEX IF NOT EXISTS "idx_changelog_sort" ON "changelog" ("sort_order");

-- Insert initial changelog data
INSERT INTO "changelog" ("id", "version", "title", "date", "improvements", "fixes", "published", "sort_order") VALUES
('cl-2.6.0', '2.6.0', 'Optimización de Rendimiento', '2026-03-28', 
 '["Carga 40% más rápida en vista móvil de reservaciones", "Búsqueda ampliada en personal: ahora incluye teléfono y rol", "Reducción de 20-23% en tamaño de páginas principales", "Animaciones de carga más fluidas en todas las listas", "Índices de base de datos para búsquedas instantáneas"]'::jsonb,
 '["Corregido solapamiento en registro inicial desde móvil", "Solucionado error de colores en configuración de categorías", "Validación mejorada en plantillas de recursos"]'::jsonb,
 true, 1),

('cl-2.5.0', '2.5.0', 'Actualización Tecnológica Mayor', '2026-03-20',
 '["Migración a Next.js 15 para mejor rendimiento", "Actualización a React 19 con nuevas capacidades", "Sistema de caché optimizado para consultas frecuentes", "Mejoras en velocidad de carga de componentes"]'::jsonb,
 '["Actualización de sistema de consultas al servidor", "Corrección en rutas de autenticación"]'::jsonb,
 true, 2),

('cl-2.4.0', '2.4.0', 'Renovación del Módulo de Préstamos', '2026-02-15',
 '["Interfaz rediseñada más intuitiva para préstamos", "Historial completo de préstamos por docente y recurso", "Notificaciones automáticas de devoluciones pendientes", "Búsqueda avanzada por múltiples criterios", "Filtros por estado, fecha y tipo de recurso"]'::jsonb,
 null,
 true, 3),

('cl-2.3.0', '2.3.0', 'Módulo de Reuniones Pedagógicas', '2026-02-01',
 '["Sistema completo para planificar reuniones de coordinación", "Registro de acuerdos con seguimiento de cumplimiento", "Asignación de tareas a docentes con fechas límite", "Integración con calendario de reservaciones del AIP"]'::jsonb,
 null,
 true, 4),

('cl-2.2.0', '2.2.0', 'Mejoras en Gestión de Inventario', '2026-01-15',
 '["Códigos QR para identificación rápida de recursos", "Estados de conservación con sistema de estrellas", "Historial de mantenimiento por equipo", "Alertas de equipos que requieren mantenimiento"]'::jsonb,
 null,
 true, 5);
