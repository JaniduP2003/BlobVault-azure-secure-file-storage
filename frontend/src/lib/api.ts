import axios from 'axios'

// Base URL for your backend API
// Change this to match your backend URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'

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
  getFiles: () => api.get('/documents'),
  
  // Upload file
  uploadFile: (formData: FormData) => 
    api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Download file
  downloadFile: (id: string) => 
    api.get(`/documents/download/${id}`, {
      responseType: 'blob',
    }),
  
  // Delete file (soft delete - moves to trash)
  deleteFile: (id: string) => api.delete(`/documents/${id}`),
  
  // Generate share link
  generateShareLink: (id: string, expiryMinutes: number) => 
    api.post(`/documents/${id}/share`, { expiryMinutes }),
  
  // Access shared file
  accessSharedFile: (token: string) => 
    api.get(`/documents/shared/${token}`),
  
  // Trash operations
  getTrashedFiles: () => api.get('/documents/trash'),
  restoreFile: (id: string) => api.post(`/documents/${id}/restore`),
  permanentDelete: (id: string) => api.delete(`/documents/${id}/permanent`),
  emptyTrash: () => api.delete('/documents/trash/empty'),
  
  // Star operations
  toggleStar: (id: string) => api.post(`/documents/${id}/star`),
  getStarredFiles: () => api.get('/documents/starred'),
}

export const authApi = {
  // Login
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  // Register
  register: (email: string, password: string, fullName: string) => 
    api.post('/auth/register', { email, password, fullName }),
  
  // Logout
  logout: () => {
    localStorage.removeItem('token')
  },
}

export default api

