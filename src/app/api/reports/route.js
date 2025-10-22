import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'production';
    const startDate = searchParams.get('start') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('end') || new Date().toISOString().split('T')[0];

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
  try {
    // Get egg production data
    const [eggData] = await db.query(`
      SELECT SUM(ec.quantity) as total_eggs
      FROM egg_collections ec
      WHERE DATE(ec.collection_date) BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get meat production data
    const [meatData] = await db.query(`
      SELECT SUM(mp.quantity_kg) as total_meat_kg
      FROM meat_production mp
      WHERE DATE(mp.production_date) BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get manure production data
    const [manureData] = await db.query(`
      SELECT SUM(mp.quantity_kg) as total_manure_kg
      FROM manure_production mp
      WHERE DATE(mp.production_date) BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get breed breakdown
    const [breedData] = await db.query(`
      SELECT
        br.name,
        br.type,
        COALESCE(SUM(ec.quantity), 0) as eggs,
        COALESCE(SUM(mp_meat.quantity_kg), 0) as meat_kg,
        COALESCE(SUM(mp_manure.quantity_kg), 0) as manure_kg
      FROM breeds br
      LEFT JOIN batches b ON br.id = b.breed_id
      LEFT JOIN egg_collections ec ON b.id = ec.batch_id AND DATE(ec.collection_date) BETWEEN ? AND ?
      LEFT JOIN meat_production mp_meat ON b.id = mp_meat.batch_id AND DATE(mp_meat.production_date) BETWEEN ? AND ?
      LEFT JOIN manure_production mp_manure ON b.id = mp_manure.batch_id AND DATE(mp_manure.production_date) BETWEEN ? AND ?
      GROUP BY br.id, br.name, br.type
      HAVING eggs > 0 OR meat_kg > 0 OR manure_kg > 0
      ORDER BY (eggs + meat_kg + manure_kg) DESC
    `, [startDate, endDate, startDate, endDate, startDate, endDate]);

    return {
      summary: {
        total_eggs: parseInt(eggData[0]?.total_eggs || 0),
        total_meat_kg: parseFloat(meatData[0]?.total_meat_kg || 0),
        total_manure_kg: parseFloat(manureData[0]?.total_manure_kg || 0),
        period: { start: startDate, end: endDate }
      },
      breed_breakdown: breedData.map(breed => ({
        name: breed.name,
        eggs: parseInt(breed.eggs),
        meat_kg: parseFloat(breed.meat_kg),
        manure_kg: parseFloat(breed.manure_kg)
      }))
    };
  } catch (error) {
    console.error('Error generating production report:', error);
    return {
      summary: {
        total_eggs: 0,
        total_meat_kg: 0,
        total_manure_kg: 0,
        period: { start: startDate, end: endDate }
      },
      breed_breakdown: []
    };
  }
}

async function generateFinancialReport(startDate, endDate) {
  try {
    // Get total revenue from sales
    const [revenueData] = await db.query(`
      SELECT SUM(s.total_price) as total_revenue
      FROM sales s
      WHERE s.sale_date BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get total expenses
    const [expensesData] = await db.query(`
      SELECT SUM(e.amount) as total_expenses
      FROM expenses e
      WHERE e.expense_date BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get revenue breakdown by product type
    const [revenueBreakdown] = await db.query(`
      SELECT
        p.product_name as product,
        SUM(si.total_price) as amount,
        SUM(si.quantity) as quantity
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.sale_date BETWEEN ? AND ?
      GROUP BY p.id, p.product_name
      ORDER BY amount DESC
    `, [startDate, endDate]);

    // Get expense breakdown by category
    const [expenseBreakdown] = await db.query(`
      SELECT
        e.category,
        SUM(e.amount) as amount
      FROM expenses e
      WHERE e.expense_date BETWEEN ? AND ?
      GROUP BY e.category
      ORDER BY amount DESC
    `, [startDate, endDate]);

    const totalRevenue = parseFloat(revenueData[0]?.total_revenue || 0);
    const totalExpenses = parseFloat(expensesData[0]?.total_expenses || 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      summary: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        profit_margin: profitMargin,
        period: { start: startDate, end: endDate }
      },
      revenue_breakdown: revenueBreakdown.map(item => ({
        product: item.product,
        amount: parseFloat(item.amount),
        quantity: parseInt(item.quantity)
      })),
      expense_breakdown: expenseBreakdown.map(item => ({
        category: item.category,
        amount: parseFloat(item.amount)
      }))
    };
  } catch (error) {
    console.error('Error generating financial report:', error);
    return {
      summary: {
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        profit_margin: 0,
        period: { start: startDate, end: endDate }
      },
      revenue_breakdown: [],
      expense_breakdown: []
    };
  }
}

function generateInventoryReport(startDate, endDate) {
  // Return dummy data for demonstration
  return {
    summary: {
      total_items: 15,
      low_stock_count: 3,
      out_of_stock_count: 1,
      stock_value: 25000.50,
      period: { start: startDate, end: endDate }
    },
    inventory_details: [
      {
        name: 'Fresh Eggs (Grade A)',
        current_stock: 500,
        unit: 'dozen',
        unit_cost: 3.50,
        total_value: 1750.00,
        status: 'in_stock'
      },
      {
        name: 'Whole Chicken',
        current_stock: 25,
        unit: 'kg',
        unit_cost: 8.50,
        total_value: 212.50,
        status: 'low_stock'
      },
      {
        name: 'Chicken Manure',
        current_stock: 0,
        unit: 'kg',
        unit_cost: 0.50,
        total_value: 0.00,
        status: 'out_of_stock'
      },
      {
        name: 'Chicken Feed',
        current_stock: 150,
        unit: 'kg',
        unit_cost: 1.20,
        total_value: 180.00,
        status: 'in_stock'
      }
    ]
  };
}

async function generateSalesReport(startDate, endDate) {
  try {
    // Get sales summary
    const [salesSummary] = await db.query(`
      SELECT
        COUNT(s.id) as total_sales,
        SUM(s.total_price) as total_revenue,
        AVG(s.total_price) as avg_sale_value
      FROM sales s
      WHERE s.sale_date BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get sales details
    const [salesDetails] = await db.query(`
      SELECT
        s.sale_date as date,
        c.name as customer,
        s.total_price as amount,
        COUNT(si.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.sale_date BETWEEN ? AND ?
      GROUP BY s.id, s.sale_date, c.name, s.total_price
      ORDER BY s.sale_date DESC
      LIMIT 20
    `, [startDate, endDate]);

    // Get top products
    const [topProducts] = await db.query(`
      SELECT
        p.product_name as name,
        SUM(si.quantity) as quantity,
        SUM(si.total_price) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.sale_date BETWEEN ? AND ?
      GROUP BY p.id, p.product_name
      ORDER BY revenue DESC
      LIMIT 10
    `, [startDate, endDate]);

    return {
      summary: {
        total_sales: parseInt(salesSummary[0]?.total_sales || 0),
        total_revenue: parseFloat(salesSummary[0]?.total_revenue || 0),
        avg_sale_value: parseFloat(salesSummary[0]?.avg_sale_value || 0),
        period: { start: startDate, end: endDate }
      },
      sales_details: salesDetails.map(sale => ({
        date: sale.date,
        customer: sale.customer || 'Walk-in',
        amount: parseFloat(sale.amount),
        items_count: parseInt(sale.items_count)
      })),
      top_products: topProducts.map(product => ({
        name: product.name,
        quantity: parseInt(product.quantity),
        revenue: parseFloat(product.revenue)
      }))
    };
  } catch (error) {
    console.error('Error generating sales report:', error);
    return {
      summary: {
        total_sales: 0,
        total_revenue: 0,
        avg_sale_value: 0,
        period: { start: startDate, end: endDate }
      },
      sales_details: [],
      top_products: []
    };
  }
}

async function generatePerformanceReport(startDate, endDate) {
  try {
    // Get revenue and expenses
    const [revenueData] = await db.query(`
      SELECT SUM(s.total_price) as revenue
      FROM sales s
      WHERE s.sale_date BETWEEN ? AND ?
    `, [startDate, endDate]);

    const [expensesData] = await db.query(`
      SELECT SUM(e.amount) as expenses
      FROM expenses e
      WHERE e.expense_date BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get production efficiency (eggs per bird per day average)
    const [efficiencyData] = await db.query(`
      SELECT
        AVG(ec.quantity / b.initial_quantity) as avg_efficiency,
        COUNT(DISTINCT b.id) as total_batches
      FROM egg_collections ec
      JOIN batches b ON ec.batch_id = b.id
      WHERE DATE(ec.collection_date) BETWEEN ? AND ?
        AND b.initial_quantity > 0
    `, [startDate, endDate]);

    const revenue = parseFloat(revenueData[0]?.revenue || 0);
    const expenses = parseFloat(expensesData[0]?.expenses || 0);
    const netProfit = revenue - expenses;
    const productionEfficiency = parseFloat(efficiencyData[0]?.avg_efficiency || 0) * 100;

    return {
      summary: {
        revenue: revenue,
        expenses: expenses,
        net_profit: netProfit,
        production_efficiency: productionEfficiency,
        period: { start: startDate, end: endDate }
      },
      metrics: [
        {
          metric: 'revenue',
          value: revenue
        },
        {
          metric: 'expenses',
          value: expenses
        },
        {
          metric: 'production_efficiency',
          value: productionEfficiency
        }
      ]
    };
  } catch (error) {
    console.error('Error generating performance report:', error);
    return {
      summary: {
        revenue: 0,
        expenses: 0,
        net_profit: 0,
        production_efficiency: 0,
        period: { start: startDate, end: endDate }
      },
      metrics: []
    };
  }
}
