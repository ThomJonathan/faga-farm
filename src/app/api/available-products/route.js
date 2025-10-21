import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    // Eggs for sale: from egg_collections where egg_type = 'sales', grouped by breed
    const [eggsData] = await pool.execute(`
      SELECT
        br.name as breed_name,
        br.type as breed_type,
        SUM(ec.quantity) as total_quantity
      FROM egg_collections ec
      JOIN batches b ON ec.batch_id = b.id
      JOIN breeds br ON b.breed_id = br.id
      WHERE ec.egg_type = 'sales'
      GROUP BY br.id, br.name, br.type
      ORDER BY br.name
    `);

    // Live chicks: from batches where level = 'chick' and status = 'active', grouped by breed and age
    const [chicksData] = await pool.execute(`
      SELECT
        br.name as breed_name,
        br.type as breed_type,
        b.level,
        TIMESTAMPDIFF(WEEK, b.date_produced, CURDATE()) as age_weeks,
        TIMESTAMPDIFF(DAY, b.date_produced, CURDATE()) as age_days,
        SUM(b.current_quantity) as total_quantity
      FROM batches b
      JOIN breeds br ON b.breed_id = br.id
      WHERE b.level = 'chick' AND b.status = 'active'
      GROUP BY br.id, br.name, br.type, b.level, age_weeks, age_days
      ORDER BY br.name, age_weeks
    `);

    // Meat: from meat_production, grouped by breed
    const [meatData] = await pool.execute(`
      SELECT
        br.name as breed_name,
        br.type as breed_type,
        SUM(mp.quantity_kg) as total_kg,
        SUM(mp.number_of_birds) as total_birds
      FROM meat_production mp
      JOIN batches b ON mp.batch_id = b.id
      JOIN breeds br ON b.breed_id = br.id
      GROUP BY br.id, br.name, br.type
      ORDER BY br.name
    `);

    // Manure: from manure_production
    const [manureData] = await pool.execute(`
      SELECT SUM(quantity_kg) as total_kg FROM manure_production
    `);

    // Structure the response
    const availableProducts = {
      eggs: {
        total: eggsData.reduce((sum, item) => sum + parseInt(item.total_quantity || 0), 0),
        by_breed: eggsData.map(item => ({
          breed: item.breed_name,
          type: item.breed_type,
          quantity: parseInt(item.total_quantity || 0)
        }))
      },
      chicks: {
        total: chicksData.reduce((sum, item) => sum + parseInt(item.total_quantity || 0), 0),
        by_breed_and_age: chicksData.map(item => ({
          breed: item.breed_name,
          type: item.breed_type,
          age_weeks: item.age_weeks,
          age_days: item.age_days,
          quantity: parseInt(item.total_quantity || 0)
        }))
      },
      meat: {
        total_kg: meatData.reduce((sum, item) => sum + parseFloat(item.total_kg || 0), 0),
        total_birds: meatData.reduce((sum, item) => sum + parseInt(item.total_birds || 0), 0),
        by_breed: meatData.map(item => ({
          breed: item.breed_name,
          type: item.breed_type,
          kg: parseFloat(item.total_kg || 0),
          birds: parseInt(item.total_birds || 0)
        }))
      },
      manure: {
        total_kg: parseFloat(manureData[0]?.total_kg || 0)
      }
    };

    return NextResponse.json(availableProducts);
  } catch (error) {
    console.error('Error fetching available products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
