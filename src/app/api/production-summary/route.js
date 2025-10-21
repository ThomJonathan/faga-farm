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

    // Get egg collection summary
    const [eggData] = await pool.execute(`
      SELECT
        COUNT(*) as total_collections,
        SUM(quantity) as total_eggs,
        AVG(quantity) as avg_daily_eggs
      FROM egg_collection
      WHERE collection_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get manure production summary
    const [manureData] = await pool.execute(`
      SELECT
        COUNT(*) as total_records,
        SUM(quantity_kg) as total_quantity_kg,
        AVG(quantity_kg) as avg_daily_manure
      FROM manure_production
      WHERE production_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get meat production summary
    const [meatData] = await pool.execute(`
      SELECT
        COUNT(*) as total_records,
        SUM(quantity_kg) as total_quantity_kg,
        SUM(processing_cost) as total_processing_cost,
        AVG(average_weight_kg) as avg_bird_weight
      FROM meat_production
      WHERE production_date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate]);

    // Get active batches count
    const [batchData] = await pool.execute(`
      SELECT COUNT(*) as active_batches
      FROM batches
      WHERE status = 'active'
    `);

    // Get active incubations count
    const [incubationData] = await pool.execute(`
      SELECT COUNT(*) as active_incubations
      FROM egg_incubation
      WHERE status = 'active'
    `);

    const summary = {
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate
      },
      egg_production: {
        total_collections: eggData[0]?.total_collections || 0,
        total_eggs: eggData[0]?.total_eggs || 0,
        avg_daily_eggs: Math.round((eggData[0]?.avg_daily_eggs || 0) * 100) / 100
      },
      manure_production: {
        total_records: manureData[0]?.total_records || 0,
        total_quantity_kg: manureData[0]?.total_quantity_kg || 0,
        avg_daily_manure: Math.round((manureData[0]?.avg_daily_manure || 0) * 100) / 100
      },
      meat_production: {
        total_records: meatData[0]?.total_records || 0,
        total_quantity_kg: meatData[0]?.total_quantity_kg || 0,
        total_processing_cost: meatData[0]?.total_processing_cost || 0,
        avg_bird_weight: Math.round((meatData[0]?.avg_bird_weight || 0) * 100) / 100
      },
      operations: {
        active_batches: batchData[0]?.active_batches || 0,
        active_incubations: incubationData[0]?.active_incubations || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching production summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch production summary' },
      { status: 500 }
    );
  }
}
