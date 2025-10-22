import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { product_type, breed_name, price_per_unit, unit, effective_date, notes } = body;

    // Validate required fields
    if (!product_type || !price_per_unit || !unit || !effective_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [result] = await db.query(`
      UPDATE product_prices
      SET product_type = ?, breed_name = ?, price_per_unit = ?, unit = ?, effective_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [product_type, breed_name || null, price_per_unit, unit, effective_date, notes || null, id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product price updated successfully'
    });
  } catch (error) {
    console.error('Error updating product price:', error);
    return NextResponse.json(
      { error: 'Failed to update product price' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const [result] = await db.query(`
      DELETE FROM product_prices WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product price deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product price:', error);
    return NextResponse.json(
      { error: 'Failed to delete product price' },
      { status: 500 }
    );
  }
}
