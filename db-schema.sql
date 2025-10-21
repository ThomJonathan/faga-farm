-- Database schema changes for inventory management

-- Add stock threshold columns to products table
ALTER TABLE products
ADD COLUMN stock_threshold INT DEFAULT 10,
ADD COLUMN alert_enabled BOOLEAN DEFAULT TRUE;

-- Create inventory_alerts table for tracking stock alerts
CREATE TABLE inventory_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  alert_type ENUM('low_stock', 'out_of_stock', 'threshold_reached') NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create inventory_transactions table for tracking stock movements
CREATE TABLE inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  batch_id INT,
  transaction_type ENUM('sale', 'production', 'adjustment', 'transfer') NOT NULL,
  quantity_change INT NOT NULL,
  previous_quantity INT,
  new_quantity INT,
  reference_id INT, -- sale_id, batch_id, etc.
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
