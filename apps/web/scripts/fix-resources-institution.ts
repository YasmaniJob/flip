import 'dotenv/config';
import { db } from '../src/lib/db';
import { resources, institutions } from '../src/lib/db/schema';
import { isNull } from 'drizzle-orm';

async function fixResourcesInstitution() {
  console.log('🔧 Fixing resources institution_id...\n');

  try {
    // 1. Get the first institution (assuming single institution setup)
    const allInstitutions = await db.query.institutions.findMany({
      limit: 5,
    });

    if (allInstitutions.length === 0) {
      console.error('❌ No institutions found in database');
      process.exit(1);
    }

    console.log('📋 Available institutions:');
    allInstitutions.forEach((inst, i) => {
      console.log(`  ${i + 1}. ${inst.name} (ID: ${inst.id})`);
    });

    // Use the first institution
    const institution = allInstitutions[0];
    console.log(`\n✅ Using institution: ${institution.name}`);
    console.log(`   ID: ${institution.id}\n`);

    // 2. Find resources without institution_id
    const orphanResources = await db.query.resources.findMany({
      where: isNull(resources.institutionId),
    });

    console.log(`📦 Found ${orphanResources.length} resources without institution_id`);

    if (orphanResources.length === 0) {
      console.log('✅ All resources already have institution_id');
      return;
    }

    // 3. Update all orphan resources
    console.log('\n🔄 Updating resources...');
    
    for (const resource of orphanResources) {
      await db
        .update(resources)
        .set({ institutionId: institution.id })
        .where(isNull(resources.institutionId));
      
      console.log(`  ✓ Updated: ${resource.name} (${resource.id})`);
    }

    console.log(`\n✅ Successfully updated ${orphanResources.length} resources`);
    console.log('🎉 Done! Resources now have correct institution_id');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixResourcesInstitution()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
