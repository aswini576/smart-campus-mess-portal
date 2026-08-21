const mysql = require('mysql2/promise');
const { dbHost, dbPort, dbName, dbUser, dbPassword } = require('./env');

let pool;
let connected = false;

async function connectDB() {
  if (!dbName || !dbUser) throw new Error('MySQL database settings are not configured.');
  const rootConnection = await mysql.createConnection({ host: dbHost, port: dbPort, user: dbUser, password: dbPassword, multipleStatements: true });
  await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await rootConnection.end();
  pool = mysql.createPool({ host: dbHost, port: dbPort, database: dbName, user: dbUser, password: dbPassword, waitForConnections: true, connectionLimit: 10, queueLimit: 0 });
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    student_id VARCHAR(80) NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'messChief', 'admin') NOT NULL DEFAULT 'student',
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  const [approvalColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'is_approved'");
  if (!approvalColumns.length) await pool.query('ALTER TABLE users ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT TRUE AFTER role');
  await pool.query(`CREATE TABLE IF NOT EXISTS meals (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    meal_date DATETIME NOT NULL,
    booking_deadline DATETIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    quantity INT UNSIGNED NOT NULL DEFAULT 0,
    price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
    ingredients JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meal_date_type (meal_date, meal_type)
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    meal_id INT UNSIGNED NOT NULL,
    status ENUM('booked', 'cancelled', 'attended') NOT NULL DEFAULT 'booked',
    payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
    booking_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_meal (student_id, meal_id),
    CONSTRAINT fk_orders_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_meal FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  const [mealPriceColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'price'");
  if (!mealPriceColumns.length) await pool.query('ALTER TABLE meals ADD COLUMN price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0 AFTER quantity');
  const [paymentStatusColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'payment_status'");
  if (!paymentStatusColumns.length) await pool.query("ALTER TABLE orders ADD COLUMN payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid' AFTER status");
  await pool.query(`CREATE TABLE IF NOT EXISTS system_settings (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
    campus_name VARCHAR(255) NOT NULL DEFAULT 'CampusBite',
    booking_reminder_hours INT UNSIGNED NOT NULL DEFAULT 4,
    allow_student_cancellation BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await pool.execute('INSERT IGNORE INTO system_settings (id) VALUES (1)');
  await pool.query(`CREATE TABLE IF NOT EXISTS feedback (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    meal_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment VARCHAR(1000) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_feedback_student_meal (student_id, meal_id),
    CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_meal FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS offered_meals (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL UNIQUE,
    original_student_id INT UNSIGNED NOT NULL,
    claimed_student_id INT UNSIGNED NULL,
    status ENUM('offered', 'claimed', 'expired', 'cancelled') NOT NULL DEFAULT 'offered',
    offered_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_time DATETIME NULL,
    expiry_time DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_offer_status_expiry (status, expiry_time),
    CONSTRAINT fk_offer_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_original_student FOREIGN KEY (original_student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_claimed_student FOREIGN KEY (claimed_student_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
  connected = true;
  console.log(`MySQL connected: ${dbHost}/${dbName}`);
  return pool;
}

function getPool() { if (!pool) throw new Error('MySQL is not connected.'); return pool; }
function isConnected() { return connected; }

module.exports = { connectDB, getPool, isConnected };
