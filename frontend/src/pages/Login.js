import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';
import { authAPI } from '../services/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('data_collector');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(username, password, role);
      const { token, role: userRole, username: userName } = response.data;
      
      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userName', userName);
      localStorage.setItem('isAuthenticated', 'true');
      
      onLogin(userName, userRole);
      
      // Navigate to appropriate role page
      if (userRole === 'data_collector') {
        navigate('/data-collector');
      } else if (userRole === 'manager') {
        navigate('/manager');
      } else if (userRole === 'technician') {
        navigate('/technician');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">AERA</h1>
          <p className="login-subtitle">Academic Environmental Risk Analyzer</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              id="role"
              className="form-input form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="data_collector">Data Collector</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-credentials">
          <p className="demo-title">Demo Credentials:</p>
          <p><strong>Username:</strong> demo | <strong>Password:</strong> demo123</p>
        </div>

        <div className="signup-link">
          <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
        </div>
      </div>

      <div className="login-footer">
        <p>&copy; 2026 Academic Environmental Risk Analyzer. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Login;
