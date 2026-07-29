const db = require("./database");

const AnggotaModel = {
  getAll: (callback) => {
    db.all(
      `
      SELECT a.*, COALESCE(SUM(
        CASE WHEN t.jenis = 'setoran' THEN t.nominal 
        WHEN t.jenis = 'penarikan' THEN -t.nominal END
      ), 0) as total_saldo
      FROM anggota a
      LEFT JOIN transaksi t ON a.id = t.anggota_id
      GROUP BY a.id
      ORDER BY a.id DESC
    `,
      callback,
    );
  },

  getById: (id, callback) => {
    db.get("SELECT * FROM anggota WHERE id = ?", [id], callback);
  },

  create: (nama, callback) => {
    db.run("INSERT INTO anggota (nama) VALUES (?)", [nama], callback);
  },

  update: (id, nama, callback) => {
    db.run("UPDATE anggota SET nama = ? WHERE id = ?", [nama, id], callback);
  },

  delete: (id, callback) => {
    db.run("DELETE FROM anggota WHERE id = ?", [id], callback);
  },
};

module.exports = AnggotaModel;
