/**
 * Schema de Turso para datos de referencia MINEDU
 * Base de datos edge para consultas rápidas de instituciones educativas
 */

import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

// ============================================
// EDUCATION INSTITUTIONS (MINEDU Registry)
// ============================================
export const educationInstitutionsMinedu = sqliteTable('education_institutions_minedu', {
    codigoModular: text('codigo_modular').primaryKey(),
    nombre: text('nombre').notNull(),
    nivel: text('nivel').notNull(), // 'Primaria' | 'Secundaria'
    tipoGestion: text('tipo_gestion'), // 'Pública' | 'Privada'
    departamento: text('departamento'),
    provincia: text('provincia'),
    distrito: text('distrito'),
    direccion: text('direccion'),
    estado: text('estado').default('Activo'),
}, (table) => ({
    nivelIdx: index('idx_ie_minedu_nivel').on(table.nivel),
    departamentoIdx: index('idx_ie_minedu_departamento').on(table.departamento),
    nombreIdx: index('idx_ie_minedu_nombre').on(table.nombre),
}));

export type EducationInstitutionMinedu = typeof educationInstitutionsMinedu.$inferSelect;
export type NewEducationInstitutionMinedu = typeof educationInstitutionsMinedu.$inferInsert;
