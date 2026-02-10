import React, { useState, useEffect } from 'react';
import '../styles/Manager.css';
import Navbar from '../components/Navbar';
import { issueAPI } from '../services/api';

function Manager({ userName, onLogout }) {
  // Available technicians by type
  const techniciansDatabase = {
    'Water Management': ['Tech-WM-01', 'Tech-WM-02', 'Tech-WM-03'],
    'Electricity': ['Tech-EL-01', 'Tech-EL-02', 'Tech-EL-03'],
    'Cleaning': ['Tech-CL-01', 'Tech-CL-02', 'Tech-CL-03'],
    'Others': ['Tech-OTH-01', 'Tech-OTH-02']
  };

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTechnicianType, setSelectedTechnicianType] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [analyticsData, setAnalyticsData] = useState({});

  // Fetch issues from backend on mount and auto-refresh every 3 seconds
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await issueAPI.getAllIssues();
        console.log('📥 Issues loaded in Manager:', response.data?.length, 'issues');
        setIssues(response.data || []);
        setError('');
      } catch (err) {
        console.error('❌ Fetch issues error:', err.response?.data || err.message);
        setError('Failed to load issues');
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
    
    // Refresh every 3 seconds to show new submissions from Data Collectors
    const interval = setInterval(fetchIssues, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-assign next available technician of selected type
  const getNextAvailableTechnician = (techType) => {
    const technicians = techniciansDatabase[techType] || [];
    // Simple round-robin: just take the first one (in real system, check availability)
    return technicians[0] || `${techType}-Tech`;
  };

  // Auto-check for alerts every minute
  useEffect(() => {
    const alertInterval = setInterval(() => {
      setIssues(prevIssues => {
        const updatedIssues = prevIssues.map(issue => {
          if (issue.status === 'submitted') {
            const hoursPassed = (new Date() - new Date(issue.timestamps?.submitted)) / (1000 * 60 * 60);
            if (hoursPassed >= 1 && !issue.alerts?.includes('responded')) {
              return {
                ...issue,
                alerts: [...(issue.alerts || []), 'responded'],
                responseAlert: true
              };
            }
          }
          
          if (issue.status === 'assigned') {
            const hoursPassed = (new Date() - new Date(issue.timestamps?.submitted)) / (1000 * 60 * 60);
            if (hoursPassed >= 5 && !issue.alerts?.includes('solved')) {
              return {
                ...issue,
                alerts: [...(issue.alerts || []), 'solved'],
                solveAlert: true
              };
            }
          }
          
          return issue;
        });
        return updatedIssues;
      });
    }, 60000); // Check every minute

    return () => clearInterval(alertInterval);
  }, []);

  // Calculate analytics
  useEffect(() => {
    const submitted = issues.filter(i => i.status === 'submitted').length;
    const assigned = issues.filter(i => i.status === 'assigned').length;
    const completed = issues.filter(i => i.status === 'completed').length;
    const total = issues.length;

    // Weekly analysis - issues from last 7 days
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const weeklyIssues = issues.filter(i => i.submittedTimestamp >= sevenDaysAgo);

    setAnalyticsData({
      submitted,
      assigned,
      completed,
      total,
      weeklyTotal: weeklyIssues.length,
      weeklyByPriority: {
        1: weeklyIssues.filter(i => i.priority === 1).length,
        2: weeklyIssues.filter(i => i.priority === 2).length,
        3: weeklyIssues.filter(i => i.priority === 3).length,
        4: weeklyIssues.filter(i => i.priority === 4).length,
        5: weeklyIssues.filter(i => i.priority === 5).length
      }
    });
  }, [issues]);

  const handleAssignTechnician = async (issueId) => {
    if (!selectedTechnicianType.trim()) {
      alert('Please select a technician type');
      return;
    }

    const assignedTechnician = getNextAvailableTechnician(selectedTechnicianType);

    try {
      // Call backend API to assign technician
      const response = await issueAPI.assignIssue(issueId, assignedTechnician, selectedTechnicianType);
      console.log('✅ Assign response:', response.data);
      
      // Update local state
      setIssues(issues.map(i =>
        i._id === issueId ? { 
          ...response.data,
          assignedTechnicianType: selectedTechnicianType
        } : i
      ));

      alert(`Issue assigned to ${assignedTechnician}\nTechnician Type: ${selectedTechnicianType}`);
      setSelectedTechnicianType('');
      setShowDetails(false);
    } catch (err) {
      console.error('❌ Assign technician error:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.details || err.response?.data?.message || err.message;
      alert(`Failed to assign technician: ${errorMsg}`);
    }
  };

  const handleCompleteIssue = async (issueId) => {
    try {
      // Call backend API to complete issue
      const response = await issueAPI.completeIssue(issueId);
      
      // Update local state
      setIssues(issues.map(i =>
        i._id === issueId ? response.data : i
      ));
      
      alert('Issue marked as completed!');
      setShowDetails(false);
    } catch (err) {
      console.error('Complete issue error:', err);
      alert('Failed to mark issue as completed. Please try again.');
    }
  };

  const sendWarningAlert = async (issueId) => {
    try {
      setIssues(issues.map(i =>
        i._id === issueId ? { 
          ...i, 
          alerts: [...(i.alerts || []), 'warning'],
          warningAlert: true
        } : i
      ));
      alert('Warning alert sent to technician!');
    } catch (err) {
      console.error('Send warning error:', err);
    }
  };

  const getFilteredIssues = () => {
    let filtered = issues.filter(i => i.status !== 'completed');
    
    if (filterStatus === 'assigned') {
      filtered = filtered.filter(issue => issue.status === 'assigned');
    } else if (filterStatus === 'submitted') {
      filtered = filtered.filter(issue => issue.status === 'submitted');
    }
    
    return filtered;
  };

  const getCompletedIssues = () => {
    return issues.filter(i => i.status === 'completed');
  };

  const currentTabIssues = activeTab === 'current' ? getFilteredIssues() : null;
  const completedTabIssues = activeTab === 'history' ? getCompletedIssues() : null;

  return (
    <div className="manager-container">
      <Navbar userName={userName} role="Manager" onLogout={onLogout} />

      <div className="manager-main">
        <div className="manager-header">
          <h2>Manager Dashboard</h2>
          <p>Review, analyze, and assign environmental issues to technicians</p>
        </div>

        <div className="manager-content">
          {loading && <div className="loading-spinner">Loading issues...</div>}
          {error && <div className="error-message">{error}</div>}
          
          <div className="dashboard-stats">
            <div className="stat-card">
              <h4>Total Issues</h4>
              <p className="stat-number">{analyticsData.total}</p>
            </div>
            <div className="stat-card">
              <h4>New Issues</h4>
              <p className="stat-number">{analyticsData.submitted}</p>
            </div>
            <div className="stat-card">
              <h4>In Progress</h4>
              <p className="stat-number">{analyticsData.assigned}</p>
            </div>
            <div className="stat-card">
              <h4>Solved Issues</h4>
              <p className="stat-number">{analyticsData.completed}</p>
            </div>
          </div>

          {/* Weekly Analysis */}
          <div className="weekly-analysis">
            <h3>Weekly Analysis (Last 7 Days)</h3>
            <div className="analysis-cards">
              <div className="analysis-card">
                <p className="label">Total This Week</p>
                <p className="value">{analyticsData.weeklyTotal}</p>
              </div>
              <div className="analysis-card priority-1">
                <p className="label">🚨 Water Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[1] || 0}</p>
              </div>
              <div className="analysis-card priority-2">
                <p className="label">📽️ Projector Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[2] || 0}</p>
              </div>
              <div className="analysis-card priority-3">
                <p className="label">⚡ Electricity Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[3] || 0}</p>
              </div>
              <div className="analysis-card priority-4">
                <p className="label">🧹 Cleaning Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[4] || 0}</p>
              </div>
              <div className="analysis-card priority-5">
                <p className="label">📌 Others</p>
                <p className="value">{analyticsData.weeklyByPriority?.[5] || 0}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="manager-tabs">
            <button
              className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
              onClick={() => setActiveTab('current')}
            >
              Current Issues
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Issues History
            </button>
          </div>

          {/* Current Issues Tab */}
          {activeTab === 'current' && (
            <>
              <div className="manager-controls">
                <div className="filter-section">
                  <label>Filter by Status:</label>
                  <div className="filter-buttons">
                    <button
                      className={filterStatus === 'all' ? 'active' : ''}
                      onClick={() => setFilterStatus('all')}
                    >
                      All Issues
                    </button>
                    <button
                      className={filterStatus === 'submitted' ? 'active' : ''}
                      onClick={() => setFilterStatus('submitted')}
                    >
                      New Issues
                    </button>
                    <button
                      className={filterStatus === 'assigned' ? 'active' : ''}
                      onClick={() => setFilterStatus('assigned')}
                    >
                      Assigned
                    </button>
                  </div>
                </div>
              </div>

              <div className="issues-table-container">
                {currentTabIssues?.length === 0 ? (
                  <div className="empty-state">
                    <p>No issues in this status</p>
                  </div>
                ) : (
                  <table className="issues-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Location</th>
                        <th>User</th>
                        <th>Type</th>
                        <th>Priority</th>
                        <th>Tech Type</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTabIssues?.map(issue => (
                        <tr key={issue._id} className={`issue-row status-${issue.status} ${issue.responseAlert ? 'alert-response' : ''} ${issue.solveAlert ? 'alert-solve' : ''}`}>
                          <td>#{issue._id}</td>
                          <td>
                            Block {issue.block}, Floor {issue.floor}, Room {issue.roomNumber}
                          </td>
                          <td>{issue.name || issue.submittedBy?.username || 'Unknown'}</td>
                          <td>{issue.locationCategory}</td>
                          <td>
                            <span className={`priority-badge priority-${issue.priority}`}>
                              P{issue.priority}
                            </span>
                          </td>
                          <td>
                            <span className="tech-badge">{issue.technicianType || 'Pending'}</span>
                          </td>
                          <td>{issue.assignedTechnician?.username || 'Unassigned'}</td>
                          <td>
                            <span className={`status-badge status-${issue.status}`}>
                              {issue.status === 'submitted' ? 'New' : issue.status === 'assigned' ? 'In Progress' : issue.status}
                            </span>
                            {issue.responseAlert && <span className="alert-badge">⚠️ No Response</span>}
                            {issue.solveAlert && <span className="alert-badge solve">🚨 Not Solved</span>}
                          </td>
                          <td>{new Date(issue.timestamps?.submitted).toLocaleString()}</td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() => {
                                setSelectedIssue(issue);
                                setShowDetails(true);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="issues-table-container">
              {completedTabIssues?.length === 0 ? (
                <div className="empty-state">
                  <p>No completed issues yet</p>
                </div>
              ) : (
                <table className="issues-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Location</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Completed</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTabIssues?.map(issue => (
                      <tr key={issue._id} className="issue-row status-completed">
                        <td>#{issue._id}</td>
                        <td>
                          Block {issue.block}, Floor {issue.floor}, Room {issue.roomNumber}
                        </td>
                        <td>{issue.name || issue.submittedBy?.username || 'Unknown'}</td>
                        <td>{issue.locationCategory}</td>
                        <td>
                          <span className="priority-badge">{issue.priority || 'medium'}</span>
                        </td>
                        <td>
                          <span className={`status-badge status-completed`}>
                            Completed
                          </span>
                        </td>
                        <td>{new Date(issue.timestamps?.submitted).toLocaleString()}</td>
                        <td>{new Date(issue.timestamps?.completed).toLocaleString()}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowDetails(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issue Details Modal */}
      {showDetails && selectedIssue && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Issue Details & Analysis</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="issue-details">
                <div className="detail-section">
                  <h4>Reporter Information</h4>
                  <p><strong>Name:</strong> {selectedIssue.name || selectedIssue.submittedBy?.fullName || selectedIssue.submittedBy?.username || 'Unknown'}</p>
                  <p><strong>Email:</strong> {selectedIssue.submittedBy?.email || 'Not provided'}</p>
                  <p><strong>Type:</strong> {selectedIssue.userType}</p>
                  {selectedIssue.rollNumber && <p><strong>Roll Number:</strong> {selectedIssue.rollNumber}</p>}
                  {selectedIssue.facultyId && <p><strong>Faculty ID:</strong> {selectedIssue.facultyId}</p>}
                  <p><strong>Department:</strong> {selectedIssue.department || 'Not provided'}</p>
                </div>

                <div className="detail-section">
                  <h4>Location Details</h4>
                  <p><strong>Block:</strong> {selectedIssue.block}</p>
                  <p><strong>Floor:</strong> {selectedIssue.floor}</p>
                  <p><strong>Room Number:</strong> {selectedIssue.roomNumber}</p>
                  <p><strong>Location Type:</strong> {selectedIssue.locationCategory}</p>
                </div>

                <div className="detail-section">
                  <h4>Issue Details</h4>
                  <p><strong>Priority Level:</strong> <span className={`priority-badge priority-${selectedIssue.priority}`}>P{selectedIssue.priority}</span></p>
                  <p><strong>Problem Severity:</strong> <span className={`severity-badge severity-${selectedIssue.problemLevel?.toLowerCase()}`}>{selectedIssue.problemLevel || 'Not assessed'}</span></p>
                  <p><strong>Technician Type Needed:</strong> {selectedIssue.technicianType || 'Not assigned'}</p>
                  <p><strong>Status:</strong> {selectedIssue.status}</p>
                  {selectedIssue.assignedTechnician && <p><strong>Assigned To:</strong> {selectedIssue.assignedTechnician?.fullName || selectedIssue.assignedTechnician?.username || 'Unassigned'}</p>}
                </div>

                <div className="detail-section">
                  <h4>Environmental Conditions</h4>
                  {selectedIssue.data && Object.entries(selectedIssue.data)
                    .filter(([key]) => key !== 'otherSuggestions' && key !== 'name')
                    .map(([key, value]) => {
                      // Skip null, undefined, or empty values
                      if (value === null || value === undefined || value === '') return null;
                      
                      // If value is an object, try to extract a readable property
                      let displayValue = value;
                      if (typeof value === 'object') {
                        displayValue = value?.name || value?.username || value?.title || 'Unknown';
                      }
                      
                      return (
                        <p key={key}>
                          <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {String(displayValue)}
                        </p>
                      );
                    })}
                </div>

                {selectedIssue.otherSuggestions && (
                  <div className="detail-section suggestion-section">
                    <h4>Suggestions & Comments</h4>
                    <p>{selectedIssue.otherSuggestions}</p>
                  </div>
                )}

                {selectedIssue.analysisNotes && (
                  <div className="detail-section">
                    <h4>Analysis Notes</h4>
                    <p>{selectedIssue.analysisNotes}</p>
                  </div>
                )}
              </div>

              {selectedIssue.status === 'submitted' && (
                <div className="analysis-section">
                  <h4>Assign Technician</h4>
                  <div className="form-group">
                    <label>Select Technician Type:</label>
                    <select
                      value={selectedTechnicianType}
                      onChange={(e) => setSelectedTechnicianType(e.target.value)}
                      className="form-input form-select"
                    >
                      <option value="">Choose technician type...</option>
                      <option value="Water Management">Water Management</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <p className="info-text">Recommended: {selectedIssue.technicianType || 'Not determined'}</p>
                  {selectedTechnicianType && (
                    <p className="auto-assign-text">
                      Will assign: <strong>{getNextAvailableTechnician(selectedTechnicianType)}</strong>
                    </p>
                  )}
                </div>
              )}

              {selectedIssue.status === 'assigned' && selectedIssue.solveAlert && (
                <div className="alert-section">
                  <h4>⏰ Solution Deadline Exceeded</h4>
                  <p>This issue has not been resolved within 5 hours. Send warning to technician?</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedIssue.status === 'submitted' && (
                <>
                  <button
                    className="assign-btn"
                    onClick={() => handleAssignTechnician(selectedIssue._id)}
                  >
                    Assign to Technician
                  </button>
                </>
              )}
              {selectedIssue.status === 'assigned' && (
                <>
                  <button
                    className="complete-btn"
                    onClick={() => handleCompleteIssue(selectedIssue._id)}
                  >
                    Mark as Completed
                  </button>
                  {selectedIssue.solveAlert && (
                    <button
                      className="warning-btn"
                      onClick={() => sendWarningAlert(selectedIssue._id)}
                    >
                      Send Warning Alert
                    </button>
                  )}
                </>
              )}
              {selectedIssue.status === 'completed' && (
                <p className="completed-message">✓ Issue Completed</p>
              )}
              <button
                className="cancel-btn"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manager;
