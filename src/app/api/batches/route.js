import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT
        b.id,
        b.batch_number,
        b.date_produced,
        b.initial_quantity,
        b.current_quantity,
        b.dead_count,
        b.level,
        b.status,
        b.created_at,
        br.name as breed_name,
        br.type as breed_type,
        h.name as house_name,
        h.type as house_type
      FROM batches b
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN houses h ON b.house_id = h.id
      ORDER BY b.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      breed_id,
      house_id,
      date_produced,
      initial_quantity,
      level
    } = await request.json();

    if (!breed_id || !house_id || !date_produced || !initial_quantity || !level) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if house has enough capacity
    const [houseCheck] = await pool.execute(
      'SELECT capacity, current_occupancy FROM houses WHERE id = ?',
      [house_id]
    );

    if (houseCheck.length === 0) {
      return NextResponse.json(
        { message: 'House not found' },
        { status: 404 }
      );
    }

    const availableSpace = houseCheck[0].capacity - houseCheck[0].current_occupancy;
    if (availableSpace < initial_quantity) {
      return NextResponse.json(
        { message: `Not enough space in house. Available: ${availableSpace}, Required: ${initial_quantity}` },
        { status: 400 }
      );
    }

    // Generate batch number: BATCH-YYYYMMDD-XXXX (where XXXX is sequential number)
    const date = new Date(date_produced);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const [lastBatch] = await pool.execute(
      "SELECT batch_number FROM batches WHERE batch_number LIKE ? ORDER BY id DESC LIMIT 1",
      [`BATCH-${dateStr}-%`]
    );

    let sequence = 1;
    if (lastBatch.length > 0) {
      const lastSequence = parseInt(lastBatch[0].batch_number.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const batchNumber = `BATCH-${dateStr}-${sequence.toString().padStart(4, '0')}`;

    const [result] = await pool.execute(
      `INSERT INTO batches
       (breed_id, house_id, batch_number, date_produced, initial_quantity, current_quantity, level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [breed_id, house_id, batchNumber, date_produced, initial_quantity, initial_quantity, level]
    );

    // Update house occupancy
    await pool.execute(
      'UPDATE houses SET current_occupancy = current_occupancy + ? WHERE id = ?',
      [initial_quantity, house_id]
    );

    // Check if there's already a chick product for this breed, if not create one
    const [existingProduct] = await pool.execute(
      'SELECT id, available_quantity FROM products WHERE breed_id = ? AND product_type = "day_old_chicks"',
      [breed_id]
    );

    let chickProductId;
    if (existingProduct.length > 0) {
      // Update existing chick product stock
      chickProductId = existingProduct[0].id;
      const currentStock = existingProduct[0].available_quantity || 0;
      const newStock = currentStock + initial_quantity;

      await pool.execute(
        'UPDATE products SET available_quantity = ? WHERE id = ?',
        [newStock, chickProductId]
      );

      // Record inventory transaction for stock increase
      await pool.execute(
        'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [chickProductId, result.insertId, 'production', initial_quantity, currentStock, newStock, result.insertId, `New batch ${batchNumber} created - chicks added to inventory`]
      );
    } else {
      // Create new chick product
      const [breedInfo] = await pool.execute('SELECT name FROM breeds WHERE id = ?', [breed_id]);
      const breedName = breedInfo[0].name;

      const [productResult] = await pool.execute(
        'INSERT INTO products (product_name, product_type, description, unit_price, breed_id, available_quantity, stock_threshold, alert_enabled, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`${breedName} Chicks`, 'day_old_chicks', `Live ${breedName} chicks for sale`, 500.00, breed_id, initial_quantity, 50, true, true]
      );

      chickProductId = productResult.insertId;

      // Record inventory transaction for new product
      await pool.execute(
        'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [chickProductId, result.insertId, 'production', initial_quantity, 0, initial_quantity, result.insertId, `New chick product created for batch ${batchNumber}`]
      );
    }

    return NextResponse.json(
      { message: 'Batch created successfully', id: result.insertId, batch_number: batchNumber },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
