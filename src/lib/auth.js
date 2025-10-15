// Basic authentication utilities
const pool = require('./db');
const bcrypt = require('bcryptjs');

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

module.exports = { authenticateUser, createUser, getUserById, checkUsernameExists };
