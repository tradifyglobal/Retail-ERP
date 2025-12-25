import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiLayout
} from 'react-icons/fi';
import useSettingsStore from '../context/settingsStore';

const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { primaryColor, logo } = useSettingsStore();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/pos', label: 'POS', icon: FiShoppingCart },
    { path: '/inventory', label: 'Inventory', icon: FiPackage },
    { path: '/orders', label: 'Orders', icon: FiLayout },
    { path: '/users', label: 'Users', icon: FiUsers },
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
    { path: '/branding', label: 'Branding', icon: FiLayout },
    { path: '/settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        {logo ? (
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        ) : (
          <h1 className="text-2xl font-bold text-gray-800">
            {t('app.title')}
          </h1>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-r-4'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={isActive ? { borderColor: primaryColor } : {}}
            >
              <Icon size={20} />
              <span>{t(`app.${item.label.toLowerCase()}`)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
