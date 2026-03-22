import { Pool } from 'pg';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from api/.env.local
config({ path: path.resolve(__dirname, '../../../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    console.log('🚀 Running database performance indexes migration...\n');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '001_add_performance_indexes.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        console.log('📝 Executing SQL migration...');
        await pool.query(sql);

        console.log('✅ Migration completed successfully!\n');
        console.log('📊 Indexes created:');
        console.log('   - categories: institution_id');
        console.log('   - resources: institution_id, category_id, (institution_id, status), (institution_id, condition)');
        console.log('   - users: institution_id');
        console.log('   - resource_templates: institution_id, category_id');
        console.log('   - staff: institution_id');
        console.log('   - loans: institution_id, staff_id, (institution_id, status)');
        console.log('   - loan_resources: loan_id, resource_id');
        console.log('\n🎯 Expected improvements:');
        console.log('   - 10-100x faster filtered queries');
        console.log('   - Improved JOIN performance');
        console.log('   - Better multi-tenant data isolation performance\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();
