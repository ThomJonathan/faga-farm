const pool = require('./src/lib/db');

async function addColumns() {
  try {
    // Add columns to batches table one by one
    try {
      await pool.execute(`
        ALTER TABLE batches
        ADD COLUMN last_vaccination_date DATE
      `);
      console.log('batches table last_vaccination_date column added');
    } catch (error) {
      console.log('last_vaccination_date column may already exist');
    }

    try {
      await pool.execute(`
        ALTER TABLE batches
        ADD COLUMN next_vaccination_due DATE
      `);
      console.log('batches table next_vaccination_due column added');
    } catch (error) {
      console.log('next_vaccination_due column may already exist');
    }

    try {
      await pool.execute(`
        ALTER TABLE batches
        ADD COLUMN last_treatment_date DATE
      `);
      console.log('batches table last_treatment_date column added');
    } catch (error) {
      console.log('last_treatment_date column may already exist');
    }

    try {
      await pool.execute(`
        ALTER TABLE batches
        ADD COLUMN next_treatment_due DATE
      `);
      console.log('batches table next_treatment_due column added');
    } catch (error) {
      console.log('next_treatment_due column may already exist');
    }

    try {
      await pool.execute(`
        ALTER TABLE batches
        ADD COLUMN health_status ENUM('healthy', 'sick', 'recovering', 'critical') DEFAULT 'healthy'
      `);
      console.log('batches table health_status column added');
    } catch (error) {
      console.log('health_status column may already exist');
    }

    // Add columns to egg_incubation table one by one
    try {
      await pool.execute(`
        ALTER TABLE egg_incubation
        ADD COLUMN hatch_alert_sent BOOLEAN DEFAULT FALSE
      `);
      console.log('egg_incubation table hatch_alert_sent column added');
    } catch (error) {
      console.log('hatch_alert_sent column may already exist');
    }

    try {
      await pool.execute(`
        ALTER TABLE egg_incubation
        ADD COLUMN hatch_alert_date DATE
      `);
      console.log('egg_incubation table hatch_alert_date column added');
    } catch (error) {
      console.log('hatch_alert_date column may already exist');
    }

    try {
      await pool.execute(`
        ALTER TABLE egg_incubation
        ADD COLUMN hatch_alert_days_before INT DEFAULT 3
      `);
      console.log('egg_incubation table hatch_alert_days_before column added');
    } catch (error) {
      console.log('hatch_alert_days_before column may already exist');
    }

  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    pool.end();
  }
}

addColumns();
