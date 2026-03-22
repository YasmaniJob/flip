const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/flip_v2"
});

async function run() {
    console.log("Conectando a postgres...");
    try {
        const res = await pool.query('SELECT current_setting(\'deadlock_timeout\');');
        console.log("DB responde!", res.rows);

        console.log("Probando la tabla de MINEDU...");
        const res2 = await pool.query('SELECT count(*) FROM "education_institutions_minedu";');
        console.log(`Colegios registrados: ${res2.rows[0].count}`);

        console.log("Obteniendo departamentos...");
        const res3 = await pool.query('SELECT DISTINCT departamento FROM "education_institutions_minedu" WHERE departamento IS NOT NULL LIMIT 5;');
        console.log("Departamentos encontrados:", res3.rows);

    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        pool.end();
        process.exit(0);
    }
}

run();
