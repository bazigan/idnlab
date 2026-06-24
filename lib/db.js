/**
 * db.js
 * --------------------------------------------------------------
 * Penyimpanan data ke database MariaDB / MySQL (RDS).
 * Memakai driver "mysql2". Konfigurasi koneksi diambil dari .env.
 * Support AWS RDS dengan IAM authentication dan SSL.
 *
 * Tabel dibuat otomatis saat aplikasi pertama jalan (init), dan
 * katalog awal di-seed kalau tabel masih kosong. Jadi setelah
 * RDS dibuat, tinggal isi .env lalu jalankan — selesai.
 * --------------------------------------------------------------
 */

const mysql = require("mysql2/promise");
const AWS = require("aws-sdk");
const fs = require("fs");
const seedTrainings = require("./seed");

// Konfigurasi AWS Region untuk RDS Database
AWS.config.update({ region: process.env.AWS_REGION_DB || "ap-southeast-3" });

// Variable untuk menyimpan pool
let pool;

/**
 * Inisialisasi koneksi pool dengan AWS RDS IAM authentication dan SSL
 */
async function initPool() {
  if (pool) return pool;

  // Generate password dari AWS RDS token jika menggunakan IAM auth
  let password = process.env.DB_PASSWORD;
  
  if (process.env.USE_IAM_AUTH === "true") {
    const rds = new AWS.RDS();
    password = rds.generateDbAuthToken({
      Hostname: process.env.DB_HOST,
      Port: Number(process.env.DB_PORT) || 3306,
      Region: process.env.AWS_REGION_DB || "ap-southeast-3",
      Username: process.env.DB_USER,
    });
  }

  const poolConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: password,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  };

  // Tambahkan SSL config jika file global-bundle.pem tersedia
  if (fs.existsSync("./global-bundle.pem")) {
    poolConfig.ssl = {
      rejectUnauthorized: false,
      ca: fs.readFileSync("./global-bundle.pem"),
    };
  }

  pool = mysql.createPool(poolConfig);
  return pool;
}

/**
 * Membuat tabel bila belum ada, lalu mengisi katalog awal
 * kalau tabel trainings masih kosong. Dipanggil sekali saat start.
 */
async function init() {
  await initPool(); // Inisialisasi pool dengan SSL
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trainings (
      id          VARCHAR(80)  PRIMARY KEY,
      title       VARCHAR(160) NOT NULL,
      category    VARCHAR(40),
      level       VARCHAR(40),
      description TEXT,
      duration    VARCHAR(40),
      certificate VARCHAR(120),
      price       INT,
      color       VARCHAR(160)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id            VARCHAR(40)  PRIMARY KEY,
      trainingId    VARCHAR(80),
      trainingTitle VARCHAR(160),
      name          VARCHAR(120),
      email         VARCHAR(160),
      phone         VARCHAR(40),
      company       VARCHAR(160),
      amount        INT,
      status        VARCHAR(60),
      proofFile     VARCHAR(255),
      createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed katalog awal kalau masih kosong
  const [rows] = await pool.query("SELECT COUNT(*) AS jumlah FROM trainings");
  if (rows[0].jumlah === 0) {
    for (const t of seedTrainings) await addTraining(t);
    console.log("  Katalog awal di-seed:", seedTrainings.length, "training");
  }
}

// ---------- KATALOG TRAINING ----------

async function getTrainings() {
  const [rows] = await pool.query("SELECT * FROM trainings ORDER BY title");
  return rows;
}

async function getTrainingById(id) {
  const [rows] = await pool.query("SELECT * FROM trainings WHERE id = ?", [id]);
  return rows[0];
}

async function addTraining(t) {
  await pool.query(
    `INSERT INTO trainings (id, title, category, level, description, duration, certificate, price, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.id, t.title, t.category, t.level, t.description, t.duration, t.certificate, t.price, t.color]
  );
}

async function updateTraining(id, t) {
  await pool.query(
    `UPDATE trainings
       SET title = ?, category = ?, level = ?, description = ?, duration = ?, certificate = ?, price = ?, color = ?
     WHERE id = ?`,
    [t.title, t.category, t.level, t.description, t.duration, t.certificate, t.price, t.color, id]
  );
}

async function deleteTraining(id) {
  await pool.query("DELETE FROM trainings WHERE id = ?", [id]);
}

// ---------- PENDAFTARAN ----------

async function getRegistrations() {
  const [rows] = await pool.query("SELECT * FROM registrations ORDER BY createdAt DESC");
  return rows;
}

async function getRegistrationById(id) {
  const [rows] = await pool.query("SELECT * FROM registrations WHERE id = ?", [id]);
  return rows[0];
}

async function addRegistration(r) {
  await pool.query(
    `INSERT INTO registrations (id, trainingId, trainingTitle, name, email, phone, company, amount, status, proofFile)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.id, r.trainingId, r.trainingTitle, r.name, r.email, r.phone, r.company, r.amount, r.status, r.proofFile]
  );
}

/** Memperbarui referensi bukti pembayaran dan status setelah upload. */
async function updateRegistrationProof(id, proofFile, status) {
  await pool.query("UPDATE registrations SET proofFile = ?, status = ? WHERE id = ?", [proofFile, status, id]);
}

module.exports = {
  initPool,
  init,
  getTrainings,
  getTrainingById,
  addTraining,
  updateTraining,
  deleteTraining,
  getRegistrations,
  getRegistrationById,
  addRegistration,
  updateRegistrationProof,
};
