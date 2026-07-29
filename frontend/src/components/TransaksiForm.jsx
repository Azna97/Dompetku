import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransaksiForm = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nominalPreview, setNominalPreview] = useState('');
  const [formData, setFormData] = useState({
    anggota_id: '',
    kategori: '',
    jenis: 'setoran',
    nominal: '',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: ''
  });
  const [anggota, setAnggota] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnggota();
    }
  }, [user]);

  const fetchAnggota = async () => {
    try {
      const response = await axios.get('/api/anggota');
      setAnggota(response.data);
    } catch (error) {
      console.error('Error fetching anggota:', error);
      alert('Gagal mengambil data anggota');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNominalChange = (e) => {
    let value = e.target.value;
    // Hilangkan semua titik yang sudah ada
    value = value.replace(/\./g, '');
    // Hanya angka
    value = value.replace(/[^0-9]/g, '');
    
    setFormData({
      ...formData,
      nominal: value
    });
    
    // Update preview dengan format ribuan
    if (value && parseInt(value) > 0) {
      setNominalPreview(parseInt(value).toLocaleString('id-ID'));
    } else {
      setNominalPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.anggota_id) {
      alert('Pilih anggota terlebih dahulu');
      return;
    }
    if (!formData.nominal || formData.nominal <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }

    setSaving(true);
    try {
      await axios.post('/api/transaksi', {
        ...formData,
        nominal: parseInt(formData.nominal)
      });
      alert('Transaksi berhasil disimpan');
      // Reset form
      setFormData({
        anggota_id: '',
        kategori: '',
        jenis: 'setoran',
        nominal: '',
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: ''
      });
      setNominalPreview('');
    } catch (error) {
      console.error('Error saving transaksi:', error);
      alert(error.response?.data?.error || 'Gagal menyimpan transaksi');
    } finally {
      setSaving(false);
    }
  };

  const kategoriOptions = ['Tabungan Pendidikan', 'Tabungan Darurat', 'Tabungan Qurban', 'Tabungan Hari Raya', 'Tabungan Lainnya'];

  // Jika masih loading
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Memuat...
      </div>
    );
  }

  // Jika bukan admin, tampilkan pesan akses ditolak
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Akses Ditolak</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Hanya admin yang dapat membuat transaksi baru.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Silakan hubungi administrator untuk melakukan transaksi.
        </p>
      </div>
    );
  }

  // Tampilkan form untuk admin
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Form Transaksi Baru</h1>
      
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 transition-colors duration-300">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih Anggota *
            </label>
            <select
              name="anggota_id"
              value={formData.anggota_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih Anggota</option>
              {anggota.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama}
                </option>
              ))}
            </select>
          </div>

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

          {/* Nominal dengan Preview Format Ribuan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nominal *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Input Nominal */}
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">Rp</span>
                <input
                  type="text"
                  name="nominal"
                  value={formData.nominal}
                  onChange={handleNominalChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  required
                />
              </div>
              
              {/* Preview Format Rupiah */}
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">Rp</span>
                <input
                  type="text"
                  value={nominalPreview}
                  readOnly
                  className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg cursor-default"
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              💡 Preview format ribuan akan muncul otomatis di sebelah kanan
            </p>
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
              placeholder="Contoh: Setoran bulan Januari, Penarikan untuk keperluan..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 font-semibold"
          >
            {saving ? 'Memproses...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransaksiForm;