import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        oi.*,
        p.product_name as product_name,
        p.product_type as product_type,
        b.batch_number,
        br.name as breed_name,
        c.name as customer_name,
        co.order_date
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN batches b ON oi.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN customer_orders co ON oi.order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      ORDER BY oi.id DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching order items:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { order_id, product_id, quantity, unit_price, total_price, batch_id } = await request.json();

    if (!order_id || !product_id || !quantity || !unit_price || !total_price) {
      return NextResponse.json({ message: 'Order ID, product ID, quantity, unit price, and total price are required' }, { status: 400 });
    }

    // Verify order exists
    const [orderCheck] = await db.query('SELECT id FROM customer_orders WHERE id = ?', [order_id]);
    if (orderCheck.length === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Verify product exists
    const [productCheck] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (productCheck.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Verify batch exists if provided
    if (batch_id) {
      const [batchCheck] = await db.query('SELECT id FROM batches WHERE id = ?', [batch_id]);
      if (batchCheck.length === 0) {
        return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
      }
    }

    const [result] = await db.query(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, batch_id) VALUES (?, ?, ?, ?, ?, ?)',
      [order_id, product_id, quantity, unit_price, total_price, batch_id || null]
    );

    return NextResponse.json({
      id: result.insertId,
      order_id,
      product_id,
      quantity,
      unit_price,
      total_price,
      batch_id
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order item:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
