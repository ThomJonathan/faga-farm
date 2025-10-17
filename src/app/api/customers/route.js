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
    const { name, location, phone, email, customer_type } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const [result] = await db.query(
      'INSERT INTO customers (name, location, phone, email, customer_type) VALUES (?, ?, ?, ?, ?)',
      [name, location || null, phone || null, email || null, customer_type || 'retail']
    );

    return NextResponse.json({
      id: result.insertId,
      name,
      location,
      phone,
      email,
      customer_type
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'Customer with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
