/**
 * API Client Utility
 * Centralized HTTP client for all API requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Helper function to make API requests
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('fastbb_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * API endpoints object
 */
export const api = {
  auth: {
    login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    me: () => apiRequest('/auth/me'),
    requestReset: (email) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) }),
  },

  forums: {
    list: () => apiRequest('/forums'),
    get: (id) => apiRequest(`/forums/${id}`),
    create: (data) => apiRequest('/forums', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/forums/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/forums/${id}`, { method: 'DELETE' }),
    markRead: (id) => apiRequest(`/forums/${id}/mark-read`, { method: 'POST' }),
  },

  topics: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/topics?${query}`);
    },
    get: (id) => apiRequest(`/topics/${id}`),
    create: (data) => apiRequest('/topics', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/topics/${id}`, { method: 'DELETE' }),
    lock: (id) => apiRequest(`/topics/${id}/lock`, { method: 'POST' }),
    unlock: (id) => apiRequest(`/topics/${id}/unlock`, { method: 'POST' }),
    pin: (id) => apiRequest(`/topics/${id}/pin`, { method: 'POST' }),
    unpin: (id) => apiRequest(`/topics/${id}/unpin`, { method: 'POST' }),
    incrementViews: (id) => apiRequest(`/topics/${id}/views`, { method: 'POST' }),
  },

  posts: {
    get: (id) => apiRequest(`/posts/${id}`),
    create: (data) => apiRequest('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
  },

  search: {
    search: (query, type = 'all') => apiRequest(`/search?q=${encodeURIComponent(query)}&type=${type}`),
  },

  users: {
    get: (id) => apiRequest(`/users/${id}`),
    update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
    getTopics: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/users/${id}/topics?${query}`);
    },
    getPosts: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/users/${id}/posts?${query}`);
    },
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/users?${query}`);
    },
  },

  system: {
    stats: () => apiRequest('/system/stats'),
    config: () => apiRequest('/system/config'),
    clearCache: () => apiRequest('/system/cache/clear', { method: 'POST' }),
    health: () => apiRequest('/system/health'),
  },
};
