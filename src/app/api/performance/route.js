import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get revenue data
    const [revenueData] = await pool.execute(`
      SELECT
        SUM(total_price) as total_revenue,
        COUNT(*) as total_sales,
        AVG(total_price) as avg_sale_value
      FROM sales
      WHERE sale_date BETWEEN ? AND ?
    `, [startDateStr, endDateStr]);

    // Get previous period revenue for comparison
    const prevPeriodDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const prevStartDate = new Date(startDate.getTime() - prevPeriodDays * 24 * 60 * 60 * 1000);
    const prevEndDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);

    const [prevRevenueData] = await pool.execute(`
      SELECT SUM(total_price) as prev_revenue
      FROM sales
      WHERE sale_date BETWEEN ? AND ?
    `, [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]);

    const currentRevenue = revenueData[0]?.total_revenue || 0;
    const prevRevenue = prevRevenueData[0]?.prev_revenue || 0;
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Get production data
    const [eggData] = await pool.execute(`
      SELECT SUM(quantity) as total_eggs
      FROM egg_collection ec
      JOIN batches b ON ec.batch_number = b.batch_number
      WHERE ec.collection_date BETWEEN ? AND ?
    `, [startDateStr, endDateStr]);

    const [meatData] = await pool.execute(`
      SELECT SUM(quantity_kg) as total_meat_kg, SUM(number_of_birds) as total_birds
      FROM meat_production
      WHERE production_date BETWEEN ? AND ?
    `, [startDateStr, endDateStr]);

    // Get previous period production for comparison
    const [prevEggData] = await pool.execute(`
      SELECT SUM(quantity) as prev_eggs
      FROM egg_collection ec
      JOIN batches b ON ec.batch_number = b.batch_number
      WHERE ec.collection_date BETWEEN ? AND ?
    `, [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]);

    const [prevMeatData] = await pool.execute(`
      SELECT SUM(quantity_kg) as prev_meat_kg
      FROM meat_production
      WHERE production_date BETWEEN ? AND ?
    `, [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]);

    const currentEggs = eggData[0]?.total_eggs || 0;
    const prevEggs = prevEggData[0]?.prev_eggs || 0;
    const eggChange = prevEggs > 0 ? ((currentEggs - prevEggs) / prevEggs) * 100 : 0;

    const currentMeat = meatData[0]?.total_meat_kg || 0;
    const prevMeat = prevMeatData[0]?.prev_meat_kg || 0;
    const meatChange = prevMeat > 0 ? ((currentMeat - prevMeat) / prevMeat) * 100 : 0;

    // Get profitability data
    const [expenseData] = await pool.execute(`
      SELECT SUM(amount) as total_expenses
      FROM expenses
      WHERE date_incurred BETWEEN ? AND ?
    `, [startDateStr, endDateStr]);

    const totalExpenses = expenseData[0]?.total_expenses || 0;
    const netProfit = currentRevenue - totalExpenses;
    const profitMargin = currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0;

    // Get production breakdown by type
    const [productionBreakdown] = await pool.execute(`
      SELECT
        'eggs' as type,
        SUM(ec.quantity) as quantity,
        SUM(ec.quantity * COALESCE(p.unit_price, 0)) as revenue
      FROM egg_collection ec
      LEFT JOIN products p ON p.product_type = 'eggs'
      WHERE ec.collection_date BETWEEN ? AND ?
      UNION ALL
      SELECT
        'meat' as type,
        SUM(mp.quantity_kg) as quantity,
        SUM(mp.quantity_kg * COALESCE(p.unit_price, 0)) as revenue
      FROM meat_production mp
      LEFT JOIN products p ON p.product_type = 'meat'
      WHERE mp.production_date BETWEEN ? AND ?
      UNION ALL
      SELECT
        'manure' as type,
        SUM(mp2.quantity_kg) as quantity,
        SUM(mp2.quantity_kg * COALESCE(p.unit_price, 0)) as revenue
      FROM manure_production mp2
      LEFT JOIN products p ON p.product_type = 'manure'
      WHERE mp2.production_date BETWEEN ? AND ?
    `, [startDateStr, endDateStr, startDateStr, endDateStr, startDateStr, endDateStr]);

    // Get breed performance
    const [breedData] = await pool.execute(`
      SELECT
        br.name,
        br.type,
        COUNT(DISTINCT b.id) as batch_count,
        COALESCE(SUM(ec.quantity), 0) as total_production,
        ROUND(
          CASE
            WHEN COUNT(DISTINCT b.id) > 0 THEN (COALESCE(SUM(ec.quantity), 0) / COUNT(DISTINCT b.id))
            ELSE 0
          END, 2
        ) as efficiency
      FROM breeds br
      LEFT JOIN batches b ON br.id = b.breed_id AND b.created_at BETWEEN ? AND ?
      LEFT JOIN egg_collection ec ON b.batch_number = ec.batch_number AND ec.collection_date BETWEEN ? AND ?
      GROUP BY br.id, br.name, br.type
      ORDER BY efficiency DESC
    `, [startDateStr, endDateStr, startDateStr, endDateStr]);

    // Get cost analysis
    const [costData] = await pool.execute(`
      SELECT
        category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM expenses
      WHERE date_incurred BETWEEN ? AND ?
      GROUP BY category
      ORDER BY total_amount DESC
    `, [startDateStr, endDateStr]);

    // Get top performing products
    const [topProducts] = await pool.execute(`
      SELECT
        p.product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.quantity * si.unit_price) as total_revenue,
        ROUND((SUM(si.quantity * si.unit_price) / SUM(si.quantity)), 2) as avg_price,
        ROUND(
          CASE
            WHEN SUM(si.quantity * si.unit_price) > 0 THEN
              ((SUM(si.quantity * si.unit_price) - SUM(si.quantity * p.unit_price)) / SUM(si.quantity * si.unit_price)) * 100
            ELSE 0
          END, 2
        ) as margin
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.sale_date BETWEEN ? AND ?
      GROUP BY p.id, p.product_name
      ORDER BY total_revenue DESC
      LIMIT 5
    `, [startDateStr, endDateStr]);

    const performanceData = {
      period: {
        start: startDateStr,
        end: endDateStr,
        type: period
      },
      revenue: {
        total: currentRevenue,
        change: Math.round(revenueChange * 100) / 100
      },
      production: {
        eggs: {
          total: currentEggs,
          change: Math.round(eggChange * 100) / 100
        },
        meat: {
          total_kg: currentMeat,
          birds: meatData[0]?.total_birds || 0,
          change: Math.round(meatChange * 100) / 100
        }
      },
      profitability: {
        net_profit: netProfit,
        margin: Math.round(profitMargin * 100) / 100
      },
      production_breakdown: productionBreakdown.map(item => ({
        type: item.type,
        quantity: parseFloat(item.quantity) || 0,
        revenue: parseFloat(item.revenue) || 0
      })),
      breeds: breedData.map(breed => ({
        name: breed.name,
        type: breed.type,
        efficiency: parseFloat(breed.efficiency),
        production_count: parseInt(breed.total_production)
      })),
      costs: {
        total: totalExpenses,
        per_unit: currentRevenue > 0 ? Math.round((totalExpenses / currentRevenue) * 100) / 100 : 0,
        breakdown: costData.map(cost => ({
          category: cost.category,
          amount: parseFloat(cost.total_amount),
          count: parseInt(cost.transaction_count)
        }))
      },
      insights: {
        top_products: topProducts.map(product => ({
          name: product.product_name,
          revenue: parseFloat(product.total_revenue),
          margin: parseFloat(product.margin)
        })),
        improvements: [
          netProfit < 0 ? "Consider reducing operational costs to improve profitability" : "Profitability is positive - consider scaling operations",
          currentEggs < 1000 ? "Egg production is below target - review feed and health management" : "Egg production is meeting targets",
          totalExpenses > currentRevenue * 0.7 ? "Expense ratio is high - review cost management strategies" : "Expense management is efficient"
        ].filter(Boolean)
      }
    };

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
