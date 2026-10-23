import { request } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const conversionService = {
  /**
   * Direct conversion: sends the file directly in a single request and returns the converted document immediately
   */
  async startDirectConversion(toolSlug, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('toolSlug', toolSlug);
    formData.append('options', JSON.stringify(options || {}));

    const res = await request('/conversions', {
      method: 'POST',
      body: formData
    });
    return res.data;
  },

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

  /**
   * Safe cross-platform document download:
   * Prefers in-memory base64 blob to avoid serverless multi-instance 404/403 errors on mobile.
   */
  async downloadResult(jobId, defaultFilename = 'converted_document', cachedBase64 = null, mimeType = null) {
    // 1. If we have the converted base64 data directly from the conversion response
    if (cachedBase64) {
      try {
        const byteCharacters = atob(cachedBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType || 'application/octet-stream' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();
        }, 3000);
        return;
      } catch (e) {
        console.warn('In-memory download failed, falling back to network fetch:', e);
      }
    }

    // 2. Network fetch fallback
    const directUrl = `${BASE_URL}/conversions/${jobId}/download`;
    try {
      const response = await fetch(directUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

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
      // Last-ditch trigger
      const a = document.createElement('a');
      a.href = directUrl;
      a.download = defaultFilename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
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
