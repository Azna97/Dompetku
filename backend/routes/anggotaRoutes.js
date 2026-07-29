const express = require('express');
const router = express.Router();
const anggotaController = require('../controllers/anggotaController');
const authController = require('../controllers/authController');

router.get('/', anggotaController.getAll);
router.get('/:id', anggotaController.getById);
router.post('/', anggotaController.create);
router.put('/:id', anggotaController.update);
router.delete('/:id', authController.isAdmin, anggotaController.delete);

module.exports = router;