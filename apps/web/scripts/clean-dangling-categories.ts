// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Now import everything else
import { db } from '../src/lib/db';
import {
  categories,
  categorySequences,
  resources,
  resourceTemplates,
  institutions,
} from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Script para limpiar categorías que apuntan a instituciones inexistentes
 * (dangling references)
 */

async function cleanDanglingCategories() {
  console.log('🧹 Iniciando limpieza de categorías con referencias rotas...\n');

  // 1. Encontrar categorías cuya institución no existe
  const danglingCategories = await db.execute(sql`
    SELECT c.id, c.name, c.institution_id, c.icon, c.color
    FROM categories c
    LEFT JOIN institutions i ON c.institution_id = i.id
    WHERE c.institution_id IS NOT NULL 
      AND i.id IS NULL
  `);

  if (danglingCategories.rows.length === 0) {
    console.log('✅ No se encontraron categorías con referencias rotas\n');
    return;
  }

  console.log(`📋 Encontradas ${danglingCategories.rows.length} categorías con referencias rotas:`);
  danglingCategories.rows.forEach((c: any) => {
    console.log(`   - ${c.name} (${c.id}) → institución inexistente: ${c.institution_id}`);
  });
  console.log('');

  const categoryIds = danglingCategories.rows.map((c: any) => c.id);

  // 2. Verificar recursos asociados
  console.log('🔍 Verificando recursos asociados...');
  const associatedResources = await db.query.resources.findMany({
    where: (resources, { inArray }) => inArray(resources.categoryId, categoryIds),
  });

  if (associatedResources.length > 0) {
    console.log(`⚠️  ADVERTENCIA: Hay ${associatedResources.length} recursos asociados`);
    console.log('   Estos recursos quedarán sin categoría (categoryId = NULL)\n');
  } else {
    console.log('✓ No hay recursos asociados\n');
  }

  // 3. Verificar templates asociados
  console.log('🔍 Verificando templates asociados...');
  const associatedTemplates = await db.query.resourceTemplates.findMany({
    where: (resourceTemplates, { inArray }) => inArray(resourceTemplates.categoryId, categoryIds),
  });

  if (associatedTemplates.length > 0) {
    console.log(`⚠️  ADVERTENCIA: Hay ${associatedTemplates.length} templates asociados`);
    console.log('   Estos templates quedarán sin categoría (categoryId = NULL)\n');
  } else {
    console.log('✓ No hay templates asociados\n');
  }

  // 4. Eliminar secuencias de categorías
  console.log('🗑️  Eliminando secuencias de categorías...');
  const deletedSequences = await db
    .delete(categorySequences)
    .where((categorySequences, { inArray }) => 
      inArray(categorySequences.categoryPrefix, 
        danglingCategories.rows.map((c: any) => c.name.substring(0, 3).toUpperCase())
      )
    )
    .returning();
  console.log(`   ✓ ${deletedSequences.length} secuencias eliminadas\n`);

  // 5. Desvincular recursos
  if (associatedResources.length > 0) {
    console.log('🔄 Desvinculando recursos...');
    await db
      .update(resources)
      .set({ categoryId: null })
      .where((resources, { inArray }) => inArray(resources.categoryId, categoryIds));
    console.log(`   ✓ ${associatedResources.length} recursos desvinculados\n`);
  }

  // 6. Desvincular templates
  if (associatedTemplates.length > 0) {
    console.log('🔄 Desvinculando templates...');
    await db
      .update(resourceTemplates)
      .set({ categoryId: null })
      .where((resourceTemplates, { inArray }) => inArray(resourceTemplates.categoryId, categoryIds));
    console.log(`   ✓ ${associatedTemplates.length} templates desvinculados\n`);
  }

  // 7. Eliminar las categorías
  console.log('🗑️  Eliminando categorías con referencias rotas...');
  const deletedCategories = await db
    .delete(categories)
    .where((categories, { inArray }) => inArray(categories.id, categoryIds))
    .returning();
  console.log(`   ✓ ${deletedCategories.length} categorías eliminadas\n`);

  console.log('✨ Limpieza completada');
  console.log('\nResumen:');
  console.log(`   - ${deletedSequences.length} secuencias eliminadas`);
  console.log(`   - ${associatedResources.length} recursos desvinculados`);
  console.log(`   - ${associatedTemplates.length} templates desvinculados`);
  console.log(`   - ${deletedCategories.length} categorías eliminadas`);
}

// Ejecutar
cleanDanglingCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
