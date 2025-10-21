import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = `
      SELECT v.*, b.batch_number, b.level, br.name as breed_name, u.name as administered_by_name
      FROM vaccinations v
      LEFT JOIN batches b ON v.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN users u ON v.administered_by = u.id
    `;

    const conditions = [];
    const params = [];

    if (batchId) {
      conditions.push('v.batch_id = ?');
      params.push(batchId);
    }

    if (startDate) {
      conditions.push('v.vaccination_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('v.vaccination_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY v.vaccination_date DESC, v.created_at DESC';

    const [rows] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vaccination records' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      batch_id,
      vaccine_name,
      vaccination_date,
      dosage,
      cost_per_unit,
      total_cost,
      administered_by,
      next_due_date,
      notes
    } = body;

    if (!batch_id || !vaccine_name || !vaccination_date) {
      return NextResponse.json(
        { success: false, error: 'Batch ID, vaccine name, and vaccination date are required' },
        { status: 400 }
      );
    }

    // Verify batch exists
    const [batchCheck] = await pool.execute(
      'SELECT id FROM batches WHERE id = ?',
      [batch_id]
    );

    if (batchCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid batch ID' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO vaccinations
      (batch_id, vaccine_name, vaccination_date, dosage, cost_per_unit, total_cost, administered_by, next_due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      vaccine_name,
      vaccination_date,
      dosage || null,
      cost_per_unit || null,
      total_cost || null,
      administered_by || null,
      next_due_date || null,
      notes || null
    ]);

    // Update batch vaccination tracking
    await pool.execute(`
      UPDATE batches
      SET last_vaccination_date = ?, next_vaccination_due = ?
      WHERE id = ?
    `, [vaccination_date, next_due_date, batch_id]);

    // Log expense if cost is provided
    if (total_cost && total_cost > 0) {
      await pool.execute(`
        INSERT INTO expenses
        (expense_type, description, amount, expense_date, reference_id, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'vaccination',
        `Vaccination: ${vaccine_name}`,
        total_cost,
        vaccination_date,
        result.insertId,
        administered_by || null
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Vaccination recorded successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error creating vaccination:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record vaccination' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      batch_id,
      vaccine_name,
      vaccination_date,
      dosage,
      cost_per_unit,
      total_cost,
      administered_by,
      next_due_date,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE vaccinations
      SET batch_id = ?, vaccine_name = ?, vaccination_date = ?,
          dosage = ?, cost_per_unit = ?, total_cost = ?, administered_by = ?,
          next_due_date = ?, notes = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      vaccine_name,
      vaccination_date,
      dosage || null,
      cost_per_unit || null,
      total_cost || null,
      administered_by || null,
      next_due_date || null,
      notes || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Vaccination record not found' },
        { status: 404 }
      );
    }

    // Update batch vaccination tracking
    await pool.execute(`
      UPDATE batches
      SET last_vaccination_date = ?, next_vaccination_due = ?
      WHERE id = ?
    `, [vaccination_date, next_due_date, batch_id]);

    return NextResponse.json({
      success: true,
      message: 'Vaccination updated successfully'
    });

  } catch (error) {
    console.error('Error updating vaccination:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vaccination' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM vaccinations WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Vaccination record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vaccination deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vaccination:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vaccination' },
      { status: 500 }
    );
  }
}
