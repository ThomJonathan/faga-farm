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
    const { customer_id, sale_date, total_price, payment_status, notes, sold_by, items } = await request.json();

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

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Insert the sale
      const [saleResult] = await db.query(
        'INSERT INTO sales (customer_id, sale_date, total_price, sold_by, payment_status, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customer_id, sale_date, total_price, sold_by, payment_status || 'pending', notes || null]
      );

      const saleId = saleResult.insertId;

      // Insert sale items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          // Verify product exists
          const [productCheck] = await db.query('SELECT id FROM products WHERE id = ?', [item.product_id]);
          if (productCheck.length === 0) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }

          // Verify batch exists if provided
          if (item.batch_id) {
            const [batchCheck] = await db.query('SELECT id FROM batches WHERE id = ?', [item.batch_id]);
            if (batchCheck.length === 0) {
              throw new Error(`Batch with ID ${item.batch_id} not found`);
            }
          }

          await db.query(
            'INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
            [saleId, item.product_id, item.batch_id || null, item.quantity, item.unit_price, item.total_price]
          );
        }
      }

      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json({
        id: saleId,
        customer_id,
        sale_date,
        total_price,
        sold_by,
        payment_status: payment_status || 'pending',
        notes,
        items: items || []
      }, { status: 201 });

    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
