import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Cargo las variables de entorno
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env.local');
}

async function migrateMeetings() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    console.log('🚀 Starting meetings privacy migration...');
    
    // 1. Añade la columna created_by_user_id a la tabla meetings
    console.log('📦 Adding created_by_user_id column to meetings table...');
    await sql`
      ALTER TABLE "meetings" 
      ADD COLUMN IF NOT EXISTS "created_by_user_id" text
    `;
    
    // 2. Añade la restricción de llave foránea
    console.log('📦 Adding foreign key constraint...');
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'meetings_created_by_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "meetings" 
          ADD CONSTRAINT "meetings_created_by_user_id_users_id_fk" 
          FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    // 3. Añade el índice para mejorar el rendimiento
    console.log('📦 Creating index for created_by_user_id...');
    await sql`
      CREATE INDEX IF NOT EXISTS "idx_meeting_created_by" 
      ON "meetings" USING btree ("created_by_user_id")
    `;
    
    console.log('✅ Meetings migration executed successfully');
    
    // 4. Verificación
    console.log('🔍 Verifying column...');
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'meetings'
        AND column_name = 'created_by_user_id'
    `;
    
    if (result.length === 1) {
      console.log('📋 Column created_by_user_id exists in meetings table');
      console.log('🎉 Migration completed successfully!');
    } else {
      throw new Error('Column created_by_user_id was NOT found after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateMeetings();
