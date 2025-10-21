import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = `
      SELECT mp.*, b.batch_number, u.name as recorded_by_name
      FROM manure_production mp
      LEFT JOIN batches b ON mp.batch_id = b.id
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
    console.error('Error fetching manure production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch manure production records' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { batch_id, production_date, quantity_kg, quality_rating, notes, recorded_by } = body;

    if (!batch_id || !production_date || !quantity_kg) {
      return NextResponse.json(
        { success: false, error: 'Batch ID, production date, and quantity are required' },
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
      INSERT INTO manure_production
      (batch_id, production_date, quantity_kg, quality_rating, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      production_date,
      quantity_kg,
      quality_rating || 'good',
      notes || null,
      recorded_by || null
    ]);

    // Start transaction for inventory management
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if there's already a manure product for this breed, if not create one
      const [existingProduct] = await connection.execute(
        'SELECT id, available_quantity FROM products WHERE breed_id = (SELECT breed_id FROM batches WHERE id = ?) AND product_type = "manure"',
        [batch_id]
      );

      let manureProductId;
      if (existingProduct.length > 0) {
        // Update existing manure product stock
        manureProductId = existingProduct[0].id;
        const currentStock = existingProduct[0].available_quantity || 0;
        const newStock = currentStock + quantity_kg;

        await connection.execute(
          'UPDATE products SET available_quantity = ? WHERE id = ?',
          [newStock, manureProductId]
        );

        // Record inventory transaction for stock increase
        await connection.execute(
          'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [manureProductId, batch_id, 'production', quantity_kg, currentStock, newStock, result.insertId, `Manure production recorded: ${quantity_kg}kg`, recorded_by]
        );
      } else {
        // Create new manure product
        const [breedInfo] = await connection.execute('SELECT br.name FROM batches b JOIN breeds br ON b.breed_id = br.id WHERE b.id = ?', [batch_id]);
        const breedName = breedInfo[0].name;

        const [productResult] = await connection.execute(
          'INSERT INTO products (product_name, product_type, description, unit_price, breed_id, available_quantity, stock_threshold, alert_enabled, is_active) VALUES (?, ?, ?, ?, (SELECT breed_id FROM batches WHERE id = ?), ?, ?, ?, ?)',
          [`${breedName} Manure`, 'manure', `Organic ${breedName} manure for sale`, 10.00, batch_id, quantity_kg, 100, true, true]
        );

        manureProductId = productResult.insertId;

        // Record inventory transaction for new product
        await connection.execute(
          'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [manureProductId, batch_id, 'production', quantity_kg, 0, quantity_kg, result.insertId, `New manure product created: ${quantity_kg}kg`, recorded_by]
        );
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: 'Manure production recorded successfully',
        data: { id: result.insertId }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error creating manure production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record manure production' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, batch_id, production_date, quantity_kg, quality_rating, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE manure_production
      SET batch_id = ?, production_date = ?, quantity_kg = ?,
          quality_rating = ?, notes = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      batch_id,
      production_date,
      quantity_kg,
      quality_rating || 'good',
      notes || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Manure production record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Manure production updated successfully'
    });

  } catch (error) {
    console.error('Error updating manure production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update manure production' },
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
      'DELETE FROM manure_production WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Manure production record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Manure production deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting manure production:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete manure production' },
      { status: 500 }
    );
  }
}
