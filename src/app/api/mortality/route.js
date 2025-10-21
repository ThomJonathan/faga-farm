import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT
        m.id,
        m.batch_id,
        m.date_recorded,
        m.dead_count,
        m.cause,
        m.notes,
        b.batch_number,
        br.name as breed_name,
        br.type as breed_type
      FROM mortality m
      LEFT JOIN batches b ON m.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      ORDER BY m.date_recorded DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching mortality records:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { batch_id, date_recorded, dead_count, cause, notes } = await request.json();

    if (!batch_id || !date_recorded || !dead_count) {
      return NextResponse.json(
        { message: 'Batch ID, date recorded, and dead count are required' },
        { status: 400 }
      );
    }

    // Check if batch exists and is active
    const [batchCheck] = await pool.execute(
      'SELECT id, current_quantity, breed_id FROM batches WHERE id = ? AND status = "active"',
      [batch_id]
    );

    if (batchCheck.length === 0) {
      return NextResponse.json(
        { message: 'Batch not found or not active' },
        { status: 404 }
      );
    }

    // Check if dead count doesn't exceed current quantity
    if (dead_count > batchCheck[0].current_quantity) {
      return NextResponse.json(
        { message: `Dead count (${dead_count}) cannot exceed current batch quantity (${batchCheck[0].current_quantity})` },
        { status: 400 }
      );
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert mortality record
      const [result] = await connection.execute(
        `INSERT INTO mortality
         (batch_id, date_recorded, dead_count, cause, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [batch_id, date_recorded, dead_count, cause || null, notes || null]
      );

      // Update batch dead count and current quantity
      await connection.execute(
        'UPDATE batches SET dead_count = dead_count + ?, current_quantity = current_quantity - ? WHERE id = ?',
        [dead_count, dead_count, batch_id]
      );

      // Check if there's a chick product for this breed and reduce stock
      const [chickProduct] = await connection.execute(
        'SELECT id, available_quantity FROM products WHERE breed_id = ? AND product_type = "day_old_chicks"',
        [batchCheck[0].breed_id]
      );

      if (chickProduct.length > 0) {
        const productId = chickProduct[0].id;
        const currentStock = chickProduct[0].available_quantity || 0;
        const newStock = Math.max(0, currentStock - dead_count); // Don't go below 0

        // Update chick product stock
        await connection.execute(
          'UPDATE products SET available_quantity = ? WHERE id = ?',
          [newStock, productId]
        );

        // Record inventory transaction
        await connection.execute(
          'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [productId, batch_id, 'adjustment', -dead_count, currentStock, newStock, result.insertId, `Mortality: ${dead_count} chicks died`]
        );

        // Check for stock alerts
        const [productInfo] = await connection.execute(
          'SELECT stock_threshold, alert_enabled FROM products WHERE id = ?',
          [productId]
        );

        if (productInfo.length > 0 && productInfo[0].alert_enabled) {
          const threshold = productInfo[0].stock_threshold || 10;
          if (newStock <= 0) {
            // Create out of stock alert
            await connection.execute(
              'INSERT INTO inventory_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
              [productId, 'out_of_stock', `Chick product is now out of stock due to mortality`]
            );
          } else if (newStock <= threshold) {
            // Create low stock alert
            await connection.execute(
              'INSERT INTO inventory_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
              [productId, 'low_stock', `Chick product is low on stock (${newStock} remaining, threshold: ${threshold}) due to mortality`]
            );
          }
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json(
        { message: 'Mortality record added successfully', id: result.insertId },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating mortality record:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
