const pool = require('./src/lib/db');

async function addNumberOfBirdsColumn() {
  try {
    // Add number_of_birds column to meat_production table
    try {
      await pool.execute(`
        ALTER TABLE meat_production
        ADD COLUMN number_of_birds INT NOT NULL AFTER quantity_kg
      `);
      console.log('meat_production table number_of_birds column added successfully');
    } catch (error) {
      console.log('number_of_birds column may already exist:', error.message);
    }

  } catch (error) {
    console.error('Error adding number_of_birds column:', error);
  } finally {
    pool.end();
  }
}

addNumberOfBirdsColumn();
