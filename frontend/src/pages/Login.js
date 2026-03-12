import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';
import { authAPI } from '../services/api';

const getLoginErrorMessage = (err) => {
  const status = err.response?.status;

  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return err.response?.data?.message || 'Login failed. Please check your credentials.';
  }

  if (
    err.code === 'ECONNABORTED' ||
    err.message?.includes('Network Error') ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return 'Backend is waking up on Render. Please wait a few seconds and try again.';
  }

  return err.response?.data?.message || 'Login failed due to a server issue. Please try again.';
};

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
      const response = await authAPI.login(username, password);
      const { token, role: userRole, username: userName, fullName, email } = response.data;
      
      // Store token and user info in sessionStorage (tab-specific, not shared across tabs)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userRole', userRole);
      sessionStorage.setItem('userName', userName);
      sessionStorage.setItem('userFullName', fullName || '');
      sessionStorage.setItem('userEmail', email || '');
      
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
      setError(getLoginErrorMessage(err));
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
