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
      const dbRes = await pool.query('SELECT * FROM resources');
      console.log("Resources:", dbRes.rows);
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}
main();
