import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'production';
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    let reportData = {};

    switch (reportType) {
      case 'production':
        reportData = await generateProductionReport(startDate, endDate);
        break;
      case 'financial':
        reportData = await generateFinancialReport(startDate, endDate);
        break;
      case 'inventory':
        reportData = await generateInventoryReport(startDate, endDate);
        break;
      case 'sales':
        reportData = await generateSalesReport(startDate, endDate);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(startDate, endDate);
        break;
      default:
        return NextResponse.json(
          { message: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateProductionReport(startDate, endDate) {
  // Get egg production data
  const [eggData] = await pool.execute(`
    SELECT
      SUM(ec.quantity) as total_eggs,
      b.breed_name,
      COUNT(DISTINCT ec.batch_number) as batches_count
    FROM egg_collection ec
    JOIN batches b ON ec.batch_number = b.batch_number
    WHERE ec.collection_date BETWEEN ? AND ?
    GROUP BY b.breed_name
  `, [startDate, endDate]);

  // Get meat production data
  const [meatData] = await pool.execute(`
    SELECT
      SUM(mp.quantity_kg) as total_meat_kg,
      SUM(mp.number_of_birds) as total_birds,
      b.breed_name
    FROM meat_production mp
    LEFT JOIN batches b ON mp.batch_id = b.id
    WHERE mp.production_date BETWEEN ? AND ?
    GROUP BY b.breed_name
  `, [startDate, endDate]);

  // Get manure production data
  const [manureData] = await pool.execute(`
    SELECT
      SUM(mp.quantity_kg) as total_manure_kg,
      b.breed_name
    FROM manure_production mp
    LEFT JOIN batches b ON mp.batch_id = b.id
    WHERE mp.production_date BETWEEN ? AND ?
    GROUP BY b.breed_name
  `, [startDate, endDate]);

  // Combine breed breakdown
  const breedBreakdown = {};
  eggData.forEach(item => {
    const breed = item.breed_name || 'Unknown';
    if (!breedBreakdown[breed]) breedBreakdown[breed] = {};
    breedBreakdown[breed].eggs = parseInt(item.total_eggs) || 0;
  });

  meatData.forEach(item => {
    const breed = item.breed_name || 'Unknown';
    if (!breedBreakdown[breed]) breedBreakdown[breed] = {};
    breedBreakdown[breed].meat_kg = parseFloat(item.total_meat_kg) || 0;
  });

  manureData.forEach(item => {
    const breed = item.breed_name || 'Unknown';
    if (!breedBreakdown[breed]) breedBreakdown[breed] = {};
    breedBreakdown[breed].manure_kg = parseFloat(item.total_manure_kg) || 0;
  });

  const totalEggs = eggData.reduce((sum, item) => sum + parseInt(item.total_eggs || 0), 0);
  const totalMeatKg = meatData.reduce((sum, item) => sum + parseFloat(item.total_meat_kg || 0), 0);
  const totalManureKg = manureData.reduce((sum, item) => sum + parseFloat(item.total_manure_kg || 0), 0);

  return {
    summary: {
      total_eggs: totalEggs,
      total_meat_kg: Math.round(totalMeatKg * 100) / 100,
      total_manure_kg: Math.round(totalManureKg * 100) / 100,
      period: { start: startDate, end: endDate }
    },
    breed_breakdown: Object.entries(breedBreakdown).map(([name, data]) => ({
      name,
      eggs: data.eggs || 0,
      meat_kg: data.meat_kg || 0,
      manure_kg: data.manure_kg || 0
    }))
  };
}

async function generateFinancialReport(startDate, endDate) {
  // Get revenue data
  const [revenueData] = await pool.execute(`
    SELECT
      SUM(s.total_price) as total_revenue,
      p.product_type,
      SUM(si.quantity) as total_quantity
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN products p ON si.product_id = p.id
    WHERE s.sale_date BETWEEN ? AND ?
    GROUP BY p.product_type
  `, [startDate, endDate]);

  // Get expense data
  const [expenseData] = await pool.execute(`
    SELECT
      category,
      SUM(amount) as total_amount
    FROM expenses
    WHERE date_incurred BETWEEN ? AND ?
    GROUP BY category
  `, [startDate, endDate]);

  const totalRevenue = revenueData.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    summary: {
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100,
      profit_margin: Math.round(profitMargin * 100) / 100,
      period: { start: startDate, end: endDate }
    },
    revenue_breakdown: revenueData.map(item => ({
      product: item.product_type,
      amount: Math.round(parseFloat(item.total_revenue) * 100) / 100,
      quantity: parseInt(item.total_quantity) || 0
    })),
    expense_breakdown: expenseData.map(item => ({
      category: item.category,
      amount: Math.round(parseFloat(item.total_amount) * 100) / 100
    }))
  };
}

async function generateInventoryReport(startDate, endDate) {
  // Get current inventory status
  const [inventoryData] = await pool.execute(`
    SELECT
      p.product_name,
      p.available_quantity,
      p.unit_price,
      p.stock_threshold,
      p.unit,
      CASE
        WHEN p.available_quantity <= 0 THEN 'out_of_stock'
        WHEN p.available_quantity <= p.stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
      END as status
    FROM products p
    WHERE p.is_active = true
    ORDER BY p.product_name
  `);

  const totalItems = inventoryData.length;
  const lowStockCount = inventoryData.filter(item => item.status === 'low_stock').length;
  const outOfStockCount = inventoryData.filter(item => item.status === 'out_of_stock').length;
  const stockValue = inventoryData.reduce((sum, item) => sum + (parseFloat(item.available_quantity) * parseFloat(item.unit_price)), 0);

  return {
    summary: {
      total_items: totalItems,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      stock_value: Math.round(stockValue * 100) / 100,
      period: { start: startDate, end: endDate }
    },
    inventory_details: inventoryData.map(item => ({
      name: item.product_name,
      current_stock: parseFloat(item.available_quantity),
      unit: item.unit || 'units',
      unit_cost: parseFloat(item.unit_price),
      total_value: Math.round((parseFloat(item.available_quantity) * parseFloat(item.unit_price)) * 100) / 100,
      status: item.status
    }))
  };
}

async function generateSalesReport(startDate, endDate) {
  // Get sales data
  const [salesData] = await pool.execute(`
    SELECT
      s.sale_date,
      s.total_price,
      c.name as customer_name,
      COUNT(si.id) as items_count
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE s.sale_date BETWEEN ? AND ?
    GROUP BY s.id, s.sale_date, s.total_price, c.name
    ORDER BY s.sale_date DESC
  `, [startDate, endDate]);

  // Get top products
  const [topProducts] = await pool.execute(`
    SELECT
      p.product_name,
      SUM(si.quantity) as total_quantity,
      SUM(si.quantity * si.unit_price) as total_revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.sale_date BETWEEN ? AND ?
    GROUP BY p.id, p.product_name
    ORDER BY total_revenue DESC
    LIMIT 10
  `, [startDate, endDate]);

  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0);
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return {
    summary: {
      total_sales: totalSales,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      avg_sale_value: Math.round(avgSaleValue * 100) / 100,
      period: { start: startDate, end: endDate }
    },
    sales_details: salesData.map(sale => ({
      date: sale.sale_date,
      customer: sale.customer_name || 'Walk-in',
      amount: Math.round(parseFloat(sale.total_price) * 100) / 100,
      items_count: parseInt(sale.items_count)
    })),
    top_products: topProducts.map(product => ({
      name: product.product_name,
      quantity: parseInt(product.total_quantity),
      revenue: Math.round(parseFloat(product.total_revenue) * 100) / 100
    }))
  };
}

async function generatePerformanceReport(startDate, endDate) {
  // This can reuse logic from the performance API
  const [performanceData] = await pool.execute(`
    SELECT
      'revenue' as metric,
      SUM(total_price) as value
    FROM sales
    WHERE sale_date BETWEEN ? AND ?
    UNION ALL
    SELECT
      'expenses' as metric,
      SUM(amount) as value
    FROM expenses
    WHERE date_incurred BETWEEN ? AND ?
    UNION ALL
    SELECT
      'production_efficiency' as metric,
      ROUND(AVG(CASE WHEN b.initial_quantity > 0 THEN (b.current_quantity / b.initial_quantity) * 100 ELSE 0 END), 2) as value
    FROM batches b
    WHERE b.created_at BETWEEN ? AND ?
  `, [startDate, endDate, startDate, endDate, startDate, endDate]);

  const metrics = {};
  performanceData.forEach(item => {
    metrics[item.metric] = parseFloat(item.value) || 0;
  });

  return {
    summary: {
      revenue: metrics.revenue || 0,
      expenses: metrics.expenses || 0,
      net_profit: (metrics.revenue || 0) - (metrics.expenses || 0),
      production_efficiency: metrics.production_efficiency || 0,
      period: { start: startDate, end: endDate }
    },
    metrics: performanceData
  };
}
