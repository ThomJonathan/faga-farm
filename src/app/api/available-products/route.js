import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    // Eggs for sale: from egg_collections table
    const [eggsData] = await pool.execute(`
      SELECT
        CONCAT(br.name, ' Eggs') as product_name,
        ec.quantity as available_quantity,
        COALESCE(p.unit_price, 0) as unit_price,
        br.name as breed_name,
        br.type as breed_type
      FROM egg_collections ec
      LEFT JOIN batches b ON ec.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN products pr ON pr.product_name = CONCAT(br.name, ' Eggs')
      LEFT JOIN prices p ON pr.id = p.product_id AND p.is_current = TRUE
      WHERE ec.quantity > 0
      ORDER BY br.name
    `);

    // Live chicks: from active batches
    const [chicksData] = await pool.execute(`
      SELECT
        CONCAT('Day Old ', br.name, ' Chicks') as product_name,
        b.current_quantity as available_quantity,
        COALESCE(p.unit_price, 0) as unit_price,
        br.name as breed_name,
        br.type as breed_type
      FROM batches b
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN products pr ON pr.product_name = CONCAT('Day Old ', br.name, ' Chicks')
      LEFT JOIN prices p ON pr.id = p.product_id AND p.is_current = TRUE
      WHERE b.status = 'active' AND b.current_quantity > 0
      ORDER BY br.name
    `);

    // Meat: from meat_production table
    const [meatData] = await pool.execute(`
      SELECT
        CONCAT('Dressed ', br.name, ' Chicken') as product_name,
        mp.quantity_kg as available_quantity,
        COALESCE(p.unit_price, 0) as unit_price,
        br.name as breed_name,
        br.type as breed_type
      FROM meat_production mp
      LEFT JOIN batches b ON mp.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN products pr ON pr.product_name = CONCAT('Dressed ', br.name, ' Chicken')
      LEFT JOIN prices p ON pr.id = p.product_id AND p.is_current = TRUE
      WHERE mp.quantity_kg > 0
      ORDER BY br.name
    `);

    // Manure: from manure_production table
    const [manureData] = await pool.execute(`
      SELECT
        CONCAT(br.name, ' Manure') as product_name,
        mp.quantity_kg as available_quantity,
        COALESCE(p.unit_price, 0) as unit_price,
        br.name as breed_name,
        br.type as breed_type
      FROM manure_production mp
      LEFT JOIN batches b ON mp.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN products pr ON pr.product_name = CONCAT(br.name, ' Manure')
      LEFT JOIN prices p ON pr.id = p.product_id AND p.is_current = TRUE
      WHERE mp.quantity_kg > 0
      ORDER BY br.name
    `);

    // Structure the response - only include products with quantity > 0
    const availableProducts = {
      eggs: {
        total: eggsData.reduce((sum, item) => sum + parseInt(item.available_quantity || 0), 0),
        by_product: eggsData
          .filter(item => parseInt(item.available_quantity || 0) > 0)
          .map(item => ({
            product_name: item.product_name,
            breed: item.breed_name,
            type: item.breed_type,
            quantity: parseInt(item.available_quantity || 0),
            unit_price: parseFloat(item.unit_price || 0)
          }))
      },
      chicks: {
        total: chicksData.reduce((sum, item) => sum + parseInt(item.available_quantity || 0), 0),
        by_product: chicksData
          .filter(item => parseInt(item.available_quantity || 0) > 0)
          .map(item => ({
            product_name: item.product_name,
            breed: item.breed_name,
            type: item.breed_type,
            quantity: parseInt(item.available_quantity || 0),
            unit_price: parseFloat(item.unit_price || 0)
          }))
      },
      meat: {
        total_kg: meatData.reduce((sum, item) => sum + parseFloat(item.available_quantity || 0), 0),
        by_product: meatData
          .filter(item => parseFloat(item.available_quantity || 0) > 0)
          .map(item => ({
            product_name: item.product_name,
            breed: item.breed_name,
            type: item.breed_type,
            kg: parseFloat(item.available_quantity || 0),
            unit_price: parseFloat(item.unit_price || 0)
          }))
      },
      manure: {
        total_kg: manureData.reduce((sum, item) => sum + parseFloat(item.available_quantity || 0), 0),
        by_product: manureData
          .filter(item => parseFloat(item.available_quantity || 0) > 0)
          .map(item => ({
            product_name: item.product_name,
            breed: item.breed_name,
            type: item.breed_type,
            kg: parseFloat(item.available_quantity || 0),
            unit_price: parseFloat(item.unit_price || 0)
          }))
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
