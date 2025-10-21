import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Default to current month if no dates provided
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get sales summary
    const [salesData] = await pool.execute(`
      SELECT
        COUNT(*) as total_sales,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_sale_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM sales
      WHERE sale_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get orders summary
    const [ordersData] = await pool.execute(`
      SELECT
        COUNT(*) as total_orders,
        SUM(total_price) as total_order_value,
        AVG(total_price) as avg_order_value
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get top selling product
    const [topProductData] = await pool.execute(`
      SELECT
        p.name as product_name,
        SUM(si.quantity) as total_quantity
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.sale_date BETWEEN ? AND ?
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT 1
    `, [defaultStartDate, defaultEndDate]);

    // Get total customers
    const [customerData] = await pool.execute(`
      SELECT COUNT(*) as total_customers FROM customers
    `);

    const summary = {
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate
      },
      sales: {
        total_sales: salesData[0]?.total_sales || 0,
        total_revenue: salesData[0]?.total_revenue || 0,
        avg_sale_value: Math.round((salesData[0]?.avg_sale_value || 0) * 100) / 100,
        unique_customers: salesData[0]?.unique_customers || 0
      },
      orders: {
        total_orders: ordersData[0]?.total_orders || 0,
        total_order_value: ordersData[0]?.total_order_value || 0,
        avg_order_value: Math.round((ordersData[0]?.avg_order_value || 0) * 100) / 100
      },
      top_product: {
        name: topProductData[0]?.product_name || 'No sales',
        quantity: topProductData[0]?.total_quantity || 0
      },
      customers: {
        total_registered: customerData[0]?.total_customers || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales summary' },
      { status: 500 }
    );
  }
}
