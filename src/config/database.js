const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tactical_inventory',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a MySQL:', process.env.DB_NAME || 'tactical_inventory');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
    console.error('🔍 Configuración actual:');
    console.error('   DB_HOST:', process.env.DB_HOST || 'NO CONFIGURADO');
    console.error('   DB_USER:', process.env.DB_USER || 'NO CONFIGURADO');
    console.error('   DB_NAME:', process.env.DB_NAME || 'NO CONFIGURADO');
    console.error('   DB_PORT:', process.env.DB_PORT || 'NO CONFIGURADO');
    console.error('   Password configurado:', process.env.DB_PASSWORD ? 'SÍ' : 'NO');
    // No mostramos el error completo para evitar exponer credenciales
    console.error('⚠️  Verifica que las variables de entorno estén configuradas en Render');
  });

module.exports = pool;

