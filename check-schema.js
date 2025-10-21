const pool = require('./src/lib/db');

async function checkSchema() {
  try {
    console.log('=== DATABASE SCHEMA CHECK ===\n');

    // Check all tables
    const [tables] = await pool.execute("SHOW TABLES");
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });

    console.log('\n=== TABLE STRUCTURES ===\n');

    // Check key tables structure
    const tablesToCheck = [
      'manure_production',
      'meat_production',
      'vaccinations',
      'treatments',
      'expenses',
      'batches',
      'egg_incubation'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
        console.log(`\n${tableName.toUpperCase()} TABLE:`);
        columns.forEach(col => {
          console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });
      } catch (error) {
        console.log(`\n${tableName.toUpperCase()} TABLE: NOT FOUND`);
      }
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    pool.end();
  }
}

checkSchema();
