const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_kgcCKJuwpF63@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    max: 1
  });

  try {
    const res = await pool.query('SELECT count(*) FROM resources');
    console.log("Total resources:", res.rows[0].count);
    
    if (parseInt(res.rows[0].count) > 0) {
      const sample = await pool.query('SELECT * FROM resources LIMIT 1');
      console.log("Sample resource:");
      console.log(sample.rows[0]);
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}
main();
