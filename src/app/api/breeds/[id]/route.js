import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [rows] = await pool.execute(
      'SELECT id, type, name, purpose, description, created_at FROM breeds WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Breed not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching breed:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { type, name, purpose, description } = await request.json();

    if (!type || !name || !purpose) {
      return NextResponse.json(
        { message: 'Type, name, and purpose are required' },
        { status: 400 }
      );
    }

    await pool.execute(
      'UPDATE breeds SET type = ?, name = ?, purpose = ?, description = ? WHERE id = ?',
      [type, name, purpose, description || null, id]
    );

    return NextResponse.json({ message: 'Breed updated successfully' });
  } catch (error) {
    console.error('Error updating breed:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if breed is being used in any batches
    const [batchCheck] = await pool.execute(
      'SELECT COUNT(*) as count FROM batches WHERE breed_id = ?',
      [id]
    );

    if (batchCheck[0].count > 0) {
      return NextResponse.json(
        { message: 'Cannot delete breed that is being used in batches' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM breeds WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Breed deleted successfully' });
  } catch (error) {
    console.error('Error deleting breed:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
