const mysql = require('mysql2/promise');

async function test() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'fagafarm'
  });
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        pr.product_name as product_type,
        b.name as breed_name,
        p.unit_price as price_per_unit,
        'piece' as unit,
        p.effective_date,
        NULL as notes,
        p.created_at,
        p.updated_at
      FROM prices p
      LEFT JOIN products pr ON p.product_id = pr.id
      LEFT JOIN breeds b ON pr.breed_id = b.id
      WHERE p.is_current = 1
      ORDER BY pr.product_name, p.effective_date DESC
      LIMIT 5
    `);
    console.log('Query successful:', rows.length, 'rows');
    console.log('First row:', rows[0]);
  } catch (error) {
    console.error('Query error:', error.message);
  }
  await db.end();
}

test().catch(console.error);
