// Base API Client

const BASE_URL = '/api';

/**
 * Core API fetch wrapper
 */
async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include', // Important: preserves session cookie
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const config = { ...defaultOptions, ...options };

  // Merge headers if provided
  if (options.headers) {
    config.headers = { ...defaultOptions.headers, ...options.headers };
  }

  // Stringify body if it's an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      throw new Error(data.message || 'An error occurred while fetching data');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// API Export Methods
export const api = {
  get: (endpoint) => apiClient(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiClient(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiClient(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => apiClient(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => apiClient(endpoint, { method: 'DELETE' })
};
