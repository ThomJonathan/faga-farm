import pool from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows] = await pool.execute('SELECT * FROM expenses ORDER BY created_at DESC');
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { expense_type, description, amount, expense_date, category, reference_id, recorded_by } = await request.json();

    // Validate required fields
    if (!expense_type || !description || !amount || !expense_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate expense_type
    const validTypes = ['vaccination', 'treatment', 'bedding', 'feed', 'equipment', 'utilities', 'labor', 'other'];
    if (!validTypes.includes(expense_type)) {
      return NextResponse.json({ error: 'Invalid expense type' }, { status: 400 });
    }

    // Insert expense
    const [result] = await pool.execute(
      'INSERT INTO expenses (expense_type, description, amount, expense_date, category, reference_id, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [expense_type, description, amount, expense_date, category || null, reference_id || null, recorded_by || null]
    );

    return NextResponse.json({ message: 'Expense recorded successfully', id: result.insertId });
  } catch (error) {
    console.error('Error recording expense:', error);
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}
