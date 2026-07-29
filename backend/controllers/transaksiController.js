const TransaksiModel = require('../models/transaksiModel');

const transaksiController = {
  getAll: (req, res) => {
    if (req.user.role === 'anggota') {
      TransaksiModel.getByAnggota(req.user.anggota_id, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    } else {
      TransaksiModel.getAll((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  },

  getById: (req, res) => {
    TransaksiModel.getById(req.params.id, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      
      // Cek akses: anggota hanya bisa lihat transaksinya sendiri
      if (req.user.role === 'anggota' && req.user.anggota_id !== row.anggota_id) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
      
      res.json(row);
    });
  },

  getByAnggota: (req, res) => {
    const anggotaId = req.params.anggotaId;
    
    if (req.user.role === 'anggota' && req.user.anggota_id != anggotaId) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    
    TransaksiModel.getByAnggota(anggotaId, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  },

  // HANYA ADMIN YANG BISA MEMBUAT TRANSAKSI
  create: (req, res) => {
    // Hanya admin yang bisa membuat transaksi
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang dapat membuat transaksi' });
    }
    
    const data = req.body;
    
    TransaksiModel.create(data, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...data });
    });
  },

  // HANYA ADMIN YANG BISA UPDATE TRANSAKSI
  update: (req, res) => {
    // Hanya admin yang bisa edit transaksi
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa mengedit transaksi' });
    }
    
    const { id } = req.params;
    const { kategori, jenis, nominal, tanggal, keterangan } = req.body;
    
    TransaksiModel.update(id, { kategori, jenis, nominal, tanggal, keterangan }, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Transaksi berhasil diupdate', id });
    });
  },

  // HANYA ADMIN YANG BISA DELETE TRANSAKSI
  delete: (req, res) => {
    // Hanya admin yang bisa hapus transaksi
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa menghapus transaksi' });
    }
    
    TransaksiModel.delete(req.params.id, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Transaksi berhasil dihapus' });
    });
  },

  getLatest: (req, res) => {
    const limit = req.query.limit || 10;
    
    if (req.user.role === 'anggota') {
      TransaksiModel.getByAnggota(req.user.anggota_id, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.slice(0, limit));
      });
    } else {
      TransaksiModel.getLatest(limit, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  }
};

module.exports = transaksiController;