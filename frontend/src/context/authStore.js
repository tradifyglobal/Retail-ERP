import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuthenticated: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ isAuthenticated: true, user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ isAuthenticated: false, user: null, token: null });
  },

  setUser: (user) => set({ user })
}));

export default useAuthStore;
