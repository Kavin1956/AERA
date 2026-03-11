import axios from 'axios';

const isLocalFrontend =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (isLocalFrontend ? 'http://localhost:5000/api' : 'https://aera-4y8m.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000 // 15 second timeout for Render backend
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableAuthError = (error) => {
  if (!error) return false;

  if (error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
    return true;
  }

  const status = error.response?.status;
  return status === 502 || status === 503 || status === 504;
};

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
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
  login: async (username, password) => {
    const requestBody = { username, password };

    try {
      return await api.post('/auth/login', requestBody, {
        timeout: 35000
      });
    } catch (error) {
      if (!isRetriableAuthError(error)) {
        throw error;
      }

      await delay(2500);

      return api.post('/auth/login', requestBody, {
        timeout: 35000
      });
    }
  }
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

  updateIssueStatus: (issueId, data) =>
    api.put(`/issues/${issueId}/status`, data),

  deleteIssue: (issueId) =>
    api.delete(`/issues/${issueId}`),

  sendWarningAlert: (issueId, warningData) =>
    api.post(`/issues/${issueId}/send-warning`, warningData)
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
