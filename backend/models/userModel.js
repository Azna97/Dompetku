const db = require('./database');
const bcrypt = require('bcrypt');

const UserModel = {
  // Cari user by username
  findByUsername: (username, callback) => {
    db.get(`
      SELECT u.*, a.nama as anggota_nama 
      FROM users u
      LEFT JOIN anggota a ON u.anggota_id = a.id
      WHERE u.username = ?
    `, [username], callback);
  },

  // Cari user by id
  findById: (id, callback) => {
    db.get(`
      SELECT u.*, a.nama as anggota_nama 
      FROM users u
      LEFT JOIN anggota a ON u.anggota_id = a.id
      WHERE u.id = ?
    `, [id], callback);
  },

  // Update password
  updatePassword: (id, newPassword, callback) => {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id], callback);
  },

  // Buat user baru untuk anggota
  createForAnggota: (username, password, anggotaId, callback) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(`
      INSERT INTO users (username, password, role, anggota_id) 
      VALUES (?, ?, 'anggota', ?)
    `, [username, hashedPassword, anggotaId], callback);
  },

  // Update user
  update: (id, data, callback) => {
    const { username, password, role } = data;
    let query = 'UPDATE users SET username = ?, role = ?';
    let params = [username, role];
    
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    db.run(query, params, callback);
  },

  // Delete user
  delete: (id, callback) => {
    db.run('DELETE FROM users WHERE id = ?', [id], callback);
  },

  // Get all users
  getAll: (callback) => {
    db.all(`
      SELECT u.id, u.username, u.role, u.anggota_id, a.nama as anggota_nama, u.created_at
      FROM users u
      LEFT JOIN anggota a ON u.anggota_id = a.id
      ORDER BY u.id DESC
    `, callback);
  },

  // Get user by anggota_id
  getByAnggotaId: (anggotaId, callback) => {
    db.get('SELECT * FROM users WHERE anggota_id = ?', [anggotaId], callback);
  }
};

module.exports = UserModel;