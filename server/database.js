require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'pasword',
    host: 'localhost',
    port: 5432,
    database: 'CicloinnovaBD',
});

// Prueba de conexión al arrancar
pool.connect()
    .then(client => {
        console.log('✅ Conexión a PostgreSQL exitosa');
        client.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar a PostgreSQL:', err.stack);
        process.exit(1);
    });

module.exports = pool;
