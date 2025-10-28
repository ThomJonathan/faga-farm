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

    // changed: ensure sold_by is a numeric id
    const soldById = parseInt(sold_by, 10);
    if (isNaN(soldById)) {
      return NextResponse.json({ message: 'Invalid sold_by id' }, { status: 400 });
    }

    // Verify customer exists
    const [customerCheck] = await db.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (customerCheck.length === 0) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    // changed: more tolerant sales-person role check and use numeric soldById
    console.log('Validating sold_by id:', soldById);
    const [userCheck] = await db.query(
      "SELECT id, role FROM users WHERE id = ? AND (role = 'sales_person' OR role = 'sales-person' OR role = 'sales person' OR role LIKE '%sales%')",
      [soldById]
    );
    console.log('userCheck result:', userCheck && userCheck.length ? userCheck[0] : null);
    if (userCheck.length === 0) {
      return NextResponse.json({ message: 'Sales person not found' }, { status: 404 });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Insert the sale (use soldById)
      const [saleResult] = await db.query(
        'INSERT INTO sales (customer_id, sale_date, total_price, sold_by, payment_status, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customer_id, sale_date, total_price, soldById, payment_status || 'pending', notes || null]
      );

      const saleId = saleResult.insertId;

      // Insert sale items if provided and update inventory
      if (items && items.length > 0) {
        for (const item of items) {
          // Verify product exists
          const [productCheck] = await db.query('SELECT id, available_quantity, stock_threshold, alert_enabled FROM products WHERE id = ?', [item.product_id]);
          if (productCheck.length === 0) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }

          const currentQuantity = productCheck[0].available_quantity || 0;

          // Check if sufficient stock
          if (currentQuantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${currentQuantity}, Requested: ${item.quantity}`);
          }

          // Verify batch exists if provided
          if (item.batch_id) {
            const [batchCheck] = await db.query('SELECT id FROM batches WHERE id = ?', [item.batch_id]);
            if (batchCheck.length === 0) {
              throw new Error(`Batch with ID ${item.batch_id} not found`);
            }
          }

          // Insert sale item
          await db.query(
            'INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
            [saleId, item.product_id, item.batch_id || null, item.quantity, item.unit_price, item.total_price]
          );

          // Update product inventory
          const newQuantity = currentQuantity - item.quantity;
          await db.query(
            'UPDATE products SET available_quantity = ? WHERE id = ?',
            [newQuantity, item.product_id]
          );

          // Record inventory transaction (use soldById for created_by)
          await db.query(
            'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [item.product_id, item.batch_id || null, 'sale', -item.quantity, currentQuantity, newQuantity, saleId, soldById]
          );

          // Check for stock alerts
          const product = productCheck[0];
          if (product.alert_enabled) {
            if (newQuantity <= 0) {
              // Create out of stock alert
              await db.query(
                'INSERT INTO inventory_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
                [item.product_id, 'out_of_stock', `Product "${product.name}" is now out of stock`]
              );
            } else if (newQuantity <= product.stock_threshold) {
              // Create low stock alert
              await db.query(
                'INSERT INTO inventory_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
                [item.product_id, 'low_stock', `Product "${product.name}" is low on stock (${newQuantity} remaining, threshold: ${product.stock_threshold})`]
              );
            }
          }
        }
      }

      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json({
        id: saleId,
        customer_id,
        sale_date,
        total_price,
        sold_by: soldById,
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
