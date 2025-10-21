const mysql = require('mysql2/promise');

async function simulateProduction() {
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
    console.log('=== Simulating Production Operations ===\n');

    // 1. Simulate egg collection for sales
    console.log('1. Simulating egg collection for sales...');
    const [eggCollectionResult] = await pool.execute(
      'INSERT INTO egg_collections (batch_id, collection_date, quantity, egg_type, collected_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [1, '2025-01-15', 100, 'sales', 1, 'Test egg collection for sales']
    );
    console.log(`   Created egg collection with ID: ${eggCollectionResult.insertId}`);

    // 2. Simulate meat production
    console.log('\n2. Simulating meat production...');
    const [meatResult] = await pool.execute(
      'INSERT INTO meat_production (batch_id, production_date, quantity_kg, number_of_birds, average_weight_kg, quality_rating, processing_cost, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [3, '2025-01-15', 50.5, 50, 1.01, 'standard', 5000, 'Test meat production', 1]
    );
    console.log(`   Created meat production with ID: ${meatResult.insertId}`);

    // 3. Simulate manure production
    console.log('\n3. Simulating manure production...');
    const [manureResult] = await pool.execute(
      'INSERT INTO manure_production (batch_id, production_date, quantity_kg, quality_rating, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [5, '2025-01-15', 200.0, 'good', 'Test manure production', 1]
    );
    console.log(`   Created manure production with ID: ${manureResult.insertId}`);

    // 4. Simulate egg incubation (which should decrease egg collection quantity)
    console.log('\n4. Simulating egg incubation...');
    const [incubationResult] = await pool.execute(
      'INSERT INTO egg_incubations (egg_batch_name, breed_id, incubator_id, start_date, number_of_eggs, notes) VALUES (?, ?, ?, ?, ?, ?)',
      ['Test Incubation', 3, 2, '2025-01-15', 50, 'Test incubation']
    );
    console.log(`   Created egg incubation with ID: ${incubationResult.insertId}`);

    // Update egg collection quantity (decrease by 50)
    await pool.execute(
      'UPDATE egg_collections SET quantity = quantity - ? WHERE id = ?',
      [50, eggCollectionResult.insertId]
    );
    console.log(`   Decreased egg collection quantity by 50`);

    // 5. Simulate sale (which should decrease product quantity)
    console.log('\n5. Simulating sale...');
    const [saleResult] = await pool.execute(
      'INSERT INTO sales (customer_id, sale_date, total_price, sold_by, payment_status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [1, '2025-01-15', 10000, 1, 'paid', 'Test sale']
    );
    console.log(`   Created sale with ID: ${saleResult.insertId}`);

    // Insert sale items and update product quantities
    const saleItems = [
      { product_id: 1, quantity: 10, unit_price: 500, total_price: 5000 }, // eggs
      { product_id: 2, quantity: 5, unit_price: 1000, total_price: 5000 }  // meat
    ];

    for (const item of saleItems) {
      await pool.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [saleResult.insertId, item.product_id, item.quantity, item.unit_price, item.total_price]
      );

      // Update product quantity
      await pool.execute(
        'UPDATE products SET available_quantity = available_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      console.log(`   Sold ${item.quantity} units of product ${item.product_id}`);
    }

    // 6. Check updated stock levels
    console.log('\n6. Checking updated stock levels...');
    const [updatedProducts] = await pool.execute('SELECT product_name, available_quantity FROM products WHERE available_quantity > 0');
    console.log('   Products with stock:');
    updatedProducts.forEach(product => {
      console.log(`     - ${product.product_name}: ${product.available_quantity} units`);
    });

    // 7. Check egg collection after incubation
    console.log('\n7. Checking egg collection after incubation...');
    const [updatedEggCollection] = await pool.execute('SELECT quantity FROM egg_collections WHERE id = ?', [eggCollectionResult.insertId]);
    console.log(`   Egg collection quantity after incubation: ${updatedEggCollection[0].quantity}`);

    console.log('\n=== Simulation completed successfully ===');

  } catch (error) {
    console.error('Error during simulation:', error);
  } finally {
    await pool.end();
  }
}

simulateProduction();
