const mysql = require('mysql2/promise');

async function setupNotifications() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'fagafarm'
  });

  try {
    console.log('Creating notifications table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('inventory', 'sales', 'production', 'health', 'system') NOT NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        related_id INT NULL,
        related_type VARCHAR(50) NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at DATETIME NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at),
        INDEX idx_related (related_id, related_type)
      )
    `);

    console.log('Inserting sample notifications...');

    await connection.execute(`
      INSERT INTO notifications (user_id, title, message, type, priority, related_type) VALUES
      (NULL, 'Welcome to Faga Farm Management System', 'Your poultry farm management system is now active. Start by adding your first batch of chickens.', 'system', 'low', NULL),
      (NULL, 'Low Stock Alert: Eggs', 'Egg inventory is running low. Current stock: 45 units. Consider restocking soon.', 'inventory', 'medium', 'product'),
      (NULL, 'Vaccination Due', 'Batch B001 has vaccinations due in 2 days. Please schedule the vaccination session.', 'health', 'high', 'batch'),
      (NULL, 'Monthly Sales Report Available', 'Your sales report for December is ready. Total revenue: MWK 45,000.', 'sales', 'low', NULL)
    `);

    console.log('Notifications table setup complete!');
  } catch (error) {
    console.error('Error setting up notifications:', error);
  } finally {
    await connection.end();
  }
}

setupNotifications();
