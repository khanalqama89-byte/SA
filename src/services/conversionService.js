import { request } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const conversionService = {
  async startConversion(toolSlug, sourceFileId, options = {}) {
    const res = await request('/conversions', {
      method: 'POST',
      body: JSON.stringify({
        toolSlug,
        sourceFileId,
        options
      })
    });
    return res.data;
  },

  async getJobStatus(jobId) {
    const res = await request(`/conversions/${jobId}/status`, { method: 'GET' });
    return res.data;
  },

  getDownloadUrl(jobId) {
    return `${BASE_URL}/conversions/${jobId}/download`;
  },

  async downloadResult(jobId, defaultFilename = 'converted_document') {
    const directUrl = `${BASE_URL}/conversions/${jobId}/download`;

    // On mobile devices, direct browser navigation is the most reliable download mechanism
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = directUrl;
      return;
    }

    try {
      const response = await fetch(directUrl, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      // Try extracting filename from Content-Disposition header
      let filename = defaultFilename;
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();
      }, 5000);
    } catch (err) {
      // Direct navigation fallback
      window.location.href = directUrl;
    }
  },

  async cancelJob(jobId) {
    const res = await request(`/conversions/${jobId}/cancel`, { method: 'POST' });
    return res.data;
  },

  async getHistory() {
    const res = await request('/history', { method: 'GET' });
    return res.data;
  },

  async deleteHistory(id) {
    const res = await request(`/history/${id}`, { method: 'DELETE' });
    return res.data;
  }
};

export default conversionService;
