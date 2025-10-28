import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

console.log('🔧 API Configuration:', {
  API_URL,
  env: import.meta.env.VITE_API_URL,
  mode: import.meta.env.MODE
});

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add interceptor to include API key and auth token from localStorage
api.interceptors.request.use((config) => {
  console.log('📤 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`
  });
  
  // Add Gemini API key
  const apiKey = localStorage.getItem('gemini_api_key')
  if (apiKey) {
    config.headers['x-gemini-api-key'] = apiKey
  }
  
  // Add auth token
  const authToken = localStorage.getItem('auth_token')
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`
  }
  
  return config
}, (error) => {
  console.error('❌ Request Error:', error);
  return Promise.reject(error)
})

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Documents API
export const documentsAPI = {
  create: (data) => api.post('/documents', data),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/documents', { params }),
  getOne: (id) => api.get(`/documents/${id}`),
  process: (id) => api.post(`/documents/${id}/process`),
}

// Decisions API
export const decisionsAPI = {
  getAll: (params) => api.get('/decisions', { params }),
  getOne: (id) => api.get(`/decisions/${id}`),
}

// Search API
export const searchAPI = {
  search: (query, topK = 5) => api.get('/search', { params: { q: query, top_k: topK } }),
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  analyze: (id, data) => api.post(`/projects/${id}/analyze`, data),
}

export default api