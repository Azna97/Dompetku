import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditTransaksiModal from './EditTransaksiModal';

const TransaksiList = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    namaAnggota: '',
    kategori: '',
    startDate: '',
    endDate: ''
  });
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [editingTransaksi, setEditingTransaksi] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchTransaksi();
    fetchAnggota();
    
    // Get user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchTransaksi = async () => {
    try {
      const response = await axios.get('/api/transaksi');
      setTransaksi(response.data);
      setFilteredTransaksi(response.data);
      
      const categories = [...new Set(response.data.map(t => t.kategori).filter(Boolean))];
      setKategoriOptions(categories);
    } catch (error) {
      console.error('Error fetching transaksi:', error);
      alert('Gagal mengambil data transaksi');
    }
  };

  const fetchAnggota = async () => {
    try {
      const response = await axios.get('/api/anggota');
      setAnggota(response.data);
    } catch (error) {
      console.error('Error fetching anggota:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...transaksi];

    if (filters.namaAnggota) {
      filtered = filtered.filter(t => t.anggota_nama === filters.namaAnggota);
    }

    if (filters.kategori) {
      filtered = filtered.filter(t => t.kategori === filters.kategori);
    }

    if (filters.startDate) {
      filtered = filtered.filter(t => t.tanggal >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter(t => t.tanggal <= filters.endDate);
    }

    setFilteredTransaksi(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, transaksi]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const resetFilters = () => {
    setFilters({
      namaAnggota: '',
      kategori: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleEdit = (transaksi) => {
    setEditingTransaksi(transaksi);
    setShowEditModal(true);
  };

  const handleDelete = async (id, anggotaNama, nominal, jenis) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi ${jenis === 'setoran' ? '+' : '-'} Rp${nominal.toLocaleString()} untuk ${anggotaNama}?`)) {
      try {
        await axios.delete(`/api/transaksi/${id}`);
        alert('Transaksi berhasil dihapus');
        fetchTransaksi();
      } catch (error) {
        console.error('Error deleting transaksi:', error);
        alert(error.response?.data?.error || 'Gagal menghapus transaksi');
      }
    }
  };

  const handleEditSuccess = () => {
    fetchTransaksi();
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Riwayat Transaksi</h1>
        {!isAdmin && (
          <span className="text-sm text-gray-500 dark:text-gray-400">Hanya menampilkan transaksi Anda</span>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Filter Transaksi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Anggota
            </label>
            <select
              name="namaAnggota"
              value={filters.namaAnggota}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Anggota</option>
              {anggota.map((item) => (
                <option key={item.id} value={item.nama}>
                  {item.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategori
            </label>
            <select
              name="kategori"
              value={filters.kategori}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {kategoriOptions.map((kategori) => (
                <option key={kategori} value={kategori}>
                  {kategori}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Transaksi Table */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anggota</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategori</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jenis</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nominal</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Keterangan</th>
                  {isAdmin && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransaksi.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{item.tanggal}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.anggota_nama}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.kategori}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.jenis === 'setoran' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                      }`}>
                        {item.jenis === 'setoran' ? 'Setoran' : 'Penarikan'}
                      </span>
                    </td>
                    <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      item.jenis === 'setoran' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {item.jenis === 'setoran' ? '+' : '-'} {formatRupiah(item.nominal)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {item.keterangan || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.anggota_nama, item.nominal, item.jenis)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filteredTransaksi.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Tidak ada transaksi yang ditemukan
          </div>
        )}
      </div>

      {/* Modal Edit Transaksi */}
      {showEditModal && editingTransaksi && (
        <EditTransaksiModal
          transaksi={editingTransaksi}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaksi(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default TransaksiList;