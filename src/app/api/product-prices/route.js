import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        pr.product_name as product_type,
        b.name as breed_name,
        p.unit_price as price_per_unit,
        'piece' as unit,
        p.effective_date,
        NULL as notes,
        p.created_at,
        p.created_at as updated_at
      FROM prices p
      LEFT JOIN products pr ON p.product_id = pr.id
      LEFT JOIN breeds b ON pr.breed_id = b.id
      WHERE p.is_current = 1
      ORDER BY pr.product_name, p.effective_date DESC
    `);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product prices' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { product_type, breed_name, price_per_unit, unit, effective_date, notes } = body;

    // Validate required fields
    if (!product_type || !price_per_unit || !effective_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, find the product_id based on product_type
    const [products] = await db.query(`
      SELECT id FROM products WHERE product_name = ? LIMIT 1
    `, [product_type]);

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product_id = products[0].id;

    // Set all existing prices for this product to not current
    await db.query(`
      UPDATE prices SET is_current = 0 WHERE product_id = ?
    `, [product_id]);

    // Insert new price
    const [result] = await db.query(`
      INSERT INTO prices (product_id, unit_price, effective_date, is_current)
      VALUES (?, ?, ?, 1)
    `, [product_id, price_per_unit, effective_date]);

    return NextResponse.json({
      success: true,
      message: 'Product price created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating product price:', error);
    return NextResponse.json(
      { error: 'Failed to create product price' },
      { status: 500 }
    );
  }
}
