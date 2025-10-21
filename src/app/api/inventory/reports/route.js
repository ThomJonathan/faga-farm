import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';

    let query = '';
    let params = [];

    switch (reportType) {
      case 'low_stock':
        query = `
          SELECT
            p.id,
            p.product_name as name,
            p.product_type as type,
            p.available_quantity,
            p.stock_threshold,
            p.alert_enabled,
            br.name as breed_name,
            b.batch_number,
            b.current_quantity as batch_quantity
          FROM products p
          LEFT JOIN breeds br ON p.breed_id = br.id
          LEFT JOIN batches b ON p.batch_id = b.id
          WHERE p.alert_enabled = TRUE AND p.available_quantity <= p.stock_threshold
          ORDER BY p.available_quantity ASC
        `;
        break;

      case 'out_of_stock':
        query = `
          SELECT
            p.id,
            p.product_name as name,
            p.product_type as type,
            p.available_quantity,
            p.stock_threshold,
            br.name as breed_name,
            b.batch_number
          FROM products p
          LEFT JOIN breeds br ON p.breed_id = br.id
          LEFT JOIN batches b ON p.batch_id = b.id
          WHERE p.available_quantity <= 0
          ORDER BY p.product_name ASC
        `;
        break;

      case 'transactions':
        const days = parseInt(searchParams.get('days')) || 30;
        query = `
          SELECT
            it.*,
            p.product_name as product_name,
            b.batch_number,
            u.name as user_name
          FROM inventory_transactions it
          LEFT JOIN products p ON it.product_id = p.id
          LEFT JOIN batches b ON it.batch_id = b.id
          LEFT JOIN users u ON it.created_by = u.id
          WHERE it.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          ORDER BY it.created_at DESC
        `;
        params = [days];
        break;

      case 'summary':
      default:
        query = `
          SELECT
            COUNT(CASE WHEN b.current_quantity <= 0 THEN 1 END) as out_of_stock_count,
            COUNT(CASE WHEN p.alert_enabled = TRUE AND b.current_quantity <= p.stock_threshold THEN 1 END) as low_stock_count,
            COUNT(*) as total_products,
            SUM(b.current_quantity) as total_quantity,
            AVG(b.current_quantity) as avg_quantity
          FROM products p
          LEFT JOIN batches b ON p.breed_id = b.breed_id
        `;
        break;
    }

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching inventory reports:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
