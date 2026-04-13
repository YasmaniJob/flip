// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Now import everything else
import { db } from '../src/lib/db';
import {
  categories,
  categorySequences,
  resources,
  resourceTemplates,
} from '../src/lib/db/schema';
import { isNull } from 'drizzle-orm';

/**
 * Script para limpiar categorías huérfanas (sin institución asociada)
 * Estas categorías pueden causar conflictos y deben ser eliminadas
 */

async function cleanOrphanCategories() {
  console.log('🧹 Iniciando limpieza de categorías huérfanas...\n');

  // 1. Encontrar categorías sin institución
  const orphanCategories = await db.query.categories.findMany({
    where: isNull(categories.institutionId),
  });

  if (orphanCategories.length === 0) {
    console.log('✅ No se encontraron categorías huérfanas\n');
    return;
  }

  console.log(`📋 Encontradas ${orphanCategories.length} categorías huérfanas:`);
  orphanCategories.forEach((c) => console.log(`   - ${c.name} (${c.id})`));
  console.log('');

  const categoryIds = orphanCategories.map((c) => c.id);

  // 2. Verificar si hay recursos asociados
  console.log('🔍 Verificando recursos asociados...');
  const associatedResources = await db.query.resources.findMany({
    where: (resources, { inArray }) => inArray(resources.categoryId, categoryIds),
  });

  if (associatedResources.length > 0) {
    console.log(`⚠️  ADVERTENCIA: Hay ${associatedResources.length} recursos asociados a estas categorías`);
    console.log('   Estos recursos quedarán sin categoría (categoryId = NULL)\n');
  } else {
    console.log('✓ No hay recursos asociados\n');
  }

  // 3. Verificar si hay templates asociados
  console.log('🔍 Verificando templates asociados...');
  const associatedTemplates = await db.query.resourceTemplates.findMany({
    where: (resourceTemplates, { inArray }) => inArray(resourceTemplates.categoryId, categoryIds),
  });

  if (associatedTemplates.length > 0) {
    console.log(`⚠️  ADVERTENCIA: Hay ${associatedTemplates.length} templates asociados a estas categorías`);
    console.log('   Estos templates quedarán sin categoría (categoryId = NULL)\n');
  } else {
    console.log('✓ No hay templates asociados\n');
  }

  // 4. Eliminar secuencias de categorías huérfanas
  console.log('🗑️  Eliminando secuencias de categorías...');
  const deletedSequences = await db
    .delete(categorySequences)
    .where(isNull(categorySequences.institutionId))
    .returning();
  console.log(`   ✓ ${deletedSequences.length} secuencias eliminadas\n`);

  // 5. Actualizar recursos para desvincularlos (set categoryId = NULL)
  if (associatedResources.length > 0) {
    console.log('🔄 Desvinculando recursos...');
    await db
      .update(resources)
      .set({ categoryId: null })
      .where((resources, { inArray }) => inArray(resources.categoryId, categoryIds));
    console.log(`   ✓ ${associatedResources.length} recursos desvinculados\n`);
  }

  // 6. Actualizar templates para desvincularlos (set categoryId = NULL)
  if (associatedTemplates.length > 0) {
    console.log('🔄 Desvinculando templates...');
    await db
      .update(resourceTemplates)
      .set({ categoryId: null })
      .where((resourceTemplates, { inArray }) => inArray(resourceTemplates.categoryId, categoryIds));
    console.log(`   ✓ ${associatedTemplates.length} templates desvinculados\n`);
  }

  // 7. Eliminar las categorías huérfanas
  console.log('🗑️  Eliminando categorías huérfanas...');
  const deletedCategories = await db
    .delete(categories)
    .where(isNull(categories.institutionId))
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
cleanOrphanCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
