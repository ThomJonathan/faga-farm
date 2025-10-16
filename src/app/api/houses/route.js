import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM houses ORDER BY created_at DESC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching houses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { name, capacity, type, is_active } = await request.json();

    if (!name || !capacity || !type) {
      return NextResponse.json(
        { message: 'Name, capacity, and type are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO houses (name, capacity, type, is_active) VALUES (?, ?, ?, ?)',
      [name, parseInt(capacity), type, is_active]
    );

    return NextResponse.json(
      { message: 'House created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating house:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
