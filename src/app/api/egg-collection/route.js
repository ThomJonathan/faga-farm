import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'week', 'month', 'year'
    const date = searchParams.get('date'); // specific date for filtering

    let query = `
      SELECT
        ec.id,
        ec.batch_id,
        ec.collection_date,
        ec.quantity,
        ec.egg_type,
        ec.collected_by,
        ec.notes,
        ec.created_at,
        b.batch_number,
        b.level,
        br.name as breed_name,
        br.type as breed_type,
        u.name as collected_by_name
      FROM egg_collections ec
      LEFT JOIN batches b ON ec.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN users u ON ec.collected_by = u.id
    `;

    const params = [];
    let whereClause = '';

    if (filter && date) {
      const targetDate = new Date(date);
      let startDate, endDate;

      switch (filter) {
        case 'week':
          // Get start of week (Monday)
          const dayOfWeek = targetDate.getDay();
          const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate = new Date(targetDate.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(targetDate.getFullYear(), 0, 1);
          endDate = new Date(targetDate.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
      }

      whereClause = 'WHERE ec.collection_date BETWEEN ? AND ?';
      params.push(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
    }

    query += whereClause + ' ORDER BY ec.collection_date DESC, ec.created_at DESC';

    const [rows] = await pool.execute(query, params);

    // Calculate summary statistics
    const summary = {
      total_quantity: rows.reduce((sum, record) => sum + record.quantity, 0),
      total_records: rows.length,
      by_egg_type: {},
      by_batch: {}
    };

    rows.forEach(record => {
      // Group by egg type
      if (!summary.by_egg_type[record.egg_type]) {
        summary.by_egg_type[record.egg_type] = 0;
      }
      summary.by_egg_type[record.egg_type] += record.quantity;

      // Group by batch
      if (!summary.by_batch[record.batch_id]) {
        summary.by_batch[record.batch_id] = {
          batch_number: record.batch_number,
          breed_name: record.breed_name,
          total_quantity: 0
        };
      }
      summary.by_batch[record.batch_id].total_quantity += record.quantity;
    });

    return NextResponse.json({
      records: rows,
      summary: summary
    });
  } catch (error) {
    console.error('Error fetching egg collections:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      batch_id,
      collection_date,
      quantity,
      egg_type,
      collected_by,
      notes
    } = await request.json();

    if (!batch_id || !collection_date || !quantity || !egg_type || !collected_by) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if batch exists and is active
    const [batchCheck] = await pool.execute(
      'SELECT id, status FROM batches WHERE id = ?',
      [batch_id]
    );

    if (batchCheck.length === 0) {
      return NextResponse.json(
        { message: 'Batch not found' },
        { status: 404 }
      );
    }

    if (batchCheck[0].status !== 'active') {
      return NextResponse.json(
        { message: 'Cannot collect eggs from inactive batch' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [userCheck] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [collected_by]
    );

    if (userCheck.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if collection already exists for this batch and date
    const [existingCollection] = await pool.execute(
      'SELECT id FROM egg_collections WHERE batch_id = ? AND collection_date = ?',
      [batch_id, collection_date]
    );

    if (existingCollection.length > 0) {
      return NextResponse.json(
        { message: 'Egg collection already exists for this batch and date' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO egg_collections
       (batch_id, collection_date, quantity, egg_type, collected_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [batch_id, collection_date, quantity, egg_type, collected_by, notes || null]
    );

    return NextResponse.json(
      { message: 'Egg collection recorded successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating egg collection:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
