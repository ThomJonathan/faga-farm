const pool = require('./src/lib/db');

async function testConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('Database connection successful:', rows);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    pool.end();
  }
}

testConnection();
