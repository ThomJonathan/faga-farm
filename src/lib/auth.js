// Basic authentication utilities
const pool = require('./db');
const bcrypt = require('bcryptjs');
const { cookies } = require('next/headers');

async function authenticateUser(username, password) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, username, password, role, is_active FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

async function createUser(userData) {
  try {
    const { name, username, password, email, phone, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, username, password, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, username, hashedPassword, email, phone, role]
    );
    return result.insertId;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, username, role, is_active FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

async function checkUsernameExists(username) {
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Check username error:', error);
    return false;
  }
}

async function setUserSession(user) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  });
  cookieStore.set('user_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

async function getUserSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
}

async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.set('user_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

module.exports = {
  authenticateUser,
  createUser,
  getUserById,
  checkUsernameExists,
  setUserSession,
  getUserSession,
  clearUserSession
};
