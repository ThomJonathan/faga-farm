const pool = require('./src/lib/db');

async function checkProducts() {
  try {
    const [columns] = await pool.execute('DESCRIBE products');
    console.log('PRODUCTS TABLE:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
  } catch (error) {
    console.error('Error checking products table:', error);
  } finally {
    pool.end();
  }
}

checkProducts();
