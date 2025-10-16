import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, incubator_name, capacity, current_load, is_active, created_at FROM incubators ORDER BY incubator_name'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching incubators:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { incubator_name, capacity, is_active } = await request.json();

    if (!incubator_name || !capacity) {
      return NextResponse.json(
        { message: 'Incubator name and capacity are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO incubators (incubator_name, capacity, current_load, is_active) VALUES (?, ?, 0, ?)',
      [incubator_name, capacity, is_active !== undefined ? is_active : true]
    );

    return NextResponse.json(
      { message: 'Incubator created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating incubator:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
