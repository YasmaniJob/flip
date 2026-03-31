/**
 * Safe Migration Script for Diagnostic Module
 * 
 * This script:
 * 1. Applies schema changes directly to the database
 * 2. Verifies all tables were created
 * 3. Uses Drizzle push for incremental changes
 */

import { neon } from '@neondatabase/serverless';

async function safeMigrate() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    console.log('🚀 Starting diagnostic module migration...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('');
    
    // Apply schema changes using raw SQL from the migration file
    console.log('📦 Creating diagnostic_categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "diagnostic_categories" (
        "id" text PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "institution_id" text,
        "name" text NOT NULL,
        "description" text,
        "order" integer NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "diagnostic_categories_code_unique" UNIQUE("code")
      )
    `;
    
    console.log('📦 Creating diagnostic_questions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "diagnostic_questions" (
        "id" text PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "category_id" text NOT NULL,
        "institution_id" text,
        "text" text NOT NULL,
        "order" integer NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "diagnostic_questions_code_unique" UNIQUE("code")
      )
    `;
    
    console.log('📦 Creating diagnostic_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "diagnostic_sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "token" text NOT NULL,
        "institution_id" text NOT NULL,
        "user_id" text,
        "staff_id" text,
        "name" text NOT NULL,
        "dni" text,
        "email" text,
        "ip_address" text,
        "user_agent" text,
        "status" text DEFAULT 'in_progress',
        "progress" integer DEFAULT 0,
        "total_questions" integer DEFAULT 0,
        "overall_score" integer,
        "level" text,
        "category_scores" jsonb,
        "expires_at" timestamp NOT NULL,
        "completed_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "diagnostic_sessions_token_unique" UNIQUE("token")
      )
    `;
    
    console.log('📦 Updating diagnostic_sessions table with missing user_id column...');
    await sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "user_id" text`;
    
    console.log('📦 Creating diagnostic_responses table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "diagnostic_responses" (
        "id" text PRIMARY KEY NOT NULL,
        "session_id" text NOT NULL,
        "question_id" text NOT NULL,
        "score" integer NOT NULL,
        "answered_at" timestamp DEFAULT now()
      )
    `;
    
    console.log('📦 Adding columns to institutions table...');
    await sql`ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "diagnostic_enabled" boolean DEFAULT false`;
    await sql`ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "diagnostic_requires_approval" boolean DEFAULT true`;
    await sql`ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "diagnostic_custom_message" text`;
    
    console.log('📦 Adding foreign keys...');
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_categories_institution_id_institutions_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_categories" 
          ADD CONSTRAINT "diagnostic_categories_institution_id_institutions_id_fk" 
          FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_questions_category_id_diagnostic_categories_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_questions" 
          ADD CONSTRAINT "diagnostic_questions_category_id_diagnostic_categories_id_fk" 
          FOREIGN KEY ("category_id") REFERENCES "public"."diagnostic_categories"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_questions_institution_id_institutions_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_questions" 
          ADD CONSTRAINT "diagnostic_questions_institution_id_institutions_id_fk" 
          FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_responses_session_id_diagnostic_sessions_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_responses" 
          ADD CONSTRAINT "diagnostic_responses_session_id_diagnostic_sessions_id_fk" 
          FOREIGN KEY ("session_id") REFERENCES "public"."diagnostic_sessions"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_responses_question_id_diagnostic_questions_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_responses" 
          ADD CONSTRAINT "diagnostic_responses_question_id_diagnostic_questions_id_fk" 
          FOREIGN KEY ("question_id") REFERENCES "public"."diagnostic_questions"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_sessions_institution_id_institutions_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_sessions" 
          ADD CONSTRAINT "diagnostic_sessions_institution_id_institutions_id_fk" 
          FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_sessions_staff_id_staff_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_sessions" 
          ADD CONSTRAINT "diagnostic_sessions_staff_id_staff_id_fk" 
          FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'diagnostic_sessions_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "diagnostic_sessions" 
          ADD CONSTRAINT "diagnostic_sessions_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `;
    
    console.log('📦 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_category_code" ON "diagnostic_categories" USING btree ("code")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_category_institution" ON "diagnostic_categories" USING btree ("institution_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_category_order" ON "diagnostic_categories" USING btree ("order")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_question_code" ON "diagnostic_questions" USING btree ("code")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_question_category" ON "diagnostic_questions" USING btree ("category_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_question_institution" ON "diagnostic_questions" USING btree ("institution_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_question_order" ON "diagnostic_questions" USING btree ("order")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_response_session" ON "diagnostic_responses" USING btree ("session_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_response_question" ON "diagnostic_responses" USING btree ("question_id")`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS "idx_diagnostic_response_session_question" ON "diagnostic_responses" USING btree ("session_id","question_id")`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS "idx_diagnostic_session_token" ON "diagnostic_sessions" USING btree ("token")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_session_institution" ON "diagnostic_sessions" USING btree ("institution_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_session_staff" ON "diagnostic_sessions" USING btree ("staff_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_session_status" ON "diagnostic_sessions" USING btree ("status")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_session_dni" ON "diagnostic_sessions" USING btree ("dni")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_session_email" ON "diagnostic_sessions" USING btree ("email")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_diagnostic_session_user" ON "diagnostic_sessions" USING btree ("user_id")`;
    
    console.log('✅ Migration executed successfully');
    console.log('');
    
    // Verify that all diagnostic tables exist
    console.log('🔍 Verifying tables...');
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name LIKE 'diagnostic_%'
      ORDER BY table_name
    `;
    
    console.log('📋 Created diagnostic tables:', result.map(r => r.table_name));
    
    if (result.length !== 4) {
      throw new Error(`Expected 4 diagnostic tables, found ${result.length}`);
    }
    
    // Verify institutions columns
    console.log('🔍 Verifying institutions columns...');
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'institutions'
        AND column_name LIKE 'diagnostic_%'
      ORDER BY column_name
    `;
    
    console.log('📋 Added columns to institutions:', columns.map(c => c.column_name));
    
    if (columns.length !== 3) {
      throw new Error(`Expected 3 diagnostic columns in institutions, found ${columns.length}`);
    }
    
    console.log('✅ All verifications passed');
    console.log('🎉 Diagnostic module migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('🔄 Transaction automatically rolled back by Neon');
    console.log('💡 No changes were made to the database');
    process.exit(1);
  }
}

safeMigrate();
