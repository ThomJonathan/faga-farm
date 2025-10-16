import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, email, phone, address, city, state, zip_code } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
    }

    const [result] = await db.query(
      'INSERT INTO customers (name, email, phone, address, city, state, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, address || null, city || null, state || null, zip_code || null]
    );

    return NextResponse.json({
      id: result.insertId,
      name,
      email,
      phone,
      address,
      city,
      state,
      zip_code
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'Customer with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
