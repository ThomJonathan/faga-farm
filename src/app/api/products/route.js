import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        p.*,
        pr.unit_price as current_price,
        pr.effective_date,
        b.batch_number,
        br.name as breed_name,
        b.level,
        b.current_quantity,
        CASE
          WHEN p.stock_threshold IS NULL OR p.stock_threshold = 0 THEN 'normal'
          WHEN p.alert_enabled = TRUE AND b.current_quantity <= p.stock_threshold THEN 'low_stock'
          WHEN b.current_quantity <= 0 THEN 'out_of_stock'
          ELSE 'normal'
        END as stock_status
      FROM products p
      LEFT JOIN prices pr ON p.id = pr.product_id AND pr.is_current = TRUE
      LEFT JOIN batches b ON p.breed_id = b.breed_id
      LEFT JOIN breeds br ON p.breed_id = br.id
      ORDER BY p.id DESC
    `);

    // Transform column names to match expected format
    const transformedRows = rows.map(row => ({
      id: row.id,
      name: row.product_name,
      type: row.product_type,
      description: row.description,
      unit_price: row.unit_price,
      batch_id: row.batch_id,
      available_quantity: row.available_quantity,
      stock_threshold: row.stock_threshold,
      alert_enabled: row.alert_enabled,
      is_active: row.is_active,
      created_at: row.created_at,
      current_price: row.current_price,
      effective_date: row.effective_date,
      batch_number: row.batch_number,
      breed_name: row.breed_name,
      level: row.level,
      current_quantity: row.current_quantity,
      stock_status: row.stock_status
    }));

    return NextResponse.json(transformedRows);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, type, description, unit_price, batch_id, available_quantity, stock_threshold, alert_enabled } = await request.json();

    if (!name || !type || !unit_price) {
      return NextResponse.json({ message: 'Name, type, and unit price are required' }, { status: 400 });
    }

    // Verify batch exists if provided
    if (batch_id) {
      const [batchCheck] = await db.query('SELECT id FROM batches WHERE id = ?', [batch_id]);
      if (batchCheck.length === 0) {
        return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
      }
    }

    const [result] = await db.query(
      'INSERT INTO products (product_name, product_type, description, unit_price, batch_id, available_quantity, stock_threshold, alert_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, type, description || null, unit_price, batch_id || null, available_quantity || null, stock_threshold || 10, alert_enabled !== undefined ? alert_enabled : true]
    );

    return NextResponse.json({
      id: result.insertId,
      name,
      type,
      description,
      unit_price,
      batch_id,
      available_quantity,
      stock_threshold: stock_threshold || 10,
      alert_enabled: alert_enabled !== undefined ? alert_enabled : true
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
