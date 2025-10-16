import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT
        ei.*,
        b.name as breed_name,
        b.type as breed_type,
        i.incubator_name
      FROM egg_incubations ei
      JOIN breeds b ON ei.breed_id = b.id
      JOIN incubators i ON ei.incubator_id = i.id
      ORDER BY ei.created_at DESC
    `);

    // Calculate summary
    const summary = {
      total_batches: rows.length,
      total_eggs: rows.reduce((sum, inc) => sum + inc.number_of_eggs, 0),
      total_hatched: rows.reduce((sum, inc) => sum + inc.hatched_chicks, 0),
      avg_hatch_rate: rows.length > 0
        ? (rows.reduce((sum, inc) => sum + (inc.hatching_rate || 0), 0) / rows.length).toFixed(1)
        : 0
    };

    return NextResponse.json({
      records: rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching egg incubations:', error);
    return NextResponse.json(
      { message: 'Error fetching egg incubations' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { egg_batch_name, breed_id, incubator_id, start_date, number_of_eggs, notes } = await request.json();

    // Validate required fields
    if (!egg_batch_name || !breed_id || !incubator_id || !start_date || !number_of_eggs) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if incubator has enough capacity
    const [incubatorRows] = await pool.execute(
      'SELECT capacity, current_load FROM incubators WHERE id = ? AND is_active = TRUE',
      [incubator_id]
    );

    if (incubatorRows.length === 0) {
      return NextResponse.json(
        { message: 'Incubator not found or inactive' },
        { status: 404 }
      );
    }

    const availableCapacity = incubatorRows[0].capacity - incubatorRows[0].current_load;
    if (availableCapacity < number_of_eggs) {
      return NextResponse.json(
        { message: `Not enough capacity in incubator. Available: ${availableCapacity}, Required: ${number_of_eggs}` },
        { status: 400 }
      );
    }

    // Insert the incubation record
    const [result] = await pool.execute(
      `INSERT INTO egg_incubations
       (egg_batch_name, breed_id, incubator_id, start_date, number_of_eggs, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [egg_batch_name, breed_id, incubator_id, start_date, number_of_eggs, notes || null]
    );

    return NextResponse.json(
      { message: 'Egg incubation started successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating egg incubation:', error);
    return NextResponse.json(
      { message: 'Error starting egg incubation' },
      { status: 500 }
    );
  }
}
