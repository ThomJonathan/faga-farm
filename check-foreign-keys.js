const mysql = require('mysql2/promise');

async function checkForeignKeys() {
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
    console.log('=== Checking Foreign Key References ===\n');

    // Check breeds
    console.log('1. Checking breeds table:');
    const [breeds] = await pool.execute('SELECT id, name FROM breeds LIMIT 5');
    console.log('   Available breeds:');
    breeds.forEach(breed => {
      console.log(`     - ID ${breed.id}: ${breed.name}`);
    });

    // Check incubators
    console.log('\n2. Checking incubators table:');
    const [incubators] = await pool.execute('SELECT id, incubator_name FROM incubators LIMIT 5');
    console.log('   Available incubators:');
    incubators.forEach(incubator => {
      console.log(`     - ID ${incubator.id}: ${incubator.incubator_name}`);
    });

    // Check customers
    console.log('\n3. Checking customers table:');
    const [customers] = await pool.execute('SELECT id, name FROM customers LIMIT 5');
    console.log('   Available customers:');
    customers.forEach(customer => {
      console.log(`     - ID ${customer.id}: ${customer.name}`);
    });

    // Check users
    console.log('\n4. Checking users table:');
    const [users] = await pool.execute('SELECT id, name FROM users LIMIT 5');
    console.log('   Available users:');
    users.forEach(user => {
      console.log(`     - ID ${user.id}: ${user.name}`);
    });

    console.log('\n=== Foreign key check completed ===');

  } catch (error) {
    console.error('Error during foreign key check:', error);
  } finally {
    await pool.end();
  }
}

checkForeignKeys();
