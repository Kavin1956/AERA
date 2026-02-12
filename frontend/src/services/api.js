import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (username, password) =>
    api.post('/auth/login', { username, password })
};

// Issue API calls
// export const issueAPI = {
//   createIssue: (issueData) => api.post('/issues', issueData),
//   getAllIssues: () => api.get('/issues'),
//   assignIssue: (issueId, technicianId, technicianType) =>
//     api.put(`/issues/${issueId}/assign`, { assignedTechnician: technicianId, technicianType }),
//   completeIssue: (issueId, updateData = {}) => api.put(`/issues/${issueId}/complete`, updateData)
// };

export const issueAPI = {
  createIssue: (issueData) => api.post('/issues', issueData),

  getAllIssues: () => api.get('/issues'),

  assignIssue: (issueId, technicianId, technicianType) =>
    api.put(`/issues/${issueId}/assign`, {
      assignedTechnician: technicianId,
      technicianType
    }),

  completeIssue: (issueId, updateData = {}) =>
    api.put(`/issues/${issueId}/complete`, updateData),

  // ✅ ADD THIS LINE (NEW)
  updateIssueStatus: (issueId, data) =>
    api.put(`/issues/${issueId}/status`, data)
};


// // Technician API calls
// export const technicianAPI = {
//   getAssignedTasks: () => api.get('/technician/tasks'),
//   updateTaskStatus: (taskId, status, notes) =>
//     api.put(`/technician/tasks/${taskId}`, { status, notes })
// };

// Technician API calls
export const technicianAPI = {
  getAssignedTasks: () => api.get('/technician/tasks'),

  updateTaskStatus: (taskId, status, updateNotes) =>
    api.put(`/technician/tasks/${taskId}`, {
      status,
      updateNotes
    })
};


export default api;
