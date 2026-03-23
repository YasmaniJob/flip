const { Pool } = require('pg');
async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_kgcCKJuwpF63@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    max: 1
  });
  try {
    const inst = await pool.query('SELECT count(*) FROM institutions');
    console.log("Total institutions:", inst.rows[0].count);
    const users = await pool.query('SELECT count(*) FROM users');
    console.log("Total users:", users.rows[0].count);
    const cat = await pool.query('SELECT count(*) FROM categories');
    console.log("Total categories:", cat.rows[0].count);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}
main();
