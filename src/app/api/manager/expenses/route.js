import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const expenseType = searchParams.get('expense_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = `
      SELECT e.*, u.name as recorded_by_name
      FROM expenses e
      LEFT JOIN users u ON e.recorded_by = u.id
    `;

    const conditions = [];
    const params = [];

    if (expenseType) {
      conditions.push('e.expense_type = ?');
      params.push(expenseType);
    }

    if (startDate) {
      conditions.push('e.expense_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('e.expense_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const [rows] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expense records' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      expense_type,
      description,
      amount,
      expense_date,
      category,
      reference_id,
      recorded_by
    } = body;

    if (!expense_type || !description || !amount || !expense_date) {
      return NextResponse.json(
        { success: false, error: 'Expense type, description, amount, and expense date are required' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO expenses
      (expense_type, description, amount, expense_date, category, reference_id, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      expense_type,
      description,
      amount,
      expense_date,
      category || null,
      reference_id || null,
      recorded_by || null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Expense recorded successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record expense' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      expense_type,
      description,
      amount,
      expense_date,
      category,
      reference_id
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE expenses
      SET expense_type = ?, description = ?, amount = ?,
          expense_date = ?, category = ?, reference_id = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      expense_type,
      description,
      amount,
      expense_date,
      category || null,
      reference_id || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Expense record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully'
    });

  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update expense' },
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
      'DELETE FROM expenses WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Expense record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
