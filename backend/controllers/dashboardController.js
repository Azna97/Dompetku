const TransaksiModel = require('../models/transaksiModel');
const AnggotaModel = require('../models/anggotaModel');

const dashboardController = {
  getSummary: async (req, res) => {
    try {
      let totalSaldo, statistikKategori, totalAnggota, transaksiTerbaru;

      if (req.user.role === 'anggota') {
        // Anggota: data khusus untuk anggota tersebut
        await new Promise((resolve) => {
          TransaksiModel.getByAnggota(req.user.anggota_id, (err, rows) => {
            totalSaldo = rows.reduce((sum, t) => {
              if (t.jenis === 'setoran') return sum + t.nominal;
              if (t.jenis === 'penarikan') return sum - t.nominal;
              return sum;
            }, 0);
            
            // Statistik kategori untuk anggota
            const kategoriMap = {};
            rows.forEach(t => {
              if (t.jenis === 'setoran') {
                kategoriMap[t.kategori] = (kategoriMap[t.kategori] || 0) + t.nominal;
              }
            });
            statistikKategori = Object.entries(kategoriMap).map(([kategori, total]) => ({ kategori, total }));
            
            transaksiTerbaru = rows.slice(0, 10);
            totalAnggota = 1;
            resolve();
          });
        });
      } else {
        // Admin: semua data
        await new Promise((resolve) => {
          TransaksiModel.getTotalSaldo((err, result) => {
            totalSaldo = result ? result.total : 0;
            resolve();
          });
        });

        await new Promise((resolve) => {
          TransaksiModel.getStatistikKategori((err, rows) => {
            statistikKategori = rows || [];
            resolve();
          });
        });

        await new Promise((resolve) => {
          AnggotaModel.getAll((err, rows) => {
            totalAnggota = rows ? rows.length : 0;
            resolve();
          });
        });

        await new Promise((resolve) => {
          TransaksiModel.getLatest(10, (err, rows) => {
            transaksiTerbaru = rows || [];
            resolve();
          });
        });
      }

      res.json({
        totalSaldo,
        statistikKategori,
        totalAnggota,
        transaksiTerbaru,
        userRole: req.user.role,
        userName: req.user.anggota_nama || req.user.username
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = dashboardController;