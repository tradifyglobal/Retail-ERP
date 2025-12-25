import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  language: localStorage.getItem('language') || 'en',
  primaryColor: localStorage.getItem('primaryColor') || '#1976d2',
  logo: localStorage.getItem('logo') || null,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  setLanguage: (language) => {
    localStorage.setItem('language', language);
    set({ language });
  },

  setPrimaryColor: (color) => {
    localStorage.setItem('primaryColor', color);
    set({ primaryColor: color });
  },

  setLogo: (logo) => {
    localStorage.setItem('logo', logo);
    set({ logo });
  }
}));

export default useSettingsStore;
