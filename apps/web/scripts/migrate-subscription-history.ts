import { Client } from "pg";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida en .env.local");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("✅ Conectado a Neon");

  try {
    // Check if table already exists
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_history'
      ) AS exists;
    `);

    if (rows[0].exists) {
      console.log("ℹ️  La tabla subscription_history ya existe.");
    } else {
      await client.query(`
        CREATE TABLE subscription_history (
          id TEXT PRIMARY KEY,
          institution_id TEXT NOT NULL REFERENCES institutions(id),
          event TEXT NOT NULL,
          details TEXT,
          plan TEXT,
          date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );

        CREATE INDEX idx_sub_history_institution ON subscription_history(institution_id);
      `);
      console.log("✅ Tabla subscription_history creada exitosamente.");
    }

    // Also add new columns to institutions if missing
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'institutions' 
      AND column_name IN ('subscription_plan', 'subscription_start_date', 'subscription_ends_at')
    `);
    const existingCols = colCheck.rows.map((r: any) => r.column_name);
    console.log("Columnas existentes en institutions:", existingCols);

    if (!existingCols.includes('subscription_plan')) {
      await client.query(`ALTER TABLE institutions ADD COLUMN subscription_plan TEXT DEFAULT 'trial';`);
      console.log("✅ Columna subscription_plan agregada.");
    }
    if (!existingCols.includes('subscription_start_date')) {
      await client.query(`ALTER TABLE institutions ADD COLUMN subscription_start_date TIMESTAMP;`);
      console.log("✅ Columna subscription_start_date agregada.");
    }
    if (!existingCols.includes('subscription_ends_at')) {
      await client.query(`ALTER TABLE institutions ADD COLUMN subscription_ends_at TIMESTAMP;`);
      console.log("✅ Columna subscription_ends_at agregada.");
    }

    console.log("\n🎉 Migración completada exitosamente.");
  } catch (err) {
    console.error("❌ Error durante la migración:", err);
  } finally {
    await client.end();
  }
}

migrate();
