import api from './api';

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (data) =>
    api.post('/auth/register', data),

  verify: () =>
    api.get('/auth/verify')
};

export const userService = {
  getAll: () =>
    api.get('/users'),

  getById: (id) =>
    api.get(`/users/${id}`),

  update: (id, data) =>
    api.put(`/users/${id}`, data),

  delete: (id) =>
    api.delete(`/users/${id}`)
};

export const inventoryService = {
  getAll: () =>
    api.get('/inventory'),

  create: (data) =>
    api.post('/inventory', data),

  update: (id, data) =>
    api.put(`/inventory/${id}`, data),

  delete: (id) =>
    api.delete(`/inventory/${id}`)
};

export const posService = {
  getAll: () =>
    api.get('/pos'),

  createSale: (data) =>
    api.post('/pos', data)
};

export const orderService = {
  getAll: () =>
    api.get('/orders'),

  create: (data) =>
    api.post('/orders', data),

  updateStatus: (id, status) =>
    api.put(`/orders/${id}/status`, { status })
};

export const brandingService = {
  get: (storeId) =>
    api.get(`/branding/${storeId}`),

  update: (storeId, data) =>
    api.post(`/branding/${storeId}`, data)
};

export const reportService = {
  getSalesReport: (startDate, endDate) =>
    api.get('/reports/sales', { params: { startDate, endDate } }),

  getOrdersReport: (status) =>
    api.get('/reports/orders', { params: { status } })
};
