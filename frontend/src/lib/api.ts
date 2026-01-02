import axios from 'axios'

// Base URL for your backend API
// Change this to match your backend URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API endpoints
export const documentsApi = {
  // Get all files
  getFiles: () => api.get('/api/documents'),
  
  // Upload file
  uploadFile: (formData: FormData) => 
    api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Download file
  downloadFile: (id: string) => 
    api.get(`/api/documents/download/${id}`, {
      responseType: 'blob',
    }),
  
  // Delete file
  deleteFile: (id: string) => api.delete(`/api/documents/${id}`),
  
  // Generate share link
  generateShareLink: (id: string, expiryMinutes: number) => 
    api.post(`/api/documents/${id}/share`, { expiryMinutes }),
  
  // Access shared file
  accessSharedFile: (token: string) => 
    api.get(`/api/documents/shared/${token}`),
}

export const authApi = {
  // Login
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
  
  // Register
  register: (email: string, password: string, fullName: string) => 
    api.post('/api/auth/register', { email, password, fullName }),
  
  // Logout
  logout: () => {
    localStorage.removeItem('token')
  },
}

export default api

