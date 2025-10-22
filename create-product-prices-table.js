const mysql = require('mysql2/promise');

async function createTable() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'fagafarm'
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS product_prices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_type ENUM('eggs', 'chicks', 'meat', 'manure') NOT NULL,
      breed_name VARCHAR(255),
      price_per_unit DECIMAL(10,2) NOT NULL,
      unit ENUM('piece', 'kg', 'dozen') NOT NULL,
      effective_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  await db.execute(sql);
  console.log('Product prices table created successfully');
  await db.end();
}

createTable().catch(console.error);
