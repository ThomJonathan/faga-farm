const pool = require('./src/lib/db');

async function createTables() {
  try {
    // Create manure_production table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS manure_production (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        production_date DATE NOT NULL,
        quantity_kg DECIMAL(10,2) NOT NULL,
        quality_rating ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
        notes TEXT,
        recorded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('manure_production table created successfully');

    // Create meat_production table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS meat_production (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        production_date DATE NOT NULL,
        quantity_kg DECIMAL(10,2) NOT NULL,
        average_weight_kg DECIMAL(5,2),
        quality_rating ENUM('premium', 'standard', 'utility') DEFAULT 'standard',
        processing_cost DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        recorded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('meat_production table created successfully');

    // Create vaccinations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vaccinations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        vaccine_name VARCHAR(255) NOT NULL,
        vaccination_date DATE NOT NULL,
        dosage VARCHAR(100),
        cost_per_unit DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        administered_by INT,
        next_due_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (administered_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('vaccinations table created successfully');

    // Create treatments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS treatments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        treatment_type VARCHAR(255) NOT NULL,
        treatment_date DATE NOT NULL,
        medication_name VARCHAR(255),
        dosage VARCHAR(100),
        cost_per_unit DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        administered_by INT,
        next_due_date DATE,
        effectiveness_rating ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (administered_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('treatments table created successfully');

    // Create expenses table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expense_type ENUM('vaccination', 'treatment', 'bedding', 'feed', 'equipment', 'utilities', 'labor', 'other') NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        category VARCHAR(100),
        reference_id INT,
        recorded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('expenses table created successfully');

    // Create production_summary table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS production_summary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        summary_date DATE NOT NULL,
        total_eggs_collected INT DEFAULT 0,
        total_manure_kg DECIMAL(10,2) DEFAULT 0,
        total_meat_kg DECIMAL(10,2) DEFAULT 0,
        total_batches_active INT DEFAULT 0,
        total_incubations_active INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date (summary_date)
      )
    `);
    console.log('production_summary table created successfully');

    // Create sales_summary table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sales_summary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        summary_date DATE NOT NULL,
        total_sales DECIMAL(10,2) DEFAULT 0,
        total_orders INT DEFAULT 0,
        total_customers INT DEFAULT 0,
        top_product VARCHAR(255),
        top_product_quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date (summary_date)
      )
    `);
    console.log('sales_summary table created successfully');

    // Add columns to batches table
    try {
      await pool.execute(`
        ALTER TABLE batches
        ADD COLUMN IF NOT EXISTS last_vaccination_date DATE,
        ADD COLUMN IF NOT EXISTS next_vaccination_due DATE,
        ADD COLUMN IF NOT EXISTS last_treatment_date DATE,
        ADD COLUMN IF NOT EXISTS next_treatment_due DATE,
        ADD COLUMN IF NOT EXISTS health_status ENUM('healthy', 'sick', 'recovering', 'critical') DEFAULT 'healthy'
      `);
      console.log('batches table columns added successfully');
    } catch (error) {
      console.log('batches table columns may already exist:', error.message);
    }

    // Add columns to egg_incubation table
    try {
      await pool.execute(`
        ALTER TABLE egg_incubation
        ADD COLUMN IF NOT EXISTS hatch_alert_sent BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS hatch_alert_date DATE,
        ADD COLUMN IF NOT EXISTS hatch_alert_days_before INT DEFAULT 3
      `);
      console.log('egg_incubation table columns added successfully');
    } catch (error) {
      console.log('egg_incubation table columns may already exist:', error.message);
    }

  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    pool.end();
  }
}

createTables();
