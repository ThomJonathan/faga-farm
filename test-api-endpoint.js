const mysql = require('mysql2/promise');

async function testApiEndpoint() {
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
    console.log('=== Testing Available Products API Logic ===\n');

    // Simulate the API logic from route.js
    console.log('1. Querying eggs from products table:');
    const [eggs] = await pool.execute(
      'SELECT p.product_name, b.name as breed, b.type, p.available_quantity as quantity, p.unit_price FROM products p LEFT JOIN breeds b ON p.breed_id = b.id WHERE p.product_type = ? AND p.is_active = 1',
      ['eggs']
    );
    console.log(`   Found ${eggs.length} egg products:`);
    eggs.forEach(egg => {
      console.log(`     - ${egg.product_name} (${egg.breed}): ${egg.quantity} units @ ${egg.unit_price} MWK`);
    });

    console.log('\n2. Querying chicks from products table:');
    const [chicks] = await pool.execute(
      'SELECT p.product_name, b.name as breed, b.type, p.available_quantity as quantity, p.unit_price FROM products p LEFT JOIN breeds b ON p.breed_id = b.id WHERE p.product_type = ? AND p.is_active = 1',
      ['day_old_chicks']
    );
    console.log(`   Found ${chicks.length} chick products:`);
    chicks.forEach(chick => {
      console.log(`     - ${chick.product_name} (${chick.breed}): ${chick.quantity} units @ ${chick.unit_price} MWK`);
    });

    console.log('\n3. Querying meat from products table:');
    const [meat] = await pool.execute(
      'SELECT p.product_name, b.name as breed, b.type, p.available_quantity as quantity, p.unit_price FROM products p LEFT JOIN breeds b ON p.breed_id = b.id WHERE p.product_type = ? AND p.is_active = 1',
      ['meat']
    );
    console.log(`   Found ${meat.length} meat products:`);
    meat.forEach(m => {
      console.log(`     - ${m.product_name} (${m.breed}): ${m.quantity}kg @ ${m.unit_price} MWK/kg`);
    });

    console.log('\n4. Querying manure from products table:');
    const [manure] = await pool.execute(
      'SELECT p.product_name, p.available_quantity as quantity, p.unit_price FROM products p WHERE p.product_type = ? AND p.is_active = 1',
      ['manure']
    );
    console.log(`   Found ${manure.length} manure products:`);
    manure.forEach(m => {
      console.log(`     - ${m.product_name}: ${m.quantity}kg @ ${m.unit_price} MWK/kg`);
    });

    // Calculate totals
    const eggsTotal = eggs.reduce((sum, egg) => sum + egg.quantity, 0);
    const chicksTotal = chicks.reduce((sum, chick) => sum + chick.quantity, 0);
    const meatTotalKg = meat.reduce((sum, m) => sum + m.quantity, 0);
    const manureTotalKg = manure.reduce((sum, m) => sum + m.quantity, 0);

    console.log('\n5. Totals:');
    console.log(`   Eggs: ${eggsTotal} total`);
    console.log(`   Chicks: ${chicksTotal} total`);
    console.log(`   Meat: ${meatTotalKg}kg total`);
    console.log(`   Manure: ${manureTotalKg}kg total`);

    // Format response like the API
    const response = {
      eggs: {
        total: eggsTotal,
        by_product: eggs.map(egg => ({
          product_name: egg.product_name,
          breed: egg.breed,
          type: egg.type,
          quantity: egg.quantity,
          unit_price: parseFloat(egg.unit_price)
        }))
      },
      chicks: {
        total: chicksTotal,
        by_product: chicks.map(chick => ({
          product_name: chick.product_name,
          breed: chick.breed,
          type: chick.type,
          quantity: chick.quantity,
          unit_price: parseFloat(chick.unit_price)
        }))
      },
      meat: {
        total_kg: meatTotalKg,
        by_product: meat.map(m => ({
          product_name: m.product_name,
          breed: m.breed,
          type: m.type,
          kg: m.quantity,
          unit_price: parseFloat(m.unit_price)
        }))
      },
      manure: {
        total_kg: manureTotalKg,
        by_product: manure.map(m => ({
          product_name: m.product_name,
          kg: m.quantity,
          unit_price: parseFloat(m.unit_price)
        }))
      }
    };

    console.log('\n6. API Response Format:');
    console.log(JSON.stringify(response, null, 2));

    console.log('\n=== API Test completed successfully ===');

  } catch (error) {
    console.error('Error during API test:', error);
  } finally {
    await pool.end();
  }
}

testApiEndpoint();
