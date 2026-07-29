const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');

const SECRET_KEY = process.env.JWT_SECRET || 'rahasia_sangat_rahasia_2024';

const authController = {
  // Login
  login: (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    UserModel.findByUsername(username, (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }

      const isValidPassword = bcrypt.compareSync(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }

      // Buat token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          anggota_id: user.anggota_id,
          anggota_nama: user.anggota_nama
        },
        SECRET_KEY,
        { expiresIn: '8h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          anggota_id: user.anggota_id,
          anggota_nama: user.anggota_nama
        }
      });
    });
  },

  // Change Password
  changePassword: (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Password baru minimal 4 karakter' });
    }

    // Cari user di database
    UserModel.findById(userId, (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      // Verifikasi password saat ini
      const isValidPassword = bcrypt.compareSync(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Password saat ini salah' });
      }

      // Update password
      UserModel.updatePassword(userId, newPassword, (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }

        res.json({ success: true, message: 'Password berhasil diubah' });
      });
    });
  },

  // Verifikasi token (middleware)
  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token tidak valid' });
      }
      req.user = decoded;
      next();
    });
  },

  // Middleware untuk admin
  isAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya untuk admin.' });
    }
    next();
  },

  // Get current user info
  getMe: (req, res) => {
    res.json({
      user: req.user
    });
  }
};

module.exports = authController;