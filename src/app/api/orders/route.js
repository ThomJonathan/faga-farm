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
    const [salesPersonCheck] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'sales_person'",
      [sales_person_id]
    );
    if (salesPersonCheck.length === 0) {
      return NextResponse.json({ message: 'Sales person not found' }, { status: 404 });
    }

    // Validate order items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.unit_price === undefined) {
          return NextResponse.json({ message: 'Each order item must have product_id, quantity, and unit_price' }, { status: 400 });
        }

        // For available products, we need to check stock from the actual production tables
        // Parse the product_id to determine which table to check
        let stockCheckQuery = '';
        let stockCheckParams = [];

        if (item.product_id.toString().startsWith('egg-')) {
          // Egg product - check egg_collections table
          const productName = item.product_id.replace('egg-', '').replace(/-/g, ' ');
          stockCheckQuery = `
            SELECT SUM(ec.quantity) as total_quantity
            FROM egg_collections ec
            LEFT JOIN batches b ON ec.batch_id = b.id
            LEFT JOIN breeds br ON b.breed_id = br.id
            WHERE CONCAT(br.name, ' Eggs') = ? AND ec.quantity > 0
          `;
          stockCheckParams = [productName];
        } else if (item.product_id.toString().startsWith('chick-')) {
          // Chick product - check batches table
          const productName = item.product_id.replace('chick-', '').replace(/-/g, ' ');
          stockCheckQuery = `
            SELECT SUM(b.current_quantity) as total_quantity
            FROM batches b
            LEFT JOIN breeds br ON b.breed_id = br.id
            WHERE CONCAT('Day Old ', br.name, ' Chicks') = ? AND b.status = 'active' AND b.current_quantity > 0
          `;
          stockCheckParams = [productName];
        } else if (item.product_id.toString().startsWith('meat-')) {
          // Meat product - check meat_production table
          const productName = item.product_id.replace('meat-', '').replace(/-/g, ' ');
          stockCheckQuery = `
            SELECT SUM(mp.quantity_kg) as total_quantity
            FROM meat_production mp
            LEFT JOIN batches b ON mp.batch_id = b.id
            LEFT JOIN breeds br ON b.breed_id = br.id
            WHERE CONCAT('Dressed ', br.name, ' Chicken') = ? AND mp.quantity_kg > 0
          `;
          stockCheckParams = [productName];
        } else if (item.product_id.toString().startsWith('manure-')) {
          // Manure product - check manure_production table
          const productName = item.product_id.replace('manure-', '').replace(/-/g, ' ');
          stockCheckQuery = `
            SELECT SUM(mp.quantity_kg) as total_quantity
            FROM manure_production mp
            LEFT JOIN batches b ON mp.batch_id = b.id
            LEFT JOIN breeds br ON b.breed_id = br.id
            WHERE CONCAT(br.name, ' Manure') = ? AND mp.quantity_kg > 0
          `;
          stockCheckParams = [productName];
        } else {
          return NextResponse.json({ message: `Invalid product ID format: ${item.product_id}` }, { status: 400 });
        }

        const [stockCheck] = await db.query(stockCheckQuery, stockCheckParams);
        const currentQuantity = stockCheck[0]?.total_quantity || 0;

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

        // Update inventory for each item based on product type
        for (const item of items) {
          if (item.product_id.toString().startsWith('egg-')) {
            // For eggs, we don't update inventory as they are tracked in egg_collections
            // The inventory is automatically managed by the production process
            continue;
          } else if (item.product_id.toString().startsWith('chick-')) {
            // For chicks, update batch quantities
            // This is complex as we need to distribute the sale across batches
            // For now, we'll skip inventory update for chicks as they are managed differently
            continue;
          } else if (item.product_id.toString().startsWith('meat-')) {
            // For meat, update meat_production quantities
            const productName = item.product_id.replace('meat-', '').replace(/-/g, ' ');
            // Find meat production records and reduce quantities
            const [meatRecords] = await db.query(`
              SELECT mp.id, mp.quantity_kg
              FROM meat_production mp
              LEFT JOIN batches b ON mp.batch_id = b.id
              LEFT JOIN breeds br ON b.breed_id = br.id
              WHERE CONCAT('Dressed ', br.name, ' Chicken') = ? AND mp.quantity_kg > 0
              ORDER BY mp.created_at ASC
            `, [productName]);

            let remainingToDeduct = item.quantity;
            for (const record of meatRecords) {
              if (remainingToDeduct <= 0) break;

              const deductAmount = Math.min(record.quantity_kg, remainingToDeduct);
              const newQuantity = record.quantity_kg - deductAmount;

              await db.query(
                'UPDATE meat_production SET quantity_kg = ? WHERE id = ?',
                [newQuantity, record.id]
              );

              remainingToDeduct -= deductAmount;
            }
          } else if (item.product_id.toString().startsWith('manure-')) {
            // For manure, update manure_production quantities
            const productName = item.product_id.replace('manure-', '').replace(/-/g, ' ');
            // Find manure production records and reduce quantities
            const [manureRecords] = await db.query(`
              SELECT mp.id, mp.quantity_kg
              FROM manure_production mp
              LEFT JOIN batches b ON mp.batch_id = b.id
              LEFT JOIN breeds br ON b.breed_id = br.id
              WHERE CONCAT(br.name, ' Manure') = ? AND mp.quantity_kg > 0
              ORDER BY mp.created_at ASC
            `, [productName]);

            let remainingToDeduct = item.quantity;
            for (const record of manureRecords) {
              if (remainingToDeduct <= 0) break;

              const deductAmount = Math.min(record.quantity_kg, remainingToDeduct);
              const newQuantity = record.quantity_kg - deductAmount;

              await db.query(
                'UPDATE manure_production SET quantity_kg = ? WHERE id = ?',
                [newQuantity, record.id]
              );

              remainingToDeduct -= deductAmount;
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
