const mysql = require('mysql2/promise');

async function checkProductsSchema() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'fagafarm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('=== Checking Products Table Schema ===\n');

    const [columns] = await pool.execute('DESCRIBE products');
    console.log('Products table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check what product types exist
    console.log('\n=== Checking existing product types ===');
    const [types] = await pool.execute('SELECT DISTINCT product_type FROM products ORDER BY product_type');
    console.log('Existing product types:');
    types.forEach(type => {
      console.log(`  - ${type.product_type}`);
    });

  } catch (error) {
    console.error('Error during schema check:', error);
  } finally {
    await pool.end();
  }
}

checkProductsSchema();
