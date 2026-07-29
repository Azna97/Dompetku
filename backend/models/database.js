const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(path.join(__dirname, '../../tabungan.db'));

db.serialize(() => {
  // Tabel users (baru)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'anggota',
      anggota_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(anggota_id) REFERENCES anggota(id)
    )
  `);

  // Tabel anggota (sudah ada)
  db.run(`
    CREATE TABLE IF NOT EXISTS anggota (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabel transaksi (sudah ada)
  db.run(`
    CREATE TABLE IF NOT EXISTS transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER,
      kategori TEXT NOT NULL,
      jenis TEXT NOT NULL,
      nominal INTEGER NOT NULL,
      tanggal DATE DEFAULT CURRENT_DATE,
      keterangan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(anggota_id) REFERENCES anggota(id)
    )
  `);

  // Buat user admin default (password: admin123)
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (username, password, role) 
    VALUES ('admin', ?, 'admin')
  `, [adminPassword]);
});

module.exports = db;