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
      'SELECT id, current_quantity FROM batches WHERE id = ? AND status = "active"',
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

    // Insert mortality record
    const [result] = await pool.execute(
      `INSERT INTO mortality
       (batch_id, date_recorded, dead_count, cause, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [batch_id, date_recorded, dead_count, cause || null, notes || null]
    );

    // Update batch dead count and current quantity
    await pool.execute(
      'UPDATE batches SET dead_count = dead_count + ?, current_quantity = current_quantity - ? WHERE id = ?',
      [dead_count, dead_count, batch_id]
    );

    return NextResponse.json(
      { message: 'Mortality record added successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating mortality record:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
