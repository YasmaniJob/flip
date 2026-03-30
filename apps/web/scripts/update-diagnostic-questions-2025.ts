/**
 * Update Script for Diagnostic Module - 2025 Version
 * 
 * Updates existing diagnostic data to 2025 version:
 * - Updates 5 category names and descriptions
 * - Deletes old 23 questions
 * - Inserts new 17 questions
 * 
 * Usage: pnpm tsx scripts/update-diagnostic-questions-2025.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { diagnosticCategories, diagnosticQuestions } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

const updatedCategories = [
  {
    id: 'cat-manejo-info',
    code: 'MANEJO_INFO',
    name: 'Manejo de Información y Alfabetización Digital',
    description: 'Capacidad para buscar, evaluar, organizar y gestionar información digital de manera segura',
  },
  {
    id: 'cat-comunicacion',
    code: 'COMUNICACION',
    name: 'Comunicación y Colaboración Digital',
    description: 'Habilidades para comunicarse y colaborar efectivamente usando herramientas digitales',
  },
  {
    id: 'cat-creacion',
    code: 'CREACION',
    name: 'Creación y Producción de Contenidos Digitales',
    description: 'Capacidad para crear, editar y producir contenidos multimedia educativos',
  },
  {
    id: 'cat-ia-educacion',
    code: 'IA_EDUCACION',
    name: 'Inteligencia Artificial en Educación',
    description: 'Uso crítico y efectivo de herramientas de IA para optimizar procesos educativos',
  },
  {
    id: 'cat-resolucion',
    code: 'RESOLUCION',
    name: 'Resolución de Problemas y Gestión Escolar',
    description: 'Capacidad para resolver problemas técnicos y usar sistemas de gestión escolar',
  },
];

const newQuestions = [
  // DIMENSIÓN 1: Manejo de Información y Alfabetización Digital (4 preguntas)
  {
    id: 'q-manejo-info-01',
    code: 'MANEJO_INFO_01',
    categoryId: 'cat-manejo-info',
    text: 'Organizo y muevo mis archivos educativos entre carpetas locales y servicios en la nube (Google Drive, OneDrive, etc.), asegurando que mi material esté disponible en cualquier lugar',
    order: 1,
  },
  {
    id: 'q-manejo-info-02',
    code: 'MANEJO_INFO_02',
    categoryId: 'cat-manejo-info',
    text: 'Utilizo herramientas de búsqueda avanzada y filtros específicos en internet para encontrar información académica y recursos pedagógicos de alta calidad para mis clases',
    order: 2,
  },
  {
    id: 'q-manejo-info-03',
    code: 'MANEJO_INFO_03',
    categoryId: 'cat-manejo-info',
    text: 'Identifico con seguridad la autoría y veracidad de los contenidos digitales que selecciono, verificando si las fuentes son confiables y respetando los derechos de autor',
    order: 3,
  },
  {
    id: 'q-manejo-info-04',
    code: 'MANEJO_INFO_04',
    categoryId: 'cat-manejo-info',
    text: 'Compruebo que las páginas web o aplicaciones móviles donde ingreso mis datos personales o de mis estudiantes sean sitios seguros y confiables',
    order: 4,
  },
  
  // DIMENSIÓN 2: Comunicación y Colaboración Digital (4 preguntas)
  {
    id: 'q-comunicacion-01',
    code: 'COMUNICACION_01',
    categoryId: 'cat-comunicacion',
    text: 'Invito a otros colegas y estudiantes a colaborar en el mismo archivo compartido, gestionando los permisos adecuados para que podamos co-crear contenidos en tiempo real',
    order: 1,
  },
  {
    id: 'q-comunicacion-02',
    code: 'COMUNICACION_02',
    categoryId: 'cat-comunicacion',
    text: 'Envío mensajes y correos electrónicos con archivos adjuntos de manera profesional para coordinar actividades con la comunidad educativa',
    order: 2,
  },
  {
    id: 'q-comunicacion-03',
    code: 'COMUNICACION_03',
    categoryId: 'cat-comunicacion',
    text: 'Publico contenido educativo de manera responsable en redes sociales (WhatsApp, Facebook, etc.), promoviendo una imagen positiva de mi labor docente',
    order: 3,
  },
  {
    id: 'q-comunicacion-04',
    code: 'COMUNICACION_04',
    categoryId: 'cat-comunicacion',
    text: 'Manejo con fluidez las funciones de videoconferencia (compartir pantalla, grabar, usar el chat, silenciar micros) para realizar sesiones virtuales de aprendizaje o reuniones',
    order: 4,
  },
  
  // DIMENSIÓN 3: Creación y Producción de Contenidos Digitales (3 preguntas)
  {
    id: 'q-creacion-01',
    code: 'CREACION_01',
    categoryId: 'cat-creacion',
    text: 'Diseño y elaboro mis propios documentos digitales y archivos multimedia (pódcast, infografías, presentaciones, videos) para enriquecer el aprendizaje de mis estudiantes',
    order: 1,
  },
  {
    id: 'q-creacion-02',
    code: 'CREACION_02',
    categoryId: 'cat-creacion',
    text: 'Reconozco y convierto diferentes formatos de archivo para asegurar que mis materiales sean compatibles con los diversos dispositivos que usan mis alumnos',
    order: 2,
  },
  {
    id: 'q-creacion-03',
    code: 'CREACION_03',
    categoryId: 'cat-creacion',
    text: 'Utilizo plataformas web para crear o modificar contenidos digitales, adaptándolos a las necesidades de mis sesiones de clase',
    order: 3,
  },
  
  // DIMENSIÓN 4: Inteligencia Artificial en Educación (4 preguntas)
  {
    id: 'q-ia-educacion-01',
    code: 'IA_EDUCACION_01',
    categoryId: 'cat-ia-educacion',
    text: 'Utilizo herramientas de IA Generativa para crear resúmenes automáticos, estructurar mis programaciones anuales, unidades y sesiones de aprendizaje, ahorrando tiempo administrativo',
    order: 1,
  },
  {
    id: 'q-ia-educacion-02',
    code: 'IA_EDUCACION_02',
    categoryId: 'cat-ia-educacion',
    text: 'Diseño materiales pedagógicos personalizados para mis estudiantes mediante el uso de plataformas de IA adaptativa o generativa',
    order: 2,
  },
  {
    id: 'q-ia-educacion-03',
    code: 'IA_EDUCACION_03',
    categoryId: 'cat-ia-educacion',
    text: 'Evalúo críticamente los contenidos generados por la IA para detectar posibles errores o sesgos, asegurando que el contenido sea académicamente correcto antes de usarlo',
    order: 3,
  },
  {
    id: 'q-ia-educacion-04',
    code: 'IA_EDUCACION_04',
    categoryId: 'cat-ia-educacion',
    text: 'Diseño actividades pedagógicas como quizzes automáticos o casos de estudio apoyándome en la IA para fortalecer mi labor de evaluación formativa',
    order: 4,
  },
  
  // DIMENSIÓN 5: Resolución de Problemas y Gestión Escolar (2 preguntas)
  {
    id: 'q-resolucion-01',
    code: 'RESOLUCION_01',
    categoryId: 'cat-resolucion',
    text: 'Identifico y resuelvo problemas técnicos básicos que puedan surgir durante el uso de la tecnología en el aula (fallos de conexión, archivos que no abren)',
    order: 1,
  },
  {
    id: 'q-resolucion-02',
    code: 'RESOLUCION_02',
    categoryId: 'cat-resolucion',
    text: 'Utilizo sistemas digitales de gestión escolar (Flip, Siagie) para registrar notas, asistencias e información pedagógica, facilitando la toma de decisiones basada en datos reales',
    order: 2,
  },
];

async function update() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    console.log('🔄 Updating diagnostic data to 2025 version...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('');
    
    // Step 1: Delete old standard questions (institutionId is null)
    console.log('🗑️  Step 1: Deleting old standard questions...');
    const deletedQuestions = await db.delete(diagnosticQuestions)
      .where(isNull(diagnosticQuestions.institutionId))
      .returning();
    console.log(`   ✓ Deleted ${deletedQuestions.length} old questions`);
    console.log('');
    
    // Step 2: Delete old standard categories (institutionId is null)
    console.log('🗑️  Step 2: Deleting old standard categories...');
    const deletedCategories = await db.delete(diagnosticCategories)
      .where(isNull(diagnosticCategories.institutionId))
      .returning();
    console.log(`   ✓ Deleted ${deletedCategories.length} old categories`);
    console.log('');
    
    // Step 3: Insert new categories
    console.log('📦 Step 3: Inserting 5 new categories...');
    await db.insert(diagnosticCategories)
      .values(updatedCategories.map((cat, index) => ({
        id: cat.id,
        code: cat.code,
        institutionId: null,
        name: cat.name,
        description: cat.description,
        order: index + 1,
        isActive: true,
      })));
    console.log('   ✓ Inserted 5 new categories');
    console.log('');
    
    // Step 4: Insert new questions
    console.log('📦 Step 4: Inserting 17 new questions...');
    await db.insert(diagnosticQuestions)
      .values(newQuestions.map(q => ({
        ...q,
        institutionId: null,
        isActive: true,
      })));
    console.log('   ✓ Inserted 17 new questions');
    console.log('');
    
    console.log('🎉 Update completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${deletedCategories.length} old categories deleted`);
    console.log('   - 5 new categories inserted');
    console.log(`   - ${deletedQuestions.length} old questions deleted`);
    console.log('   - 17 new questions inserted');
    console.log('');
    console.log('📋 New question distribution:');
    console.log('   - Manejo de Información y Alfabetización Digital: 4 questions');
    console.log('   - Comunicación y Colaboración Digital: 4 questions');
    console.log('   - Creación y Producción de Contenidos Digitales: 3 questions');
    console.log('   - Inteligencia Artificial en Educación: 4 questions');
    console.log('   - Resolución de Problemas y Gestión Escolar: 2 questions');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

update();
