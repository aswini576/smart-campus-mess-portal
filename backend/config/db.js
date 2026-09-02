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
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    profile_image LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  const [approvalColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'is_approved'");
  if (!approvalColumns.length) await pool.query('ALTER TABLE users ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT TRUE AFTER role');
  const [profileImageColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'profile_image'");
  if (!profileImageColumns.length) await pool.query('ALTER TABLE users ADD COLUMN profile_image LONGTEXT NULL AFTER is_approved');
  await pool.query(`CREATE TABLE IF NOT EXISTS meals (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    food_category ENUM('veg', 'non_veg') NOT NULL DEFAULT 'veg',
    meal_date DATETIME NOT NULL,
    booking_deadline DATETIME NOT NULL,
    booking_open_time TIME NOT NULL DEFAULT '00:00:00',
    booking_close_time TIME NOT NULL DEFAULT '23:59:59',
    receive_open_time TIME NOT NULL DEFAULT '12:00:00',
    receive_close_time TIME NOT NULL DEFAULT '14:00:00',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    quantity INT UNSIGNED NOT NULL DEFAULT 0,
    price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
    original_cost DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
    mess_payment_amount DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
    ingredients JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meal_date_type (meal_date, meal_type)
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    meal_id INT UNSIGNED NOT NULL,
    portion_size ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'medium',
    status ENUM('booked', 'cancelled', 'attended') NOT NULL DEFAULT 'booked',
    payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
    paid_amount DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
    payment_date DATETIME NULL,
    received_at DATETIME NULL,
    wasted_at DATETIME NULL,
    booking_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_meal (student_id, meal_id),
    CONSTRAINT fk_orders_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_meal FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  const [mealPriceColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'price'");
  if (!mealPriceColumns.length) await pool.query('ALTER TABLE meals ADD COLUMN price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0 AFTER quantity');
  const [originalCostColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'original_cost'");
  if (!originalCostColumns.length) await pool.query("ALTER TABLE meals ADD COLUMN original_cost DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0 AFTER price");
  const [messPaymentColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'mess_payment_amount'");
  if (!messPaymentColumns.length) await pool.query("ALTER TABLE meals ADD COLUMN mess_payment_amount DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0 AFTER original_cost");
  const [foodCategoryColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'food_category'");
  if (!foodCategoryColumns.length) await pool.query("ALTER TABLE meals ADD COLUMN food_category ENUM('veg', 'non_veg') NOT NULL DEFAULT 'veg' AFTER food_name");
  const [bookingOpenColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'booking_open_time'");
  if (!bookingOpenColumns.length) await pool.query("ALTER TABLE meals ADD COLUMN booking_open_time TIME NOT NULL DEFAULT '00:00:00' AFTER booking_deadline");
  const [bookingCloseColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'booking_close_time'");
  if (!bookingCloseColumns.length) {
    await pool.query("ALTER TABLE meals ADD COLUMN booking_close_time TIME NOT NULL DEFAULT '23:59:59' AFTER booking_open_time");
    await pool.query("UPDATE meals SET booking_close_time = TIME(booking_deadline)");
  }
  const [receiveOpenColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'receive_open_time'");
  if (!receiveOpenColumns.length) {
    await pool.query("ALTER TABLE meals ADD COLUMN receive_open_time TIME NOT NULL DEFAULT '12:00:00' AFTER booking_close_time");
    await pool.query("UPDATE meals SET receive_open_time = CASE meal_type WHEN 'breakfast' THEN '07:00:00' WHEN 'lunch' THEN '12:00:00' WHEN 'snack' THEN '15:00:00' WHEN 'dinner' THEN '18:00:00' END");
  }
  const [receiveCloseColumns] = await pool.query("SHOW COLUMNS FROM meals LIKE 'receive_close_time'");
  if (!receiveCloseColumns.length) {
    await pool.query("ALTER TABLE meals ADD COLUMN receive_close_time TIME NOT NULL DEFAULT '14:00:00' AFTER receive_open_time");
    await pool.query("UPDATE meals SET receive_close_time = CASE meal_type WHEN 'breakfast' THEN '09:00:00' WHEN 'lunch' THEN '14:00:00' WHEN 'snack' THEN '17:00:00' WHEN 'dinner' THEN '20:00:00' END");
  }
  const [paymentStatusColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'payment_status'");
  if (!paymentStatusColumns.length) await pool.query("ALTER TABLE orders ADD COLUMN payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid' AFTER status");
  const [paidAmountColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'paid_amount'");
  if (!paidAmountColumns.length) {
    await pool.query("ALTER TABLE orders ADD COLUMN paid_amount DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0 AFTER payment_status");
    await pool.query("UPDATE orders o JOIN meals m ON m.id = o.meal_id SET o.paid_amount = m.price WHERE o.payment_status = 'paid'");
  }
  const [paymentDateColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'payment_date'");
  if (!paymentDateColumns.length) await pool.query("ALTER TABLE orders ADD COLUMN payment_date DATETIME NULL AFTER paid_amount");
  const [portionSizeColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'portion_size'");
  if (!portionSizeColumns.length) await pool.query("ALTER TABLE orders ADD COLUMN portion_size ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'medium' AFTER meal_id");
  const [receivedAtColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'received_at'");
  if (!receivedAtColumns.length) await pool.query("ALTER TABLE orders ADD COLUMN received_at DATETIME NULL AFTER booking_time");
  const [wastedAtColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'wasted_at'");
  if (!wastedAtColumns.length) await pool.query("ALTER TABLE orders ADD COLUMN wasted_at DATETIME NULL AFTER received_at");
  const [bookingBlockedColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'booking_blocked_until'");
  if (!bookingBlockedColumns.length) await pool.query("ALTER TABLE users ADD COLUMN booking_blocked_until DATETIME NULL AFTER is_approved");
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
  await pool.query(`CREATE TABLE IF NOT EXISTS inventory (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE,
    quantity DECIMAL(12,3) UNSIGNED NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    low_stock_threshold DECIMAL(12,3) UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS inventory_usage (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT UNSIGNED NULL, item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,3) UNSIGNED NOT NULL, unit VARCHAR(50) NOT NULL,
    meal_id INT UNSIGNED NULL, note VARCHAR(500) NOT NULL DEFAULT '',
    used_by INT UNSIGNED NOT NULL, used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inventory_usage_item_date (inventory_id, used_at), INDEX idx_inventory_usage_date (used_at),
    CONSTRAINT fk_usage_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL,
    CONSTRAINT fk_usage_meal FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL,
    CONSTRAINT fk_usage_user FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS waste_predictions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, prediction_date DATE NOT NULL UNIQUE,
    expected_users INT UNSIGNED NOT NULL DEFAULT 0, food_required DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
    waste_amount DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS mess_payments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    week_start DATE NOT NULL UNIQUE,
    payable_amount DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
    payment_date DATETIME NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  const [messPaymentHiddenColumns] = await pool.query("SHOW COLUMNS FROM mess_payments LIKE 'is_hidden'");
  if (!messPaymentHiddenColumns.length) await pool.query('ALTER TABLE mess_payments ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE AFTER payment_date');
  await pool.query(`CREATE TABLE IF NOT EXISTS ai_suggestions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, suggestion_date DATE NOT NULL UNIQUE,
    response JSON NOT NULL, expected_users INT UNSIGNED NOT NULL DEFAULT 0,
    meal_count INT UNSIGNED NOT NULL DEFAULT 0, historical_waste_kg DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  connected = true;
  console.log(`MySQL connected: ${dbHost}/${dbName}`);
  return pool;
}

function getPool() { if (!pool) throw new Error('MySQL is not connected.'); return pool; }
function isConnected() { return connected; }

module.exports = { connectDB, getPool, isConnected };
