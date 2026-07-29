const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authController = require('./controllers/authController');

const anggotaRoutes = require('./routes/anggotaRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Public routes
app.post('/api/auth/login', authController.login);
app.put('/api/auth/change-password', authController.verifyToken, authController.changePassword);
app.get('/api/auth/me', authController.verifyToken, authController.getMe);

// Protected routes (semua perlu token)
app.use('/api/anggota', authController.verifyToken, anggotaRoutes);
app.use('/api/transaksi', authController.verifyToken, transaksiRoutes);
app.use('/api/dashboard', authController.verifyToken, dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Default admin: username=admin, password=admin123`);
});