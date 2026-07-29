import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { DarkModeProvider } from './context/DarkModeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AnggotaList from './components/AnggotaList';
import TransaksiForm from './components/TransaksiForm';
import TransaksiList from './components/TransaksiList';
import Sidebar from './components/Sidebar';

// Set default axios config
axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek token di localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <div className="text-center">
          <div className="text-4xl mb-4">🏦</div>
          <div className="text-gray-600 dark:text-gray-400">Memuat...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <DarkModeProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-300">
          <Sidebar user={user} onLogout={handleLogout} />
          <div className="ml-0 md:ml-64">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/anggota" element={<AnggotaList />} />
                <Route path="/transaksi" element={<TransaksiForm />} />
                <Route path="/riwayat" element={<TransaksiList />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;