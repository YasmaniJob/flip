// IMPORTANT: Load environment variables FIRST using require
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Now import everything else
import { db } from '../src/lib/db';
import { institutions, categories, users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Script para verificar instituciones y sus categorías
 */

async function checkInstitutionCategories() {
  console.log('🔍 Verificando instituciones y categorías...\n');

  // 1. Listar todas las instituciones
  const allInstitutions = await db.query.institutions.findMany({
    with: {
      users: true,
    },
  });

  console.log(`📋 Total de instituciones: ${allInstitutions.length}\n`);

  for (const inst of allInstitutions) {
    console.log(`🏫 ${inst.name} (${inst.id})`);
    console.log(`   Slug: ${inst.slug}`);
    console.log(`   Código Modular: ${inst.codigoModular || 'N/A'}`);
    console.log(`   Usuarios: ${inst.users.length}`);

    // Contar categorías
    const cats = await db.query.categories.findMany({
      where: eq(categories.institutionId, inst.id),
    });
    console.log(`   Categorías: ${cats.length}`);
    
    if (cats.length > 0) {
      cats.forEach(c => console.log(`      - ${c.name} (${c.id})`));
    }
    console.log('');
  }

  // 2. Buscar la institución específica de la imagen
  const targetInstitutionId = '9m03ef21-2e92-43d1-82e'; // Prefijo visible en la imagen
  
  console.log(`\n🎯 Buscando instituciones que empiecen con: ${targetInstitutionId}...\n`);
  
  const matchingInstitutions = allInstitutions.filter(i => i.id.startsWith(targetInstitutionId));
  
  if (matchingInstitutions.length > 0) {
    console.log(`✓ Encontradas ${matchingInstitutions.length} instituciones:`);
    for (const inst of matchingInstitutions) {
      console.log(`\n🏫 ${inst.name} (${inst.id})`);
      console.log(`   Usuarios: ${inst.users.length}`);
      if (inst.users.length > 0) {
        inst.users.forEach(u => console.log(`      - ${u.email}`));
      }
      
      const cats = await db.query.categories.findMany({
        where: eq(categories.institutionId, inst.id),
      });
      console.log(`   Categorías: ${cats.length}`);
      if (cats.length > 0) {
        cats.forEach(c => console.log(`      - ${c.name}`));
      }
    }
  } else {
    console.log('❌ No se encontraron instituciones con ese ID');
  }
}

// Ejecutar
checkInstitutionCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
