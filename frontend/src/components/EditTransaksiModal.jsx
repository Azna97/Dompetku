import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditTransaksiModal = ({ transaksi, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    kategori: '',
    jenis: '',
    nominal: '',
    tanggal: '',
    keterangan: ''
  });
  const [loading, setLoading] = useState(false);

  const kategoriOptions = ['Tabungan Pendidikan', 'Tabungan Darurat', 'Tabungan Qurban', 'Tabungan Hari Raya', 'Tabungan Lainnya'];

  useEffect(() => {
    if (transaksi) {
      setFormData({
        kategori: transaksi.kategori || '',
        jenis: transaksi.jenis || 'setoran',
        nominal: transaksi.nominal || '',
        tanggal: transaksi.tanggal || new Date().toISOString().split('T')[0],
        keterangan: transaksi.keterangan || ''
      });
    }
  }, [transaksi]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nominal || formData.nominal <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/transaksi/${transaksi.id}`, {
        ...formData,
        nominal: parseInt(formData.nominal)
      });
      alert('Transaksi berhasil diupdate');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating transaksi:', error);
      alert(error.response?.data?.error || 'Gagal mengupdate transaksi');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md transition-colors duration-300">
        <div className="border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Edit Transaksi
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
              Kategori *
            </label>
            <select
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih Kategori</option>
              {kategoriOptions.map((kategori) => (
                <option key={kategori} value={kategori}>
                  {kategori}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jenis Transaksi *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="jenis"
                  value="setoran"
                  checked={formData.jenis === 'setoran'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Setoran (➕)
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="jenis"
                  value="penarikan"
                  checked={formData.jenis === 'penarikan'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Penarikan (➖)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nominal *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">Rp</span>
              <input
                type="number"
                name="nominal"
                value={formData.nominal}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Keterangan
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Koreksi transaksi..."
            />
          </div>

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
              {loading ? 'Menyimpan...' : 'Update Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransaksiModal;