import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [rows] = await pool.execute(
      'SELECT * FROM houses WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'House not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching house:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, capacity, type, is_active } = await request.json();

    if (!name || !capacity || !type) {
      return NextResponse.json(
        { message: 'Name, capacity, and type are required' },
        { status: 400 }
      );
    }

    await pool.execute(
      'UPDATE houses SET name = ?, capacity = ?, type = ?, is_active = ? WHERE id = ?',
      [name, parseInt(capacity), type, is_active, id]
    );

    return NextResponse.json({ message: 'House updated successfully' });
  } catch (error) {
    console.error('Error updating house:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if house is being used in any batches
    const [batchCheck] = await pool.execute(
      'SELECT COUNT(*) as count FROM batches WHERE house_id = ?',
      [id]
    );

    if (batchCheck[0].count > 0) {
      return NextResponse.json(
        { message: 'Cannot delete house that is assigned to batches' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM houses WHERE id = ?', [id]);

    return NextResponse.json({ message: 'House deleted successfully' });
  } catch (error) {
    console.error('Error deleting house:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
