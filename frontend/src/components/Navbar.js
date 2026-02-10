import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ userName, role, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1 className="navbar-title">AERA</h1>
          <p className="navbar-subtitle">Environmental Risk Analyzer</p>
        </div>

        <div className="navbar-middle">
          <span className="navbar-role">{role}</span>
        </div>

        <div className="navbar-right">
          <div className="user-info">
            <span className="username">{userName}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
