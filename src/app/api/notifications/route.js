import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    let query = `
      SELECT
        n.*,
        u.name as created_by_name
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.user_id = ? OR n.user_id IS NULL
    `;

    const params = [userId];

    if (unreadOnly) {
      query += ' AND n.is_read = FALSE';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user_id, title, message, type, priority, related_id, related_type } = await request.json();

    if (!title || !message || !type) {
      return NextResponse.json({ message: 'Title, message, and type are required' }, { status: 400 });
    }

    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, type, priority, related_id, related_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [user_id || null, title, message, type, priority || 'normal', related_id || null, related_type || null]
    );

    return NextResponse.json({
      id: result.insertId,
      title,
      message,
      type,
      priority: priority || 'normal'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const { is_read } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 });
    }

    await db.query(
      'UPDATE notifications SET is_read = ?, read_at = NOW() WHERE id = ?',
      [is_read, notificationId]
    );

    return NextResponse.json({ message: 'Notification updated successfully' });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
