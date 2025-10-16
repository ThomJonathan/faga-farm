import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, type, name, purpose, description, created_at FROM breeds ORDER BY name'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching breeds:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { type, name, purpose, description } = await request.json();

    if (!type || !name || !purpose) {
      return NextResponse.json(
        { message: 'Type, name, and purpose are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO breeds (type, name, purpose, description) VALUES (?, ?, ?, ?)',
      [type, name, purpose, description || null]
    );

    return NextResponse.json(
      { message: 'Breed created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating breed:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
