import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all', 'products', 'customers', 'batches', 'sales', etc.
    const limit = parseInt(searchParams.get('limit')) || 20;

    if (!query || query.length < 2) {
      return NextResponse.json({ message: 'Search query must be at least 2 characters' }, { status: 400 });
    }

    const searchTerm = `%${query}%`;
    const results = {
      products: [],
      customers: [],
      batches: [],
      sales: [],
      orders: [],
      total: 0
    };

    // Search products
    if (!type || type === 'all' || type === 'products') {
      const [products] = await db.query(
        `SELECT id, name, type, available_quantity, unit_price,
                CONCAT('Product: ', name, ' (', type, ')') as display_text,
                'product' as result_type
         FROM products
         WHERE name LIKE ? OR type LIKE ?
         ORDER BY name LIMIT ?`,
        [searchTerm, searchTerm, limit]
      );
      results.products = products;
      results.total += products.length;
    }

    // Search customers
    if (!type || type === 'all' || type === 'customers') {
      const [customers] = await db.query(
        `SELECT id, name, email, phone,
                CONCAT('Customer: ', name, ' (', email, ')') as display_text,
                'customer' as result_type
         FROM customers
         WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
         ORDER BY name LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, limit]
      );
      results.customers = customers;
      results.total += customers.length;
    }

    // Search batches
    if (!type || type === 'all' || type === 'batches') {
      const [batches] = await db.query(
        `SELECT b.id, b.batch_number, b.current_quantity, br.name as breed_name,
                CONCAT('Batch: ', b.batch_number, ' (', br.name, ' - ', b.current_quantity, ' birds)') as display_text,
                'batch' as result_type
         FROM batches b
         LEFT JOIN breeds br ON b.breed_id = br.id
         WHERE b.batch_number LIKE ?
         ORDER BY b.batch_number LIMIT ?`,
        [searchTerm, limit]
      );
      results.batches = batches;
      results.total += batches.length;
    }

    // Search sales
    if (!type || type === 'all' || type === 'sales') {
      const [sales] = await db.query(
        `SELECT s.id, s.total_price, s.sale_date, c.name as customer_name,
                CONCAT('Sale: MWK ', FORMAT(s.total_price, 2), ' to ', c.name, ' (', DATE_FORMAT(s.sale_date, '%M %d, %Y'), ')') as display_text,
                'sale' as result_type
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE c.name LIKE ? OR s.id LIKE ?
         ORDER BY s.sale_date DESC LIMIT ?`,
        [searchTerm, searchTerm, limit]
      );
      results.sales = sales;
      results.total += sales.length;
    }

    // Search orders
    if (!type || type === 'all' || type === 'orders') {
      const [orders] = await db.query(
        `SELECT o.id, o.total_amount, o.status, c.name as customer_name,
                CONCAT('Order: MWK ', FORMAT(o.total_amount, 2), ' by ', c.name, ' (', o.status, ')') as display_text,
                'order' as result_type
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         WHERE c.name LIKE ? OR o.id LIKE ?
         ORDER BY o.created_at DESC LIMIT ?`,
        [searchTerm, searchTerm, limit]
      );
      results.orders = orders;
      results.total += orders.length;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
