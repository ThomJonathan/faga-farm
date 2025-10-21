import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = `
      SELECT mp.*, b.batch_number, b.level, br.name as breed_name, u.name as recorded_by_name
      FROM meat_production mp
      LEFT JOIN batches b ON mp.batch_id = b.id
      LEFT JOIN breeds br ON b.breed_id = br.id
      LEFT JOIN users u ON mp.recorded_by = u.id
    `;

    const conditions = [];
    const params = [];

    if (batchId) {
      conditions.push('mp.batch_id = ?');
      params.push(batchId);
    }

    if (startDate) {
      conditions.push('mp.production_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('mp.production_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY mp.production_date DESC, mp.created_at DESC';

    const [rows] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching meat production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meat production records' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      batch_id,
      production_date,
      quantity_kg,
      number_of_birds,
      average_weight_kg,
      quality_rating,
      processing_cost,
      notes,
      recorded_by
    } = body;

    if (!batch_id || !production_date || !quantity_kg || !number_of_birds) {
      return NextResponse.json(
        { success: false, error: 'Batch ID, production date, quantity, and number of birds are required' },
        { status: 400 }
      );
    }

    // Verify batch exists
    const [batchCheck] = await pool.execute(
      'SELECT id FROM batches WHERE id = ?',
      [batch_id]
    );

    if (batchCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid batch ID' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO meat_production
      (batch_id, production_date, quantity_kg, number_of_birds, average_weight_kg, quality_rating, processing_cost, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      production_date,
      quantity_kg,
      number_of_birds,
      average_weight_kg || null,
      quality_rating || 'standard',
      processing_cost || 0,
      notes || null,
      recorded_by || null
    ]);

    // Update batch quantity (reduce by number of birds slaughtered)
    await pool.execute(`
      UPDATE batches
      SET current_quantity = current_quantity - ?
      WHERE id = ?
    `, [number_of_birds, batch_id]);

    // Check if there's already a meat product for this breed, if not create one
    const [existingProduct] = await pool.execute(
      'SELECT id, available_quantity FROM products WHERE breed_id = (SELECT breed_id FROM batches WHERE id = ?) AND product_type = "meat"',
      [batch_id]
    );

    let meatProductId;
    if (existingProduct.length > 0) {
      // Update existing meat product stock
      meatProductId = existingProduct[0].id;
      const currentStock = existingProduct[0].available_quantity || 0;
      const newStock = currentStock + quantity_kg;

      await pool.execute(
        'UPDATE products SET available_quantity = ? WHERE id = ?',
        [newStock, meatProductId]
      );

      // Record inventory transaction for stock increase
      await pool.execute(`
        INSERT INTO inventory_transactions
        (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes, created_by)
        VALUES (?, ?, 'production', ?, ?, ?, ?, ?, ?)
      `, [
        meatProductId,
        batch_id,
        quantity_kg,
        currentStock,
        newStock,
        result.insertId,
        `Meat production recorded: ${quantity_kg}kg from ${number_of_birds} birds`,
        recorded_by || null
      ]);
    } else {
      // Create new meat product
      const [breedInfo] = await pool.execute('SELECT br.name FROM batches b JOIN breeds br ON b.breed_id = br.id WHERE b.id = ?', [batch_id]);
      const breedName = breedInfo[0].name;

      const [productResult] = await pool.execute(
        'INSERT INTO products (product_name, product_type, description, unit_price, breed_id, available_quantity, stock_threshold, alert_enabled, is_active) VALUES (?, ?, ?, ?, (SELECT breed_id FROM batches WHERE id = ?), ?, ?, ?, ?)',
        [`${breedName} Meat`, 'meat', `Fresh ${breedName} meat for sale`, 200.00, batch_id, quantity_kg, 25, true, true]
      );

      meatProductId = productResult.insertId;

      // Record inventory transaction for new product
      await pool.execute(`
        INSERT INTO inventory_transactions
        (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes, created_by)
        VALUES (?, ?, 'production', ?, ?, ?, ?, ?, ?)
      `, [
        meatProductId,
        batch_id,
        quantity_kg,
        0,
        quantity_kg,
        result.insertId,
        `New meat product created: ${quantity_kg}kg from ${number_of_birds} birds`,
        recorded_by || null
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Meat production recorded successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error creating meat production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record meat production' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      batch_id,
      production_date,
      quantity_kg,
      average_weight_kg,
      quality_rating,
      processing_cost,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE meat_production
      SET batch_id = ?, production_date = ?, quantity_kg = ?,
          average_weight_kg = ?, quality_rating = ?, processing_cost = ?, notes = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      production_date,
      quantity_kg,
      average_weight_kg || null,
      quality_rating || 'standard',
      processing_cost || 0,
      notes || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Meat production record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meat production updated successfully'
    });

  } catch (error) {
    console.error('Error updating meat production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update meat production' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM meat_production WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Meat production record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meat production deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meat production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete meat production' },
      { status: 500 }
    );
  }
}
