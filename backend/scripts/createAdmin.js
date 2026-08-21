require('dotenv').config();
const bcrypt = require('bcrypt');
const { connectDB, getPool } = require('../config/db');

async function main() {
  const [,, email, password, name = 'Administrator'] = process.argv;
  if (!email || !password) {
    console.error('Usage: node createAdmin.js <email> <password> [name]');
    process.exit(1);
  }

  try {
    await connectDB();
    const pool = getPool();
    const normalized = email.trim().toLowerCase();
    const [existing] = await pool.execute('SELECT id, role FROM users WHERE email = ? LIMIT 1', [normalized]);
    const passwordHash = await bcrypt.hash(password, 12);

    if (existing.length) {
      if (existing[0].role !== 'admin') {
        throw new Error(`An existing ${existing[0].role} account already uses ${normalized}. Create the admin with a different email so that account keeps its role.`);
      }
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [passwordHash, existing[0].id]);
      console.log(`Updated password for existing admin (${normalized}).`);
      process.exit(0);
    }

    const [result] = await pool.execute('INSERT INTO users (name, student_id, email, password, role) VALUES (?, ?, ?, ?, ?)', [name.trim(), null, normalized, passwordHash, 'admin']);
    console.log(`Created admin user with id ${result.insertId} and email ${normalized}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err.message || err);
    process.exit(1);
  }
}

main();
