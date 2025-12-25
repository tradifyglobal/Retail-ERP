import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSettingsStore from '../context/settingsStore';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, language, setLanguage, setTheme } = useSettingsStore();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: theme === 'dark',
    currency: 'USD'
  });

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        {t('app.settings')}
      </h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-6">
        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Language
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                i18n.language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                i18n.language === 'fr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Français
            </button>
          </div>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
            <option>USD ($)</option>
            <option>EUR (€)</option>
            <option>GBP (£)</option>
            <option>CAD (C$)</option>
          </select>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Notifications
            </label>
            <p className="text-sm text-gray-500">Receive order and system notifications</p>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
            className="w-6 h-6 cursor-pointer"
          />
        </div>

        {/* Version */}
        <div className="pt-6 border-t">
          <p className="text-sm text-gray-500">
            Version 1.0.0 • © 2024 Retail Store ERP
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
