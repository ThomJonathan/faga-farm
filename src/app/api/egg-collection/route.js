import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'week', 'month', 'year'
    const date = searchParams.get('date'); // specific date for filtering

    let query = `
      SELECT
        ec.id,
        ec.batch_id,
        ec.collection_date,
        ec.quantity,
        ec.egg_type,
        ec.collected_by,
        ec.notes,
        ec.created_at,
        b.batch_number,
        b.level,
        br.name as breed_name,
        br.type as breed_type,
        u.name as collected_by_name
      FROM egg_collections ec
      LEFT JOIN batches b ON ec.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN users u ON ec.collected_by = u.id
    `;

    const params = [];
    let whereClause = '';

    if (filter && date) {
      const targetDate = new Date(date);
      let startDate, endDate;

      switch (filter) {
        case 'week':
          // Get start of week (Monday)
          const dayOfWeek = targetDate.getDay();
          const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate = new Date(targetDate.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(targetDate.getFullYear(), 0, 1);
          endDate = new Date(targetDate.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
      }

      whereClause = 'WHERE ec.collection_date BETWEEN ? AND ?';
      params.push(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
    }

    query += whereClause + ' ORDER BY ec.collection_date DESC, ec.created_at DESC';

    const [rows] = await pool.execute(query, params);

    // Calculate summary statistics
    const summary = {
      total_quantity: rows.reduce((sum, record) => sum + record.quantity, 0),
      total_records: rows.length,
      by_egg_type: {},
      by_batch: {}
    };

    rows.forEach(record => {
      // Group by egg type
      if (!summary.by_egg_type[record.egg_type]) {
        summary.by_egg_type[record.egg_type] = 0;
      }
      summary.by_egg_type[record.egg_type] += record.quantity;

      // Group by batch
      if (!summary.by_batch[record.batch_id]) {
        summary.by_batch[record.batch_id] = {
          batch_number: record.batch_number,
          breed_name: record.breed_name,
          total_quantity: 0
        };
      }
      summary.by_batch[record.batch_id].total_quantity += record.quantity;
    });

    return NextResponse.json({
      records: rows,
      summary: summary
    });
  } catch (error) {
    console.error('Error fetching egg collections:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      batch_id,
      collection_date,
      quantity,
      egg_type,
      collected_by,
      notes
    } = await request.json();

    if (!batch_id || !collection_date || !quantity || !egg_type || !collected_by) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if batch exists and is active
    const [batchCheck] = await pool.execute(
      'SELECT id, status FROM batches WHERE id = ?',
      [batch_id]
    );

    if (batchCheck.length === 0) {
      return NextResponse.json(
        { message: 'Batch not found' },
        { status: 404 }
      );
    }

    if (batchCheck[0].status !== 'active') {
      return NextResponse.json(
        { message: 'Cannot collect eggs from inactive batch' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [userCheck] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [collected_by]
    );

    if (userCheck.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if collection already exists for this batch and date
    const [existingCollection] = await pool.execute(
      'SELECT id FROM egg_collections WHERE batch_id = ? AND collection_date = ?',
      [batch_id, collection_date]
    );

    if (existingCollection.length > 0) {
      return NextResponse.json(
        { message: 'Egg collection already exists for this batch and date' },
        { status: 400 }
      );
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.execute(
        `INSERT INTO egg_collections
         (batch_id, collection_date, quantity, egg_type, collected_by, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [batch_id, collection_date, quantity, egg_type, collected_by, notes || null]
      );

      // If eggs are for sale, create/update egg product in inventory
      if (egg_type === 'sales') {
        // Get breed information for the batch
        const [batchInfo] = await connection.execute(
          'SELECT breed_id FROM batches WHERE id = ?',
          [batch_id]
        );

        if (batchInfo.length > 0) {
          const breedId = batchInfo[0].breed_id;

          // Check if there's already an egg product for this breed
          const [existingProduct] = await connection.execute(
            'SELECT id, available_quantity FROM products WHERE breed_id = ? AND product_type = "eggs"',
            [breedId]
          );

          let eggProductId;
          if (existingProduct.length > 0) {
            // Update existing egg product stock
            eggProductId = existingProduct[0].id;
            const currentStock = existingProduct[0].available_quantity || 0;
            const newStock = currentStock + quantity;

            await connection.execute(
              'UPDATE products SET available_quantity = ? WHERE id = ?',
              [newStock, eggProductId]
            );

            // Record inventory transaction for stock increase
            await connection.execute(
              'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [eggProductId, batch_id, 'production', quantity, currentStock, newStock, result.insertId, `Egg collection: ${quantity} eggs added to inventory`]
            );
          } else {
            // Create new egg product
            const [breedInfo] = await connection.execute('SELECT name FROM breeds WHERE id = ?', [breedId]);
            const breedName = breedInfo[0].name;

            const [productResult] = await connection.execute(
              'INSERT INTO products (product_name, product_type, description, unit_price, breed_id, available_quantity, stock_threshold, alert_enabled, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [`${breedName} Eggs`, 'eggs', `Fresh ${breedName} eggs for sale`, 50.00, breedId, quantity, 100, true, true]
            );

            eggProductId = productResult.insertId;

            // Record inventory transaction for new product
            await connection.execute(
              'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [eggProductId, batch_id, 'production', quantity, 0, quantity, result.insertId, `New egg product created: ${quantity} eggs added to inventory`]
            );
          }
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json(
        { message: 'Egg collection recorded successfully', id: result.insertId },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating egg collection:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
