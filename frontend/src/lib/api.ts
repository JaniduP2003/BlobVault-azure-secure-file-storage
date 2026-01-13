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
  
  // Move file to folder
  moveFile: (id: string, folderId: number | null) => 
    api.put(`/documents/${id}/move`, { folderId }),
  
  // Recent files
  getRecentFiles: () => api.get('/documents/recent'),
}

export const foldersApi = {
  // Get all folders (optionally filtered by parent)
  getFolders: (parentId?: number | null) => 
    api.get('/folders', { params: parentId !== undefined ? { parentId } : {} }),
  
  // Get specific folder with contents
  getFolder: (id: number) => api.get(`/folders/${id}`),
  
  // Create folder
  createFolder: (data: { name: string; parentFolderId?: number | null; color?: string }) => 
    api.post('/folders', data),
  
  // Update folder (rename, change color, move)
  updateFolder: (id: number, data: { name?: string; color?: string; parentFolderId?: number | null }) => 
    api.put(`/folders/${id}`, data),
  
  // Delete folder
  deleteFolder: (id: number) => api.delete(`/folders/${id}`),
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

