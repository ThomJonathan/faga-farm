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
    const { customer_id, order_date, total_amount, status, notes, sales_person_id, items } = await request.json();

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

    // Validate order items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.unit_price === undefined) {
          return NextResponse.json({ message: 'Each order item must have product_id, quantity, and unit_price' }, { status: 400 });
        }

        // Verify product exists and check stock
        const [productCheck] = await db.query('SELECT id, available_quantity, stock_threshold, alert_enabled FROM products WHERE id = ?', [item.product_id]);
        if (productCheck.length === 0) {
          return NextResponse.json({ message: `Product with ID ${item.product_id} not found` }, { status: 404 });
        }

        const currentQuantity = productCheck[0].available_quantity || 0;

        // Check if sufficient stock
        if (currentQuantity < item.quantity) {
          return NextResponse.json({ message: `Insufficient stock for product ${item.product_id}. Available: ${currentQuantity}, Requested: ${item.quantity}` }, { status: 400 });
        }

        // Verify batch exists if provided
        if (item.batch_id) {
          const [batchCheck] = await db.query('SELECT id FROM batches WHERE id = ?', [item.batch_id]);
          if (batchCheck.length === 0) {
            return NextResponse.json({ message: `Batch with ID ${item.batch_id} not found` }, { status: 404 });
          }
        }
      }
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Create the order
      const [result] = await db.query(
        'INSERT INTO customer_orders (customer_id, order_date, total_amount, status, sales_person_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customer_id, order_date, total_amount, status || 'pending', sales_person_id, notes || null]
      );

      const orderId = result.insertId;

      // Create order items if provided and update inventory
      if (items && items.length > 0) {
        const orderItemsValues = items.map(item => [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.total_price || (item.quantity * item.unit_price),
          item.batch_id || null
        ]);

        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, batch_id) VALUES ?',
          [orderItemsValues]
        );

        // Update inventory for each item
        for (const item of items) {
          // Get current product quantity
          const [productCheck] = await db.query('SELECT available_quantity, stock_threshold, alert_enabled FROM products WHERE id = ?', [item.product_id]);
          const currentQuantity = productCheck[0].available_quantity || 0;
          const newQuantity = currentQuantity - item.quantity;

          // Update product inventory
          await db.query(
            'UPDATE products SET available_quantity = ? WHERE id = ?',
            [newQuantity, item.product_id]
          );

          // Record inventory transaction
          await db.query(
            'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [item.product_id, item.batch_id || null, 'sale', -item.quantity, currentQuantity, newQuantity, orderId, sales_person_id]
          );

          // Check for stock alerts
          const product = productCheck[0];
          if (product.alert_enabled) {
            if (newQuantity <= 0) {
              // Create out of stock alert
              await db.query(
                'INSERT INTO inventory_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
                [item.product_id, 'out_of_stock', `Product "${product.product_name}" is now out of stock`]
              );
            } else if (newQuantity <= product.stock_threshold) {
              // Create low stock alert
              await db.query(
                'INSERT INTO inventory_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
                [item.product_id, 'low_stock', `Product "${product.product_name}" is low on stock (${newQuantity} remaining, threshold: ${product.stock_threshold})`]
              );
            }
          }
        }
      }

      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json({
        id: orderId,
        customer_id,
        order_date,
        total_amount,
        status: status || 'pending',
        notes,
        items: items || []
      }, { status: 201 });

    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
