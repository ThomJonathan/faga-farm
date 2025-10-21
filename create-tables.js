const pool = require('./src/lib/db');

async function createTables() {
  try {
    // Create inventory_alerts table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventory_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        alert_type ENUM('low_stock', 'out_of_stock', 'threshold_reached') NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('inventory_alerts table created successfully');

    // Create inventory_transactions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        batch_id INT,
        transaction_type ENUM('sale', 'production', 'adjustment', 'transfer') NOT NULL,
        quantity_change INT NOT NULL,
        previous_quantity INT,
        new_quantity INT,
        reference_id INT,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('inventory_transactions table created successfully');

  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    pool.end();
  }
}

createTables();
