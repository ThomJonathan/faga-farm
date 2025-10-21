import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    // Eggs for sale: from products table where product_type = 'eggs'
    const [eggsData] = await pool.execute(`
      SELECT
        p.product_name,
        p.available_quantity,
        p.unit_price,
        br.name as breed_name,
        br.type as breed_type
      FROM products p
      LEFT JOIN breeds br ON p.breed_id = br.id
      WHERE p.product_type = 'eggs' AND p.is_active = true
      ORDER BY p.product_name
    `);

    // Live chicks: from products table where product_type = 'chicks'
    const [chicksData] = await pool.execute(`
      SELECT
        p.product_name,
        p.available_quantity,
        p.unit_price,
        br.name as breed_name,
        br.type as breed_type
      FROM products p
      LEFT JOIN breeds br ON p.breed_id = br.id
      WHERE p.product_type = 'chicks' AND p.is_active = true
      ORDER BY p.product_name
    `);

    // Meat: from products table where product_type = 'meat'
    const [meatData] = await pool.execute(`
      SELECT
        p.product_name,
        p.available_quantity,
        p.unit_price,
        br.name as breed_name,
        br.type as breed_type
      FROM products p
      LEFT JOIN breeds br ON p.breed_id = br.id
      WHERE p.product_type = 'meat' AND p.is_active = true
      ORDER BY p.product_name
    `);

    // Manure: from products table where product_type = 'manure'
    const [manureData] = await pool.execute(`
      SELECT
        p.product_name,
        p.available_quantity,
        p.unit_price
      FROM products p
      WHERE p.product_type = 'manure' AND p.is_active = true
      ORDER BY p.product_name
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
