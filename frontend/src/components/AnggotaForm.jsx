import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnggotaForm = ({ anggota, onClose }) => {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (anggota) {
      setNama(anggota.nama);
      // Username dan password tidak diisi saat edit
    }
  }, [anggota]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama anggota tidak boleh kosong');
      return;
    }

    if (!anggota && (!username.trim() || !password.trim())) {
      alert('Username dan password wajib diisi untuk anggota baru');
      return;
    }

    setLoading(true);
    try {
      if (anggota) {
        await axios.put(`/api/anggota/${anggota.id}`, { nama });
        alert('Anggota berhasil diupdate');
      } else {
        await axios.post('/api/anggota', { nama, username, password });
        alert('Anggota berhasil ditambahkan. Akun login sudah dibuat.');
      }
      onClose();
    } catch (error) {
      console.error('Error saving anggota:', error);
      alert(error.response?.data?.error || 'Gagal menyimpan data anggota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md transition-colors duration-300">
        <div className="border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {anggota ? 'Edit Anggota' : 'Tambah Anggota Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Anggota *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan nama anggota"
              required
            />
          </div>

          {!anggota && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username (untuk login) *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contoh: ahmad123"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password (untuk login) *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimal 4 karakter"
                  required
                  minLength="4"
                />
              </div>
            </>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (anggota ? 'Update' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnggotaForm;