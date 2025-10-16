import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [rows] = await pool.execute(
      'SELECT id, incubator_name, capacity, current_load, is_active, created_at FROM incubators WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Incubator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching incubator:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { incubator_name, capacity, is_active } = await request.json();

    if (!incubator_name || !capacity) {
      return NextResponse.json(
        { message: 'Incubator name and capacity are required' },
        { status: 400 }
      );
    }

    await pool.execute(
      'UPDATE incubators SET incubator_name = ?, capacity = ?, is_active = ? WHERE id = ?',
      [incubator_name, capacity, is_active !== undefined ? is_active : true, id]
    );

    return NextResponse.json({ message: 'Incubator updated successfully' });
  } catch (error) {
    console.error('Error updating incubator:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if incubator is being used in any egg incubations
    const [incubationCheck] = await pool.execute(
      'SELECT COUNT(*) as count FROM egg_incubations WHERE incubator_id = ?',
      [id]
    );

    if (incubationCheck[0].count > 0) {
      return NextResponse.json(
        { message: 'Cannot delete incubator that is being used in egg incubations' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM incubators WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Incubator deleted successfully' });
  } catch (error) {
    console.error('Error deleting incubator:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
