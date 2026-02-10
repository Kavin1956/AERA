import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import DataCollector from './pages/DataCollector';
import Manager from './pages/Manager';
import Technician from './pages/Technician';
import './styles/App.css';

function App() {
  // Attempt to restore session from localStorage so page refresh doesn't log users out
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || null);

  // Ensure we don't keep an authenticated flag without token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && isAuthenticated) {
      // token missing -> clear auth
      setIsAuthenticated(false);
      setUserRole(null);
      setUserName(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    }
  }, []);

  const handleLogin = (username, role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(username);
    // Persist session so refresh keeps the user logged in
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
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
          element={isAuthenticated && userRole === 'data_collector' ? 
            <DataCollector userName={userName} onLogout={handleLogout} /> : 
            <Navigate to="/login" />} 
        />
        <Route 
          path="/manager" 
          element={isAuthenticated && userRole === 'manager' ? 
            <Manager userName={userName} onLogout={handleLogout} /> : 
            <Navigate to="/login" />} 
        />
        <Route 
          path="/technician" 
          element={isAuthenticated && userRole === 'technician' ? 
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
