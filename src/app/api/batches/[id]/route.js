import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [rows] = await pool.execute(
      `SELECT
        b.id,
        b.batch_number,
        b.date_produced,
        b.initial_quantity,
        b.current_quantity,
        b.dead_count,
        b.level,
        b.status,
        b.created_at,
        br.name as breed_name,
        br.type as breed_type,
        h.name as house_name,
        h.type as house_type
      FROM batches b
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN houses h ON b.house_id = h.id
      WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const {
      breed_id,
      house_id,
      batch_number,
      date_produced,
      initial_quantity,
      current_quantity,
      dead_count,
      level,
      status
    } = await request.json();

    if (!breed_id || !house_id || !batch_number || !date_produced || !initial_quantity || !level) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Get current batch data for occupancy calculation
    const [currentBatch] = await pool.execute(
      'SELECT house_id, current_quantity FROM batches WHERE id = ?',
      [id]
    );

    if (currentBatch.length === 0) {
      return NextResponse.json(
        { message: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check capacity if house changed or quantity increased
    if (house_id !== currentBatch[0].house_id || current_quantity > currentBatch[0].current_quantity) {
      const [houseCheck] = await pool.execute(
        'SELECT capacity, current_occupancy FROM houses WHERE id = ?',
        [house_id]
      );

      if (houseCheck.length === 0) {
        return NextResponse.json(
          { message: 'House not found' },
          { status: 404 }
        );
      }

      let availableSpace = houseCheck[0].capacity - houseCheck[0].current_occupancy;

      // If same house, add back the current quantity
      if (house_id === currentBatch[0].house_id) {
        availableSpace += currentBatch[0].current_quantity;
      }

      if (availableSpace < current_quantity) {
        return NextResponse.json(
          { message: `Not enough space in house. Available: ${availableSpace}, Required: ${current_quantity}` },
          { status: 400 }
        );
      }
    }

    await pool.execute(
      `UPDATE batches SET
        breed_id = ?, house_id = ?, batch_number = ?, date_produced = ?,
        initial_quantity = ?, current_quantity = ?, dead_count = ?,
        level = ?, status = ?
       WHERE id = ?`,
      [breed_id, house_id, batch_number, date_produced, initial_quantity,
       current_quantity, dead_count || 0, level, status || 'active', id]
    );

    // Update house occupancy
    if (house_id !== currentBatch[0].house_id) {
      // Remove from old house
      await pool.execute(
        'UPDATE houses SET current_occupancy = current_occupancy - ? WHERE id = ?',
        [currentBatch[0].current_quantity, currentBatch[0].house_id]
      );
      // Add to new house
      await pool.execute(
        'UPDATE houses SET current_occupancy = current_occupancy + ? WHERE id = ?',
        [current_quantity, house_id]
      );
    } else if (current_quantity !== currentBatch[0].current_quantity) {
      // Same house, update difference
      const difference = current_quantity - currentBatch[0].current_quantity;
      await pool.execute(
        'UPDATE houses SET current_occupancy = current_occupancy + ? WHERE id = ?',
        [difference, house_id]
      );
    }

    return NextResponse.json({ message: 'Batch updated successfully' });
  } catch (error) {
    console.error('Error updating batch:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { message: 'Batch number already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Get batch data for occupancy update
    const [batchData] = await pool.execute(
      'SELECT house_id, current_quantity FROM batches WHERE id = ?',
      [id]
    );

    if (batchData.length === 0) {
      return NextResponse.json(
        { message: 'Batch not found' },
        { status: 404 }
      );
    }

    await pool.execute('DELETE FROM batches WHERE id = ?', [id]);

    // Update house occupancy
    await pool.execute(
      'UPDATE houses SET current_occupancy = current_occupancy - ? WHERE id = ?',
      [batchData[0].current_quantity, batchData[0].house_id]
    );

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
