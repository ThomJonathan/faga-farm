const mysql = require('mysql2/promise');

async function testStockUpdates() {
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
    console.log('=== Testing Stock Updates After Production Operations ===\n');

    // 1. Test egg collection stock increase
    console.log('1. Testing egg collection stock increase...');
    const [eggProductsBefore] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['eggs']);
    console.log('   Egg products before:', eggProductsBefore);

    // Simulate egg collection
    const [eggCollectionResult] = await pool.execute(
      'INSERT INTO egg_collections (batch_id, collection_date, quantity, egg_type, collected_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [1, '2025-01-16', 50, 'sales', 1, 'Test egg collection for stock update']
    );
    console.log(`   Created egg collection with ID: ${eggCollectionResult.insertId}`);

    const [eggProductsAfter] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['eggs']);
    console.log('   Egg products after:', eggProductsAfter);

    // 2. Test meat production stock increase
    console.log('\n2. Testing meat production stock increase...');
    const [meatProductsBefore] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['meat']);
    console.log('   Meat products before:', meatProductsBefore);

    // Simulate meat production
    const [meatResult] = await pool.execute(
      'INSERT INTO meat_production (batch_id, production_date, quantity_kg, number_of_birds, average_weight_kg, quality_rating, processing_cost, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [3, '2025-01-16', 25.0, 25, 1.0, 'standard', 2500, 'Test meat production', 1]
    );
    console.log(`   Created meat production with ID: ${meatResult.insertId}`);

    const [meatProductsAfter] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['meat']);
    console.log('   Meat products after:', meatProductsAfter);

    // 3. Test manure production stock increase
    console.log('\n3. Testing manure production stock increase...');
    const [manureProductsBefore] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['manure']);
    console.log('   Manure products before:', manureProductsBefore);

    // Simulate manure production
    const [manureResult] = await pool.execute(
      'INSERT INTO manure_production (batch_id, production_date, quantity_kg, quality_rating, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [5, '2025-01-16', 100.0, 'good', 'Test manure production', 1]
    );
    console.log(`   Created manure production with ID: ${manureResult.insertId}`);

    const [manureProductsAfter] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['manure']);
    console.log('   Manure products after:', manureProductsAfter);

    // 4. Test chick production from egg incubation
    console.log('\n4. Testing chick production from egg incubation...');
    const [chickProductsBefore] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['day_old_chicks']);
    console.log('   Chick products before:', chickProductsBefore);

    // First create an egg collection for incubation
    const [incubationCollection] = await pool.execute(
      'INSERT INTO egg_collections (batch_id, collection_date, quantity, egg_type, collected_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [1, '2025-01-16', 100, 'incubation', 1, 'Test egg collection for incubation']
    );
    console.log(`   Created incubation egg collection with ID: ${incubationCollection.insertId}`);

    // Create egg incubation
    const [incubationResult] = await pool.execute(
      'INSERT INTO egg_incubations (egg_batch_name, breed_id, incubator_id, start_date, number_of_eggs, notes) VALUES (?, ?, ?, ?, ?, ?)',
      ['Test Incubation Batch', 3, 2, '2025-01-16', 50, 'Test incubation']
    );
    console.log(`   Created egg incubation with ID: ${incubationResult.insertId}`);

    // Simulate hatching
    await pool.execute(
      'UPDATE egg_incubations SET hatch_date = ?, hatched_chicks = ?, unhatched_chicks = ?, status = ? WHERE id = ?',
      ['2025-01-23', 45, 5, 'hatched', incubationResult.insertId]
    );
    console.log('   Simulated hatching of 45 chicks');

    const [chickProductsAfter] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE product_type = ? AND available_quantity > 0', ['day_old_chicks']);
    console.log('   Chick products after:', chickProductsAfter);

    // 5. Test sale stock decrease
    console.log('\n5. Testing sale stock decrease...');
    const [productsBeforeSale] = await pool.execute('SELECT id, product_name, available_quantity FROM products WHERE available_quantity > 0 LIMIT 5');
    console.log('   Products before sale:', productsBeforeSale);

    // Create a sale that reduces stock
    const [saleResult] = await pool.execute(
      'INSERT INTO sales (customer_id, sale_date, total_price, sold_by, payment_status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [1, '2025-01-16', 5000, 1, 'paid', 'Test sale for stock reduction']
    );
    console.log(`   Created sale with ID: ${saleResult.insertId}`);

    // Add sale items (assuming we have products with stock)
    if (productsBeforeSale.length > 0) {
      const productToSell = productsBeforeSale[0];
      const quantityToSell = Math.min(5, productToSell.available_quantity);

      await pool.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [saleResult.insertId, productToSell.id, quantityToSell, 1000, quantityToSell * 1000]
      );

      await pool.execute(
        'UPDATE products SET available_quantity = available_quantity - ? WHERE id = ?',
        [quantityToSell, productToSell.id]
      );

      console.log(`   Sold ${quantityToSell} units of ${productToSell.product_name}`);
    }

    const [productsAfterSale] = await pool.execute('SELECT id, product_name, available_quantity FROM products WHERE id = ? OR available_quantity > 0 LIMIT 5', [productsBeforeSale[0]?.id]);
    console.log('   Products after sale:', productsAfterSale);

    // 6. Final stock summary
    console.log('\n6. Final stock summary:');
    const [finalEggs] = await pool.execute('SELECT SUM(available_quantity) as total FROM products WHERE product_type = ?', ['eggs']);
    const [finalChicks] = await pool.execute('SELECT SUM(available_quantity) as total FROM products WHERE product_type = ?', ['day_old_chicks']);
    const [finalMeat] = await pool.execute('SELECT SUM(available_quantity) as total FROM products WHERE product_type = ?', ['meat']);
    const [finalManure] = await pool.execute('SELECT SUM(available_quantity) as total FROM products WHERE product_type = ?', ['manure']);

    console.log(`   Eggs: ${finalEggs[0].total || 0} total`);
    console.log(`   Chicks: ${finalChicks[0].total || 0} total`);
    console.log(`   Meat: ${finalMeat[0].total || 0}kg total`);
    console.log(`   Manure: ${finalManure[0].total || 0}kg total`);

    console.log('\n=== Stock update testing completed successfully ===');

  } catch (error) {
    console.error('Error during stock testing:', error);
  } finally {
    await pool.end();
  }
}

testStockUpdates();
