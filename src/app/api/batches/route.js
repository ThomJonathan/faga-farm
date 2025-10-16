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
