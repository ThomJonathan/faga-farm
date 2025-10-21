const mysql = require('mysql2/promise');

async function checkSchema() {
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
    console.log('=== Checking Database Schema ===\n');

    // Check meat_production table
    console.log('1. Checking meat_production table:');
    const [meatColumns] = await pool.execute('DESCRIBE meat_production');
    console.log('   Columns:');
    meatColumns.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check manure_production table
    console.log('\n2. Checking manure_production table:');
    const [manureColumns] = await pool.execute('DESCRIBE manure_production');
    console.log('   Columns:');
    manureColumns.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check egg_incubations table
    console.log('\n3. Checking egg_incubations table:');
    const [incubationColumns] = await pool.execute('DESCRIBE egg_incubations');
    console.log('   Columns:');
    incubationColumns.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check sales table
    console.log('\n4. Checking sales table:');
    const [salesColumns] = await pool.execute('DESCRIBE sales');
    console.log('   Columns:');
    salesColumns.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check sale_items table
    console.log('\n5. Checking sale_items table:');
    const [saleItemsColumns] = await pool.execute('DESCRIBE sale_items');
    console.log('   Columns:');
    saleItemsColumns.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check egg_collections table
    console.log('\n6. Checking egg_collections table:');
    const [eggCollectionsColumns] = await pool.execute('DESCRIBE egg_collections');
    console.log('   Columns:');
    eggCollectionsColumns.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n=== Schema check completed ===');

  } catch (error) {
    console.error('Error during schema check:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
