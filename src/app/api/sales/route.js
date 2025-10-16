import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        s.*,
        c.name as customer_name,
        c.email as customer_email
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { customer_id, order_id, sale_date, total_price, payment_method, notes, sold_by } = await request.json();

    if (!customer_id || !sale_date || !total_price || !sold_by) {
      return NextResponse.json({ message: 'Customer, sale date, total price, and sold by are required' }, { status: 400 });
    }

    // Verify customer exists
    const [customerCheck] = await db.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (customerCheck.length === 0) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    // Verify sold_by user exists and is a sales person
    const [userCheck] = await db.query('SELECT id FROM users WHERE id = ? AND role = "sales_person"', [sold_by]);
    if (userCheck.length === 0) {
      return NextResponse.json({ message: 'Sales person not found' }, { status: 404 });
    }

    // Verify order exists if provided
    if (order_id) {
      const [orderCheck] = await db.query('SELECT id FROM customer_orders WHERE id = ?', [order_id]);
      if (orderCheck.length === 0) {
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }
    }

    const [result] = await db.query(
      'INSERT INTO sales (customer_id, order_id, sale_date, total_price, sold_by, payment_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_id, order_id || null, sale_date, total_price, sold_by, payment_method || 'pending', notes || null]
    );

    return NextResponse.json({
      id: result.insertId,
      customer_id,
      order_id,
      sale_date,
      total_price,
      sold_by,
      payment_status: payment_method || 'pending',
      notes
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
