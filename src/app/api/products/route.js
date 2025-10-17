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
        b.current_quantity
      FROM products p
      LEFT JOIN prices pr ON p.id = pr.product_id AND pr.is_current = TRUE
      LEFT JOIN batches b ON p.breed_id = b.breed_id
      LEFT JOIN breeds br ON p.breed_id = br.id
      ORDER BY p.id DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, type, description, unit_price, batch_id, available_quantity } = await request.json();

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
      'INSERT INTO products (name, type, description, unit_price, batch_id, available_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, description || null, unit_price, batch_id || null, available_quantity || null]
    );

    return NextResponse.json({
      id: result.insertId,
      name,
      type,
      description,
      unit_price,
      batch_id,
      available_quantity
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
