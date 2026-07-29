import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import Settings from './Settings';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'anggota'] },
  { path: '/anggota', label: 'Daftar Anggota', icon: '👥', roles: ['admin'] },
  { path: '/transaksi', label: 'Transaksi Baru', icon: '💰', roles: ['admin'] }, // Hanya admin
  { path: '/riwayat', label: 'Riwayat', icon: '📜', roles: ['admin', 'anggota'] },
];

  // Filter menu berdasarkan role
  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  // Mobile view - Bottom Navigation
  if (isMobile) {
    return (
      <>
        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50">
          <div className="flex justify-around items-center h-16">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-all duration-200
                  ${location.pathname === item.path
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
            
            <button
              onClick={handleOpenSettings}
              className="flex flex-col items-center justify-center px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <span className="text-2xl">⚙️</span>
              <span className="text-xs mt-1">Setting</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="flex flex-col items-center justify-center px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <span className="text-2xl">{isDarkMode ? '☀️' : '🌙'}</span>
              <span className="text-xs mt-1">Mode</span>
            </button>
          </div>
        </nav>
        <div className="pb-16"></div>

        {/* Modal Settings */}
        {showSettings && (
          <Settings user={user} onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  // Desktop view - Sidebar
  return (
    <>
      <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-800 to-blue-900 dark:from-gray-900 dark:to-gray-800 text-white shadow-xl z-50">
        {/* Logo */}
        <div className="p-6 border-b border-blue-700 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-3xl bg-white bg-opacity-20 p-2 rounded-xl">
              🏦
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-wide">TabunganKu</h1>
              <p className="text-xs text-blue-300 dark:text-gray-400">v2.0 with Auth</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-blue-700 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl">
              {user?.role === 'admin' ? '👑' : '👤'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm truncate">{user?.anggota_nama || user?.username}</p>
              <p className="text-xs text-blue-300 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="mt-4 px-4">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200
                ${location.pathname === item.path
                  ? 'bg-white bg-opacity-20 text-white shadow-md'
                  : 'hover:bg-white hover:bg-opacity-10'
                }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {location.pathname === item.path && (
                <div className="ml-auto w-1 h-8 bg-white rounded-full"></div>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer - Settings, Dark Mode, Logout */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="p-4 border-t border-blue-700 dark:border-gray-700">
            {/* Settings Button */}
            <button
              onClick={handleOpenSettings}
              className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 mb-2"
            >
              <span className="text-2xl">⚙️</span>
              <span className="font-medium">Pengaturan</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 mb-2"
            >
              <span className="text-2xl">{isDarkMode ? '☀️' : '🌙'}</span>
              <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg hover:bg-red-600 hover:bg-opacity-50 transition-all duration-200"
            >
              <span className="text-2xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
          
          <div className="p-4 border-t border-blue-700 dark:border-gray-700">
            <div className="text-xs text-blue-300 dark:text-gray-400 text-center">
              © 2024 TabunganKu
            </div>
          </div>
        </div>
      </aside>

      {/* Modal Settings */}
      {showSettings && (
        <Settings user={user} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default Sidebar;