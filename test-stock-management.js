const mysql = require('mysql2/promise');

async function testStockManagement() {
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
    console.log('=== Testing Stock Management System ===\n');

    // Check egg collections for sales
    console.log('1. Checking egg collections for sales:');
    const [eggCollections] = await pool.execute(
      'SELECT COUNT(*) as count FROM egg_collections WHERE egg_type = ?',
      ['sales']
    );
    console.log(`   Egg collections for sales: ${eggCollections[0].count}`);

    // Check products table structure
    console.log('\n2. Checking products table structure:');
    const [products] = await pool.execute('DESCRIBE products');
    console.log('   Products table columns:');
    products.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check current products
    console.log('\n3. Checking current products:');
    const [productRows] = await pool.execute('SELECT * FROM products');
    console.log(`   Total products: ${productRows.length}`);
    productRows.forEach(product => {
      console.log(`     - ${product.product_name} (${product.product_type}): ${product.available_quantity} units`);
    });

    // Check batches
    console.log('\n4. Checking batches:');
    const [batches] = await pool.execute('SELECT * FROM batches');
    console.log(`   Total batches: ${batches.length}`);
    batches.forEach(batch => {
      console.log(`     - ${batch.batch_number}: ${batch.current_quantity} birds`);
    });

    // Check meat production
    console.log('\n5. Checking meat production:');
    const [meatProduction] = await pool.execute('SELECT * FROM meat_production');
    console.log(`   Total meat production records: ${meatProduction.length}`);
    meatProduction.forEach(record => {
      console.log(`     - ${record.production_date}: ${record.quantity_kg}kg from batch ${record.batch_id}`);
    });

    // Check manure production
    console.log('\n6. Checking manure production:');
    const [manureProduction] = await pool.execute('SELECT * FROM manure_production');
    console.log(`   Total manure production records: ${manureProduction.length}`);
    manureProduction.forEach(record => {
      console.log(`     - ${record.production_date}: ${record.quantity_kg}kg from batch ${record.batch_id}`);
    });

    // Check sales
    console.log('\n7. Checking sales:');
    const [sales] = await pool.execute('SELECT * FROM sales');
    console.log(`   Total sales: ${sales.length}`);
    sales.forEach(sale => {
      console.log(`     - Sale ${sale.id}: ${sale.total_price} MWK`);
    });

    // Check inventory transactions
    console.log('\n8. Checking inventory transactions:');
    const [transactions] = await pool.execute('SELECT * FROM inventory_transactions ORDER BY created_at DESC LIMIT 10');
    console.log(`   Recent inventory transactions: ${transactions.length}`);
    transactions.forEach(tx => {
      console.log(`     - ${tx.transaction_type}: ${tx.quantity_change} (${tx.previous_quantity} -> ${tx.new_quantity})`);
    });

    console.log('\n=== Test completed successfully ===');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await pool.end();
  }
}

testStockManagement();
