const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sa_token');
  const headers = {
    ...options.headers
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if sending FormData (browser automatically sets multipart boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Handle unauthorized auto-logout
  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
  }

  // If response is raw binary/stream download (e.g. /download)
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    return response;
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json;
}

export default request;
