import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ userName, role, onLogout }) {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const fullName = sessionStorage.getItem('userFullName') || userName || sessionStorage.getItem('userName') || 'User';
  const email = sessionStorage.getItem('userEmail') || 'Not provided';
  const displayRole = String(role || sessionStorage.getItem('userRole') || 'User');
  const avatarLetter = useMemo(() => fullName.trim().charAt(0).toUpperCase() || 'U', [fullName]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
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
          <div className="profile-menu-wrapper" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
            >
              <span className="profile-trigger-avatar">{avatarLetter}</span>
              <span className="profile-trigger-text">{fullName}</span>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar-large">{avatarLetter}</div>
                  <button
                    type="button"
                    className="profile-close-btn"
                    onClick={() => setIsProfileOpen(false)}
                    aria-label="Close profile menu"
                  >
                    X
                  </button>
                  <div className="profile-header-text">
                    <h3>{fullName.toUpperCase()}</h3>
                    <p>{displayRole.toUpperCase()}</p>
                  </div>
                </div>

                <div className="profile-details">
                  <p><strong>Name:</strong> {fullName}</p>
                  <p><strong>Email:</strong> {email}</p>
                </div>

                <div className="profile-dropdown-footer">
                  <button type="button" className="profile-signout-btn" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
