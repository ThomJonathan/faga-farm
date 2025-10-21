-- Create notifications table for the poultry farm management system
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL, -- NULL means notification is for all users
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('inventory', 'sales', 'production', 'health', 'system') NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'normal',
  related_id INT NULL, -- ID of related record (product, sale, batch, etc.)
  related_type VARCHAR(50) NULL, -- Type of related record
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME NULL,
  created_by INT NULL, -- User who created the notification
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_related (related_id, related_type)
);

-- Insert some sample notifications for testing
INSERT INTO notifications (user_id, title, message, type, priority, related_type) VALUES
(NULL, 'Welcome to Faga Farm Management System', 'Your poultry farm management system is now active. Start by adding your first batch of chickens.', 'system', 'low', NULL),
(NULL, 'Low Stock Alert: Eggs', 'Egg inventory is running low. Current stock: 45 units. Consider restocking soon.', 'inventory', 'medium', 'product'),
(NULL, 'Vaccination Due', 'Batch B001 has vaccinations due in 2 days. Please schedule the vaccination session.', 'health', 'high', 'batch'),
(NULL, 'Monthly Sales Report Available', 'Your sales report for December is ready. Total revenue: MWK 45,000.', 'sales', 'low', NULL);
