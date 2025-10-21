import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        ia.*,
        p.product_name as product_name,
        b.current_quantity as available_quantity,
        p.stock_threshold
      FROM inventory_alerts ia
      LEFT JOIN products p ON ia.product_id = p.id
      LEFT JOIN batches b ON p.breed_id = b.breed_id
      ORDER BY ia.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { product_id, alert_type, message } = await request.json();

    if (!product_id || !alert_type) {
      return NextResponse.json({ message: 'Product ID and alert type are required' }, { status: 400 });
    }

    // Verify product exists
    const [productCheck] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (productCheck.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const [result] = await db.query(
      'INSERT INTO inventory_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
      [product_id, alert_type, message || null]
    );

    return NextResponse.json({
      id: result.insertId,
      product_id,
      alert_type,
      message
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory alert:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, is_read } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'Alert ID is required' }, { status: 400 });
    }

    await db.query(
      'UPDATE inventory_alerts SET is_read = ? WHERE id = ?',
      [is_read, id]
    );

    return NextResponse.json({ message: 'Alert updated successfully' });
  } catch (error) {
    console.error('Error updating inventory alert:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Alert ID is required' }, { status: 400 });
    }

    await db.query('DELETE FROM inventory_alerts WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory alert:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
