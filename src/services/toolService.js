import { request } from './api';

export const toolService = {
  async getTools() {
    const res = await request('/tools', { method: 'GET' });
    return res.data;
  },

  async getTool(slug) {
    const res = await request(`/tools/${slug}`, { method: 'GET' });
    return res.data;
  },

  async adminGetStats() {
    const res = await request('/admin/stats', { method: 'GET' });
    return res.data;
  },

  async adminGetJobs() {
    const res = await request('/admin/jobs', { method: 'GET' });
    return res.data;
  },

  async adminGetUsers() {
    const res = await request('/admin/users', { method: 'GET' });
    return res.data;
  },

  async adminToggleTool(id, enabled) {
    const res = await request(`/admin/tools/${id}/toggle?enabled=${enabled}`, {
      method: 'PATCH'
    });
    return res.data;
  }
};

export default toolService;
