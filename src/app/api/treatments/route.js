import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = `
      SELECT t.*, b.batch_name, u.name as administered_by_name
      FROM treatments t
      LEFT JOIN batches b ON t.batch_id = b.id
      LEFT JOIN users u ON t.administered_by = u.id
    `;

    const conditions = [];
    const params = [];

    if (batchId) {
      conditions.push('t.batch_id = ?');
      params.push(batchId);
    }

    if (startDate) {
      conditions.push('t.treatment_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('t.treatment_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.treatment_date DESC, t.created_at DESC';

    const [rows] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching treatments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch treatment records' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      batch_id,
      treatment_type,
      treatment_date,
      medication_name,
      dosage,
      cost_per_unit,
      total_cost,
      administered_by,
      next_due_date,
      effectiveness_rating,
      notes
    } = body;

    if (!batch_id || !treatment_type || !treatment_date) {
      return NextResponse.json(
        { success: false, error: 'Batch ID, treatment type, and treatment date are required' },
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
      INSERT INTO treatments
      (batch_id, treatment_type, treatment_date, medication_name, dosage, cost_per_unit, total_cost, administered_by, next_due_date, effectiveness_rating, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      treatment_type,
      treatment_date,
      medication_name || null,
      dosage || null,
      cost_per_unit || null,
      total_cost || null,
      administered_by || null,
      next_due_date || null,
      effectiveness_rating || 'good',
      notes || null
    ]);

    // Update batch treatment tracking
    await pool.execute(`
      UPDATE batches
      SET last_treatment_date = ?, next_treatment_due = ?
      WHERE id = ?
    `, [treatment_date, next_due_date, batch_id]);

    // Log expense if cost is provided
    if (total_cost && total_cost > 0) {
      await pool.execute(`
        INSERT INTO expenses
        (expense_type, description, amount, expense_date, reference_id, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'treatment',
        `Treatment: ${treatment_type}${medication_name ? ` - ${medication_name}` : ''}`,
        total_cost,
        treatment_date,
        result.insertId,
        administered_by
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Treatment recorded successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record treatment' },
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
      treatment_type,
      treatment_date,
      medication_name,
      dosage,
      cost_per_unit,
      total_cost,
      administered_by,
      next_due_date,
      effectiveness_rating,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE treatments
      SET batch_id = ?, treatment_type = ?, treatment_date = ?,
          medication_name = ?, dosage = ?, cost_per_unit = ?, total_cost = ?,
          administered_by = ?, next_due_date = ?, effectiveness_rating = ?, notes = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      treatment_type,
      treatment_date,
      medication_name || null,
      dosage || null,
      cost_per_unit || null,
      total_cost || null,
      administered_by || null,
      next_due_date || null,
      effectiveness_rating || 'good',
      notes || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Treatment record not found' },
        { status: 404 }
      );
    }

    // Update batch treatment tracking
    await pool.execute(`
      UPDATE batches
      SET last_treatment_date = ?, next_treatment_due = ?
      WHERE id = ?
    `, [treatment_date, next_due_date, batch_id]);

    return NextResponse.json({
      success: true,
      message: 'Treatment updated successfully'
    });

  } catch (error) {
    console.error('Error updating treatment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update treatment' },
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
      'DELETE FROM treatments WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Treatment record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Treatment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting treatment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete treatment' },
      { status: 500 }
    );
  }
}
