const AnggotaModel = require('../models/anggotaModel');
const UserModel = require('../models/userModel');

const anggotaController = {
  getAll: (req, res) => {
    // Admin bisa lihat semua, anggota hanya lihat sendiri
    if (req.user.role === 'anggota') {
      AnggotaModel.getById(req.user.anggota_id, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // Format seperti array
        res.json(row ? [{ ...row, total_saldo: row.total_saldo || 0 }] : []);
      });
    } else {
      AnggotaModel.getAll((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  },

  getById: (req, res) => {
    // Cek akses: admin atau anggota yang sama
    if (req.user.role === 'anggota' && req.user.anggota_id != req.params.id) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    
    AnggotaModel.getById(req.params.id, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  },

  create: (req, res) => {
    // Hanya admin yang bisa buat anggota
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa menambah anggota' });
    }
    
    const { nama, username, password } = req.body;
    
    if (!nama || !username || !password) {
      return res.status(400).json({ error: 'Nama, username dan password wajib diisi' });
    }
    
    AnggotaModel.create(nama, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const anggotaId = this.lastID;
      
      // Buat user account untuk anggota
      UserModel.createForAnggota(username, password, anggotaId, (err2) => {
        if (err2) {
          // Rollback: hapus anggota jika gagal buat user
          AnggotaModel.delete(anggotaId, () => {});
          return res.status(500).json({ error: 'Gagal membuat akun user: ' + err2.message });
        }
        
        res.json({ id: anggotaId, nama, username });
      });
    });
  },

  update: (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa mengedit anggota' });
    }
    
    const { nama } = req.body;
    AnggotaModel.update(req.params.id, nama, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Anggota updated' });
    });
  },

  delete: (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa menghapus anggota' });
    }
    
    // Hapus juga user terkait
    UserModel.getByAnggotaId(req.params.id, (err, user) => {
      if (user) {
        UserModel.delete(user.id, () => {});
      }
      
      AnggotaModel.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Anggota deleted' });
      });
    });
  }
};

module.exports = anggotaController;