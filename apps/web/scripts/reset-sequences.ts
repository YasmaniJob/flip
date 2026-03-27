import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function reset() {
  try {
    // 1. Obtener institutionId
    const instRes = await pool.query('SELECT institution_id FROM categories LIMIT 1');
    if (instRes.rows.length === 0) {
      console.log('❌ No se encontraron datos para identificar la institución.');
      return;
    }
    const instId = instRes.rows[0].institution_id;
    console.log('🔄 Reiniciando contadores para institución:', instId);

    // 2. Resetear secuencias a 0
    const updateRes = await pool.query(
      'UPDATE category_sequences SET last_number = 0 WHERE institution_id = $1',
      [instId]
    );
    
    console.log(`✅ Éxito: Se reiniciaron ${updateRes.rowCount} prefijos de categoría.`);
    
    // 3. Verificación
    const verify = await pool.query(
      'SELECT category_prefix, last_number FROM category_sequences WHERE institution_id = $1',
      [instId]
    );
    console.table(verify.rows);

  } catch (err) {
    console.error('❌ Error crítico:', err);
  } finally {
    await pool.end();
  }
}

reset();
