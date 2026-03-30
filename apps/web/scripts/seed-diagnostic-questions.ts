/**
 * Seed Script for Diagnostic Module
 * 
 * Seeds the database with:
 * - 5 standard dimensions (categories)
 * - 23 base questions in first person with pedagogical tone
 * 
 * Usage: pnpm tsx scripts/seed-diagnostic-questions.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { diagnosticCategories, diagnosticQuestions } from '@/lib/db/schema';

const categories = [
  {
    id: 'cat-manejo-info',
    code: 'MANEJO_INFO',
    institutionId: null, // Standard Flip category
    name: 'Manejo de Información',
    description: 'Capacidad para buscar, evaluar y organizar información digital',
    order: 1,
    isActive: true,
  },
  {
    id: 'cat-ia-generativa',
    code: 'IA_GENERATIVA',
    institutionId: null,
    name: 'IA Generativa',
    description: 'Uso efectivo de herramientas de inteligencia artificial',
    order: 2,
    isActive: true,
  },
  {
    id: 'cat-herramientas-digitales',
    code: 'HERRAMIENTAS_DIGITALES',
    institutionId: null,
    name: 'Herramientas Digitales',
    description: 'Dominio de aplicaciones y plataformas educativas',
    order: 3,
    isActive: true,
  },
  {
    id: 'cat-ciudadania-digital',
    code: 'CIUDADANIA_DIGITAL',
    institutionId: null,
    name: 'Ciudadanía Digital',
    description: 'Comportamiento ético y seguro en entornos digitales',
    order: 4,
    isActive: true,
  },
  {
    id: 'cat-innovacion-pedagogica',
    code: 'INNOVACION_PEDAGOGICA',
    institutionId: null,
    name: 'Innovación Pedagógica',
    description: 'Integración de tecnología en procesos de enseñanza-aprendizaje',
    order: 5,
    isActive: true,
  },
];

const questions = [
  // Manejo de Información (5 preguntas)
  {
    id: 'q-manejo-info-01',
    code: 'MANEJO_INFO_01',
    categoryId: 'cat-manejo-info',
    institutionId: null,
    text: '¿Puedo buscar información en internet usando palabras clave efectivas?',
    order: 1,
    isActive: true,
  },
  {
    id: 'q-manejo-info-02',
    code: 'MANEJO_INFO_02',
    categoryId: 'cat-manejo-info',
    institutionId: null,
    text: '¿Sé evaluar si una fuente de información en línea es confiable?',
    order: 2,
    isActive: true,
  },
  {
    id: 'q-manejo-info-03',
    code: 'MANEJO_INFO_03',
    categoryId: 'cat-manejo-info',
    institutionId: null,
    text: '¿Puedo organizar archivos y carpetas digitales de manera ordenada?',
    order: 3,
    isActive: true,
  },
  {
    id: 'q-manejo-info-04',
    code: 'MANEJO_INFO_04',
    categoryId: 'cat-manejo-info',
    institutionId: null,
    text: '¿Sé usar herramientas de almacenamiento en la nube (Drive, OneDrive)?',
    order: 4,
    isActive: true,
  },
  {
    id: 'q-manejo-info-05',
    code: 'MANEJO_INFO_05',
    categoryId: 'cat-manejo-info',
    institutionId: null,
    text: '¿Puedo compartir archivos digitales de forma segura con mis colegas?',
    order: 5,
    isActive: true,
  },
  
  // IA Generativa (4 preguntas)
  {
    id: 'q-ia-gen-01',
    code: 'IA_GEN_01',
    categoryId: 'cat-ia-generativa',
    institutionId: null,
    text: '¿Conozco qué es la inteligencia artificial y cómo funciona?',
    order: 1,
    isActive: true,
  },
  {
    id: 'q-ia-gen-02',
    code: 'IA_GEN_02',
    categoryId: 'cat-ia-generativa',
    institutionId: null,
    text: '¿Puedo usar ChatGPT u otras IA para preparar materiales educativos?',
    order: 2,
    isActive: true,
  },
  {
    id: 'q-ia-gen-03',
    code: 'IA_GEN_03',
    categoryId: 'cat-ia-generativa',
    institutionId: null,
    text: '¿Sé escribir prompts efectivos para obtener mejores resultados de la IA?',
    order: 3,
    isActive: true,
  },
  {
    id: 'q-ia-gen-04',
    code: 'IA_GEN_04',
    categoryId: 'cat-ia-generativa',
    institutionId: null,
    text: '¿Puedo evaluar críticamente las respuestas generadas por IA?',
    order: 4,
    isActive: true,
  },
  
  // Herramientas Digitales (5 preguntas)
  {
    id: 'q-herr-dig-01',
    code: 'HERR_DIG_01',
    categoryId: 'cat-herramientas-digitales',
    institutionId: null,
    text: '¿Puedo crear presentaciones digitales atractivas (PowerPoint, Canva)?',
    order: 1,
    isActive: true,
  },
  {
    id: 'q-herr-dig-02',
    code: 'HERR_DIG_02',
    categoryId: 'cat-herramientas-digitales',
    institutionId: null,
    text: '¿Sé usar hojas de cálculo para organizar datos (Excel, Sheets)?',
    order: 2,
    isActive: true,
  },
  {
    id: 'q-herr-dig-03',
    code: 'HERR_DIG_03',
    categoryId: 'cat-herramientas-digitales',
    institutionId: null,
    text: '¿Puedo crear formularios digitales para encuestas o evaluaciones?',
    order: 3,
    isActive: true,
  },
  {
    id: 'q-herr-dig-04',
    code: 'HERR_DIG_04',
    categoryId: 'cat-herramientas-digitales',
    institutionId: null,
    text: '¿Sé usar plataformas de videoconferencia (Zoom, Meet, Teams)?',
    order: 4,
    isActive: true,
  },
  {
    id: 'q-herr-dig-05',
    code: 'HERR_DIG_05',
    categoryId: 'cat-herramientas-digitales',
    institutionId: null,
    text: '¿Puedo editar videos básicos para mis clases?',
    order: 5,
    isActive: true,
  },
  
  // Ciudadanía Digital (4 preguntas)
  {
    id: 'q-ciud-dig-01',
    code: 'CIUD_DIG_01',
    categoryId: 'cat-ciudadania-digital',
    institutionId: null,
    text: '¿Conozco las normas de comportamiento apropiado en entornos digitales?',
    order: 1,
    isActive: true,
  },
  {
    id: 'q-ciud-dig-02',
    code: 'CIUD_DIG_02',
    categoryId: 'cat-ciudadania-digital',
    institutionId: null,
    text: '¿Sé proteger mi información personal y contraseñas en línea?',
    order: 2,
    isActive: true,
  },
  {
    id: 'q-ciud-dig-03',
    code: 'CIUD_DIG_03',
    categoryId: 'cat-ciudadania-digital',
    institutionId: null,
    text: '¿Puedo identificar y prevenir el ciberbullying entre estudiantes?',
    order: 3,
    isActive: true,
  },
  {
    id: 'q-ciud-dig-04',
    code: 'CIUD_DIG_04',
    categoryId: 'cat-ciudadania-digital',
    institutionId: null,
    text: '¿Conozco los derechos de autor y uso ético de contenido digital?',
    order: 4,
    isActive: true,
  },
  
  // Innovación Pedagógica (5 preguntas)
  {
    id: 'q-innov-ped-01',
    code: 'INNOV_PED_01',
    categoryId: 'cat-innovacion-pedagogica',
    institutionId: null,
    text: '¿Puedo diseñar actividades de aprendizaje que integren tecnología?',
    order: 1,
    isActive: true,
  },
  {
    id: 'q-innov-ped-02',
    code: 'INNOV_PED_02',
    categoryId: 'cat-innovacion-pedagogica',
    institutionId: null,
    text: '¿Sé usar plataformas educativas (Moodle, Classroom, Edmodo)?',
    order: 2,
    isActive: true,
  },
  {
    id: 'q-innov-ped-03',
    code: 'INNOV_PED_03',
    categoryId: 'cat-innovacion-pedagogica',
    institutionId: null,
    text: '¿Puedo crear recursos interactivos para mis estudiantes?',
    order: 3,
    isActive: true,
  },
  {
    id: 'q-innov-ped-04',
    code: 'INNOV_PED_04',
    categoryId: 'cat-innovacion-pedagogica',
    institutionId: null,
    text: '¿Sé evaluar el aprendizaje de mis estudiantes usando herramientas digitales?',
    order: 4,
    isActive: true,
  },
  {
    id: 'q-innov-ped-05',
    code: 'INNOV_PED_05',
    categoryId: 'cat-innovacion-pedagogica',
    institutionId: null,
    text: '¿Puedo adaptar mi enseñanza según las necesidades digitales de mis estudiantes?',
    order: 5,
    isActive: true,
  },
];

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    console.log('🌱 Seeding diagnostic data...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('');
    
    // Insert categories
    console.log('📦 Inserting 5 diagnostic categories...');
    await db.insert(diagnosticCategories)
      .values(categories)
      .onConflictDoNothing(); // Skip if already exists
    
    console.log('✅ Categories inserted');
    
    // Insert questions
    console.log('📦 Inserting 23 diagnostic questions...');
    await db.insert(diagnosticQuestions)
      .values(questions)
      .onConflictDoNothing(); // Skip if already exists
    
    console.log('✅ Questions inserted');
    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 5 categories (dimensions)');
    console.log('   - 23 questions total');
    console.log('   - Manejo de Información: 5 questions');
    console.log('   - IA Generativa: 4 questions');
    console.log('   - Herramientas Digitales: 5 questions');
    console.log('   - Ciudadanía Digital: 4 questions');
    console.log('   - Innovación Pedagógica: 5 questions');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
