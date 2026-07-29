const db = require('./database');

const TransaksiModel = {
  getAll: (callback) => {
    db.all(`
      SELECT t.*, a.nama as anggota_nama 
      FROM transaksi t
      JOIN anggota a ON t.anggota_id = a.id
      ORDER BY t.tanggal DESC, t.id DESC
    `, callback);
  },

  getByAnggota: (anggotaId, callback) => {
    db.all(`
      SELECT t.*, a.nama as anggota_nama 
      FROM transaksi t
      JOIN anggota a ON t.anggota_id = a.id
      WHERE t.anggota_id = ?
      ORDER BY t.tanggal DESC
    `, [anggotaId], callback);
  },

  getById: (id, callback) => {
    db.get(`
      SELECT t.*, a.nama as anggota_nama 
      FROM transaksi t
      JOIN anggota a ON t.anggota_id = a.id
      WHERE t.id = ?
    `, [id], callback);
  },

  create: (data, callback) => {
    const { anggota_id, kategori, jenis, nominal, tanggal, keterangan } = data;
    db.run(
      'INSERT INTO transaksi (anggota_id, kategori, jenis, nominal, tanggal, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
      [anggota_id, kategori, jenis, nominal, tanggal, keterangan],
      callback
    );
  },

  update: (id, data, callback) => {
    const { kategori, jenis, nominal, tanggal, keterangan } = data;
    db.run(
      'UPDATE transaksi SET kategori = ?, jenis = ?, nominal = ?, tanggal = ?, keterangan = ? WHERE id = ?',
      [kategori, jenis, nominal, tanggal, keterangan, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.run('DELETE FROM transaksi WHERE id = ?', [id], callback);
  },

  getLatest: (limit = 10, callback) => {
    db.all(`
      SELECT t.*, a.nama as anggota_nama 
      FROM transaksi t
      JOIN anggota a ON t.anggota_id = a.id
      ORDER BY t.tanggal DESC, t.id DESC
      LIMIT ?
    `, [limit], callback);
  },

  getStatistikKategori: (callback) => {
    db.all(`
      SELECT kategori, SUM(nominal) as total
      FROM transaksi
      WHERE jenis = 'setoran'
      GROUP BY kategori
    `, callback);
  },

  getTotalSaldo: (callback) => {
    db.get(`
      SELECT COALESCE(SUM(
        CASE WHEN jenis = 'setoran' THEN nominal 
        WHEN jenis = 'penarikan' THEN -nominal END
      ), 0) as total
      FROM transaksi
    `, callback);
  }
};

module.exports = TransaksiModel;