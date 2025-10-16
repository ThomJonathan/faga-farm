import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        co.*,
        c.name as customer_name,
        c.email as customer_email,
        u.name as sales_person_name
      FROM customer_orders co
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN users u ON co.sales_person_id = u.id
      ORDER BY co.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { customer_id, order_date, total_amount, status, notes, sales_person_id } = await request.json();

    if (!customer_id || !order_date || !total_amount || !sales_person_id) {
      return NextResponse.json({ message: 'Customer, order date, total amount, and sales person are required' }, { status: 400 });
    }

    // Verify customer exists
    const [customerCheck] = await db.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (customerCheck.length === 0) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    // Verify sales person exists
    const [salesPersonCheck] = await db.query('SELECT id FROM users WHERE id = ? AND role = "sales_person"', [sales_person_id]);
    if (salesPersonCheck.length === 0) {
      return NextResponse.json({ message: 'Sales person not found' }, { status: 404 });
    }

    const [result] = await db.query(
      'INSERT INTO customer_orders (customer_id, order_date, total_amount, status, sales_person_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, order_date, total_amount, status || 'pending', sales_person_id, notes || null]
    );

    return NextResponse.json({
      id: result.insertId,
      customer_id,
      order_date,
      total_amount,
      status: status || 'pending',
      notes
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
