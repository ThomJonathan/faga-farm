import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT
        ei.*,
        b.name as breed_name,
        b.type as breed_type,
        i.incubator_name,
        i.capacity as incubator_capacity,
        i.current_load as incubator_current_load
      FROM egg_incubations ei
      JOIN breeds b ON ei.breed_id = b.id
      JOIN incubators i ON ei.incubator_id = i.id
      ORDER BY ei.created_at DESC
    `);

    // Calculate summary
    const summary = {
      total_batches: rows.length,
      total_eggs: rows.reduce((sum, inc) => sum + inc.number_of_eggs, 0),
      total_hatched: rows.reduce((sum, inc) => sum + inc.hatched_chicks, 0),
      avg_hatch_rate: rows.length > 0
        ? (rows.reduce((sum, inc) => sum + (inc.hatching_rate || 0), 0) / rows.length).toFixed(1)
        : 0
    };

    return NextResponse.json({
      records: rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching egg incubations:', error);
    return NextResponse.json(
      { message: 'Error fetching egg incubations' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, hatch_date, hatched_chicks, unhatched_chicks, notes } = await request.json();

    if (!id || !hatch_date || hatched_chicks === undefined) {
      return NextResponse.json(
        { message: 'ID, hatch date, and hatched chicks count are required' },
        { status: 400 }
      );
    }

    // Check if incubation exists and is not already hatched
    const [incubationRows] = await pool.execute(
      'SELECT * FROM egg_incubations WHERE id = ?',
      [id]
    );

    if (incubationRows.length === 0) {
      return NextResponse.json(
        { message: 'Incubation not found' },
        { status: 404 }
      );
    }

    const incubation = incubationRows[0];

    if (incubation.status === 'hatched') {
      return NextResponse.json(
        { message: 'Incubation is already hatched' },
        { status: 400 }
      );
    }

    // Update incubation record (remove hatching_rate from SET clause since it's generated)
    await pool.execute(
      `UPDATE egg_incubations
       SET hatch_date = ?, hatched_chicks = ?, unhatched_chicks = ?, status = 'hatched', notes = CONCAT(IFNULL(notes, ''), '\nHatched: ', ?)
       WHERE id = ?`,
      [hatch_date, hatched_chicks || 0, unhatched_chicks || 0, notes || 'Hatching recorded', id]
    );

    // Update incubator current_load (remove the eggs)
    await pool.execute(
      'UPDATE incubators SET current_load = current_load - ? WHERE id = ?',
      [incubation.number_of_eggs, incubation.incubator_id]
    );

    // Update egg collection quantity (remove hatched eggs since they are now chicks)
    if (incubation.collection_id) {
      await pool.execute(
        'UPDATE egg_collections SET quantity = quantity - ? WHERE id = ?',
        [incubation.number_of_eggs, incubation.collection_id]
      );
    }

    // Start transaction for inventory management
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if there's a chick product for this breed and add hatched chicks to inventory
      const [incubationInfo] = await connection.execute(
        'SELECT ei.breed_id FROM egg_incubations ei WHERE ei.id = ?',
        [id]
      );

      if (incubationInfo.length > 0) {
        const breedId = incubationInfo[0].breed_id;

        // Check if there's already a chick product for this breed
        const [existingProduct] = await connection.execute(
          'SELECT id, available_quantity FROM products WHERE breed_id = ? AND product_type = "day_old_chicks"',
          [breedId]
        );

        let chickProductId;
        if (existingProduct.length > 0) {
          // Update existing chick product stock
          chickProductId = existingProduct[0].id;
          const currentStock = existingProduct[0].available_quantity || 0;
          const newStock = currentStock + hatched_chicks;

          await connection.execute(
            'UPDATE products SET available_quantity = ? WHERE id = ?',
            [newStock, chickProductId]
          );

          // Record inventory transaction for stock increase
          await connection.execute(
            'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [chickProductId, null, 'production', hatched_chicks, currentStock, newStock, id, `Egg incubation hatched: ${hatched_chicks} chicks added to inventory`]
          );
        } else {
          // Create new chick product
          const [breedInfo] = await connection.execute('SELECT name FROM breeds WHERE id = ?', [breedId]);
          const breedName = breedInfo[0].name;

          const [productResult] = await connection.execute(
            'INSERT INTO products (product_name, product_type, description, unit_price, breed_id, available_quantity, stock_threshold, alert_enabled, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [`${breedName} Chicks`, 'day_old_chicks', `Live ${breedName} chicks for sale`, 500.00, breedId, hatched_chicks, 50, true, true]
          );

          chickProductId = productResult.insertId;

          // Record inventory transaction for new product
          await connection.execute(
            'INSERT INTO inventory_transactions (product_id, batch_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [chickProductId, null, 'production', hatched_chicks, 0, hatched_chicks, id, `New chick product created from incubation: ${hatched_chicks} chicks`]
          );
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json(
        { message: 'Hatching recorded successfully' },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error recording hatching:', error);
    return NextResponse.json(
      { message: 'Error recording hatching' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { egg_batch_name, collection_id, incubator_id, start_date, number_of_eggs, notes } = await request.json();

    // Validate required fields
    if (!egg_batch_name || !collection_id || !incubator_id || !start_date || !number_of_eggs) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if egg collection exists and is for incubation
    const [collectionRows] = await pool.execute(
      `SELECT ec.*, b.breed_id
       FROM egg_collections ec
       JOIN batches b ON ec.batch_id = b.id
       WHERE ec.id = ? AND ec.egg_type = 'incubation'`,
      [collection_id]
    );

    if (collectionRows.length === 0) {
      return NextResponse.json(
        { message: 'Egg collection not found or not marked for incubation' },
        { status: 404 }
      );
    }

    const collection = collectionRows[0];

    // Check if enough eggs are available in the collection
    if (collection.quantity < number_of_eggs) {
      return NextResponse.json(
        { message: `Not enough eggs in collection. Available: ${collection.quantity}, Required: ${number_of_eggs}` },
        { status: 400 }
      );
    }

    // Check if incubator has enough capacity
    const [incubatorRows] = await pool.execute(
      'SELECT capacity, current_load FROM incubators WHERE id = ? AND is_active = TRUE',
      [incubator_id]
    );

    if (incubatorRows.length === 0) {
      return NextResponse.json(
        { message: 'Incubator not found or inactive' },
        { status: 404 }
      );
    }

    const availableCapacity = incubatorRows[0].capacity - incubatorRows[0].current_load;
    if (availableCapacity < number_of_eggs) {
      return NextResponse.json(
        { message: `Not enough capacity in incubator. Available: ${availableCapacity}, Required: ${number_of_eggs}` },
        { status: 400 }
      );
    }

    // Start transaction using connection
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert the incubation record
      const [result] = await connection.execute(
        `INSERT INTO egg_incubations
         (egg_batch_name, breed_id, incubator_id, start_date, number_of_eggs, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [egg_batch_name, collection.breed_id, incubator_id, start_date, number_of_eggs, notes || null]
      );

      // Decrease the quantity in egg_collections
      await connection.execute(
        'UPDATE egg_collections SET quantity = quantity - ? WHERE id = ?',
        [number_of_eggs, collection_id]
      );

      // Update incubator current_load
      await connection.execute(
        'UPDATE incubators SET current_load = current_load + ? WHERE id = ?',
        [number_of_eggs, incubator_id]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json(
        { message: 'Egg incubation started successfully', id: result.insertId },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating egg incubation:', error);
    return NextResponse.json(
      { message: 'Error starting egg incubation' },
      { status: 500 }
    );
  }
}
