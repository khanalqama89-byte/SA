import { request } from './api';

export const authService = {
  async register(name, email, password) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    return res.data;
  },

  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.data?.token) {
      localStorage.setItem('sa_token', res.data.token);
      localStorage.setItem('sa_user', JSON.stringify({
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      }));
    }
    return res.data;
  },

  async getMe() {
    const res = await request('/auth/me', { method: 'GET' });
    return res.data;
  },

  logout() {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
  },

  getStoredUser() {
    const userStr = localStorage.getItem('sa_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('sa_token');
  }
};

export default authService;
