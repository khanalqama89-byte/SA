import { request } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const fileService = {
  uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', `${BASE_URL}/files/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          onProgress(percentCompleted);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data);
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const errResponse = JSON.parse(xhr.responseText);
            reject(new Error(errResponse.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    });
  },

  async getFileMetadata(id) {
    const res = await request(`/files/${id}`, { method: 'GET' });
    return res.data;
  },

  async deleteFile(id) {
    const res = await request(`/files/${id}`, { method: 'DELETE' });
    return res.data;
  }
};

export default fileService;
