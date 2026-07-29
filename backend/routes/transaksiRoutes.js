const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');

router.get('/', transaksiController.getAll);
router.get('/:id', transaksiController.getById);
router.get('/anggota/:anggotaId', transaksiController.getByAnggota);
router.get('/latest', transaksiController.getLatest);
router.post('/', transaksiController.create);
router.put('/:id', transaksiController.update);
router.delete('/:id', transaksiController.delete);

module.exports = router;