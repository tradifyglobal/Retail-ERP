import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiLogOut, FiSettings } from 'react-icons/fi';
import useAuthStore from '../context/authStore';

const Header = ({ onMenuClick, onLogout }) => {
  const { user } = useAuthStore();
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <header className="bg-white shadow-md px-4 md:px-6 py-4 flex items-center justify-between">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        <FiMenu size={24} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>

        {/* User Info */}
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-sm font-medium text-gray-800">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
