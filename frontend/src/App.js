import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import DataCollector from './pages/DataCollector';
import Manager from './pages/Manager';
import Technician from './pages/Technician';
import './styles/App.css';

function App() {
  // Attempt to restore session from sessionStorage (tab-specific)
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('token') ? true : false);
  // eslint-disable-next-line no-unused-vars
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('userRole') || null);
  const [userName, setUserName] = useState(() => sessionStorage.getItem('userName') || null);

  // Ensure we don't keep an authenticated flag without token
  useEffect(() => {
    // Re-run this check whenever `isAuthenticated` changes so UI and sessionStorage stay in sync.
    const token = sessionStorage.getItem('token');
    if (!token && isAuthenticated) {
      // token missing -> clear auth
      setIsAuthenticated(false);
      setUserRole(null);
      setUserName(null);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
    }
  }, [isAuthenticated]);

  // Safety: remove any leftover client-side "issues" cache so data is persisted only to the server
  useEffect(() => {
    if (localStorage.getItem('issues')) {
      console.warn('Removing stale localStorage key: issues — using server persistence only');
      localStorage.removeItem('issues');
    }
  }, []);

  const handleLogin = (username, role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(username);
    // Persist session - use sessionStorage for all data (tab-specific, not shared across tabs)
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userName', username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    // Clear all session data from this tab
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/signup" 
          element={<SignUp />} 
        />
        <Route 
          path="/login" 
          element={<Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/data-collector" 
          element={isAuthenticated ? 
            <DataCollector userName={userName} onLogout={handleLogout} /> : 
            <Navigate to="/login" />} 
        />
        <Route 
          path="/manager" 
          element={isAuthenticated ? 
            <Manager userName={userName} onLogout={handleLogout} /> : 
            <Navigate to="/login" />} 
        />
        <Route 
          path="/technician" 
          element={isAuthenticated ? 
            <Technician userName={userName} onLogout={handleLogout} /> : 
            <Navigate to="/login" />} 
        />
        {/* Root always shows Sign Up / Login so visitors choose action first */}
        <Route path="/" element={<Navigate to="/signup" />} />
      </Routes>
    </Router>
  );
}

export default App;
