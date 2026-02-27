import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/SignUp.css';
import { authAPI } from '../services/api';

function SignUp() {
  // const [formData, setFormData] = useState({
  //   fullName: '',
  //   email: '',
  //   username: '',
  //   password: '',
  //   confirmPassword: '',
  //   role: 'data_collector'
  // });

  const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'data_collector',
  technicianType: ''
});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.fullName || !formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role
      });

      setSuccess('Sign-up successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-up failed. Please try again.');
      console.error('Sign-up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">AERA</h1>
          <p className="signup-subtitle">Academic Environmental Risk Analyzer</p>
          <h2 className="signup-heading">Create Account</h2>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              id="role"
              name="role"
              className="form-input form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="data_collector">Data Collector</option>
            </select>
            <p className="info-text" style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
              Only Data Collectors can sign up. Technicians and Managers are pre-configured accounts.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="login-link">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>

      <div className="signup-footer">
        <p>&copy; 2026 Academic Environmental Risk Analyzer. All rights reserved.</p>
      </div>
    </div>
  );
}

export default SignUp;
