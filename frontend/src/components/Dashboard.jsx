import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalSaldo: 0,
    totalAnggota: 0,
    statistikKategori: [],
    transaksiTerbaru: []
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/dashboard/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      
      {/* Cards - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total Saldo</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(summary.totalSaldo)}</p>
            </div>
            <div className="text-3xl sm:text-4xl">💰</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total Anggota</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalAnggota}</p>
            </div>
            <div className="text-3xl sm:text-4xl">👥</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total Kategori</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.statistikKategori.length}</p>
            </div>
            <div className="text-3xl sm:text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Pie Chart & Recent Transactions - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Statistik Kategori</h2>
          <div className="w-full h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.statistikKategori}
                  dataKey="total"
                  nameKey="kategori"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={window.innerWidth > 640}
                >
                  {summary.statistikKategori.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {summary.statistikKategori.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Belum ada data kategori</p>
          )}
        </div>

        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Aktivitas Terbaru</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {summary.transaksiTerbaru.map((transaksi) => (
              <div key={transaksi.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate">{transaksi.anggota_nama}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{transaksi.kategori} - {transaksi.keterangan}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{transaksi.tanggal}</p>
                </div>
                <div className={`font-bold text-sm sm:text-base ml-2 ${transaksi.jenis === 'setoran' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {transaksi.jenis === 'setoran' ? '+' : '-'} {formatRupiah(transaksi.nominal)}
                </div>
              </div>
            ))}
            {summary.transaksiTerbaru.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">Belum ada transaksi</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;