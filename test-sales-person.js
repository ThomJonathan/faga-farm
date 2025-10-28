const db = require('./src/lib/db');

async function testSalesPerson() {
  try {
    // Check if there are any sales_person users
    const [salesPeople] = await db.query("SELECT id, name, username, role FROM users WHERE role = 'sales_person' LIMIT 5");
    console.log('Sales people found:', salesPeople);

    if (salesPeople.length === 0) {
      console.log('No sales_person users found. Creating a test one...');

      // Create a test sales person
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);

      const [result] = await db.query(
        'INSERT INTO users (name, username, password, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test Sales Person', 'salesperson', hashedPassword, 'sales@test.com', '+265999123456', 'sales_person']
      );

      console.log('Created test sales person with ID:', result.insertId);
      return result.insertId;
    }

    return salesPeople[0].id;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testSalesPerson();
