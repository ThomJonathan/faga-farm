import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        si.*,
        p.product_name,
        b.batch_number
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN batches b ON si.batch_id = b.id
      ORDER BY si.id DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching sale items:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
