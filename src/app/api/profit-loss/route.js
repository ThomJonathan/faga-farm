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

    // Get total revenue from sales
    const [salesRevenue] = await pool.execute(`
      SELECT SUM(total_price) as total_revenue
      FROM sales
      WHERE sale_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get total revenue from orders
    const [ordersRevenue] = await pool.execute(`
      SELECT SUM(total_price) as total_revenue
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get total expenses
    const [expensesData] = await pool.execute(`
      SELECT
        SUM(amount) as total_expenses,
        SUM(CASE WHEN expense_type = 'vaccination' THEN amount ELSE 0 END) as vaccination_costs,
        SUM(CASE WHEN expense_type = 'treatment' THEN amount ELSE 0 END) as treatment_costs,
        SUM(CASE WHEN expense_type = 'feed' THEN amount ELSE 0 END) as feed_costs,
        SUM(CASE WHEN expense_type = 'equipment' THEN amount ELSE 0 END) as equipment_costs,
        SUM(CASE WHEN expense_type = 'utilities' THEN amount ELSE 0 END) as utilities_costs,
        SUM(CASE WHEN expense_type = 'labor' THEN amount ELSE 0 END) as labor_costs,
        SUM(CASE WHEN expense_type = 'other' THEN amount ELSE 0 END) as other_costs
      FROM expenses
      WHERE expense_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get processing costs from meat production
    const [processingCosts] = await pool.execute(`
      SELECT SUM(processing_cost) as total_processing_costs
      FROM meat_production
      WHERE production_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    const totalRevenue = (salesRevenue[0]?.total_revenue || 0) + (ordersRevenue[0]?.total_revenue || 0);
    const totalExpenses = (expensesData[0]?.total_expenses || 0) + (processingCosts[0]?.total_processing_costs || 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const profitLoss = {
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate
      },
      revenue: {
        sales: salesRevenue[0]?.total_revenue || 0,
        orders: ordersRevenue[0]?.total_revenue || 0,
        total: totalRevenue
      },
      expenses: {
        vaccination_costs: expensesData[0]?.vaccination_costs || 0,
        treatment_costs: expensesData[0]?.treatment_costs || 0,
        feed_costs: expensesData[0]?.feed_costs || 0,
        equipment_costs: expensesData[0]?.equipment_costs || 0,
        utilities_costs: expensesData[0]?.utilities_costs || 0,
        labor_costs: expensesData[0]?.labor_costs || 0,
        processing_costs: processingCosts[0]?.total_processing_costs || 0,
        other_costs: expensesData[0]?.other_costs || 0,
        total: totalExpenses
      },
      summary: {
        net_profit: netProfit,
        profit_margin: Math.round(profitMargin * 100) / 100,
        status: netProfit >= 0 ? 'profit' : 'loss'
      }
    };

    return NextResponse.json({
      success: true,
      data: profitLoss
    });

  } catch (error) {
    console.error('Error calculating profit/loss:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate profit/loss' },
      { status: 500 }
    );
  }
}
