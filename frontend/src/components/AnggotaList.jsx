import React, { useState, useEffect } from "react";
import axios from "axios";
import AnggotaForm from "./AnggotaForm";

const AnggotaList = () => {
  const [anggota, setAnggota] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState(null);
  const [selectedAnggota, setSelectedAnggota] = useState(null);
  const [transaksiDetail, setTransaksiDetail] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchAnggota();
  }, []);

  const fetchAnggota = async () => {
    try {
      const response = await axios.get("/api/anggota");
      setAnggota(response.data);
    } catch (error) {
      console.error("Error fetching anggota:", error);
      alert("Gagal mengambil data anggota");
    }
  };

  const fetchTransaksiByAnggota = async (anggotaId) => {
    try {
      const response = await axios.get(`/api/transaksi/anggota/${anggotaId}`);
      setTransaksiDetail(response.data);
    } catch (error) {
      console.error("Error fetching transaksi:", error);
      alert("Gagal mengambil riwayat transaksi");
    }
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus anggota "${nama}"?`)) {
      try {
        await axios.delete(`/api/anggota/${id}`);
        fetchAnggota();
        alert("Anggota berhasil dihapus");
      } catch (error) {
        console.error("Error deleting anggota:", error);
        alert("Gagal menghapus anggota");
      }
    }
  };

  const handleViewDetail = async (anggota) => {
    setSelectedAnggota(anggota);
    await fetchTransaksiByAnggota(anggota.id);
    setShowDetail(true);
  };

  const handleEdit = (anggota) => {
    setEditingAnggota(anggota);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAnggota(null);
    fetchAnggota();
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Daftar Anggota</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
          <span>+</span> Tambah Anggota
        </button>
      </div>

      {/* Tabel Anggota - Responsive dengan horizontal scroll */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <div className="min-w-[500px] sm:min-w-full">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Anggota</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Saldo</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                {anggota.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{item.id}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.nama}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">{formatRupiah(item.total_saldo || 0)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => handleViewDetail(item)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">
                        Detail
                      </button>
                      <button onClick={() => handleEdit(item)} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item.id, item.nama)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {anggota.length === 0 && <div className="text-center py-8 text-gray-500 dark:text-gray-400">Belum ada anggota. Silakan tambah anggota baru.</div>}
      </div>

      {/* Modal Form Anggota */}
      {showForm && <AnggotaForm anggota={editingAnggota} onClose={handleFormClose} />}

      {/* Modal Detail Anggota - Responsive */}
      {showDetail && selectedAnggota && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="sticky top-0 bg-white dark:bg-dark-card border-b dark:border-gray-700 px-4 sm:px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Detail Anggota</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{selectedAnggota.nama}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl">
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Saldo</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatRupiah(selectedAnggota.total_saldo || 0)}</p>
              </div>

              <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-800 dark:text-white">Riwayat Transaksi</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {transaksiDetail.map((transaksi) => (
                  <div key={transaksi.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2 sm:gap-0">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{transaksi.kategori}</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{transaksi.keterangan}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{transaksi.tanggal}</p>
                    </div>
                    <div className={`font-bold text-sm sm:text-base ${transaksi.jenis === "setoran" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {transaksi.jenis === "setoran" ? "+" : "-"} {formatRupiah(transaksi.nominal)}
                    </div>
                  </div>
                ))}
                {transaksiDetail.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">Belum ada transaksi</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnggotaList;
