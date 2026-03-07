import React, { useState, useEffect } from 'react';
import '../styles/Manager.css';
import Navbar from '../components/Navbar';
import { issueAPI } from '../services/api';

function Manager({ userName, onLogout }) {
  // Fallback to sessionStorage if userName prop is not available
  const displayName = userName || sessionStorage.getItem('userName');
  
  // Available technician types
  const TECHNICIAN_TYPES = {
    'electrical': 'Electrical Technician',
    'it_system': 'IT / System Technician',
    'maintenance': 'Maintenance Technician',
    'safety': 'Safety Technician',
    'general_support': 'General Support Technician'
  };

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newIssueAlert, setNewIssueAlert] = useState(''); // To show notification of new issue

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedIssueDisplayId, setSelectedIssueDisplayId] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTechnicianType, setSelectedTechnicianType] = useState('');
  const [analysisRisk, setAnalysisRisk] = useState('');
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [analyticsData, setAnalyticsData] = useState({});
  const [previousIssueCount, setPreviousIssueCount] = useState(0); // Track previous count to detect new issues

  // Fetch issues from backend on mount and auto-refresh every 5 seconds
  useEffect(() => {
    // Use ref to track previous count without triggering effect re-runs
    let previousCountRef = previousIssueCount;
    
    const fetchIssues = async () => {
      try {
        // Verify token is still valid
        const token = sessionStorage.getItem('token');
        const userRole = sessionStorage.getItem('userRole');
        
        console.debug('🔍 Manager fetch check:', { token: !!token, userRole, hasToken: !!token });
        
        if (!token || userRole !== 'manager') {
          console.error('❌ Session validation failed:', { token: !!token, userRole });
          setError('Session expired or invalid role. Please login again.');
          setLoading(false);
          return;
        }

        const response = await issueAPI.getAllIssues();
        if (process.env.REACT_APP_DEBUG === 'true') console.debug('📥 Issues loaded in Manager:', response.data?.length, 'issues');
        setIssues(response.data || []);
        setError('');
        
        // Detect new issues
        const currentCount = (response.data || []).length;
        if (currentCount > previousCountRef && previousCountRef > 0) {
          const newCount = currentCount - previousCountRef;
          setNewIssueAlert(`✨ ${newCount} new issue(s) submitted!`);
          // Clear notification after 5 seconds
          setTimeout(() => setNewIssueAlert(''), 5000);
        }
        previousCountRef = currentCount;
        setPreviousIssueCount(currentCount);
      } catch (err) {
        console.error('❌ Fetch issues error:', err.response?.data || err.message);
        
        // Handle 401 Unauthorized
        if (err.response?.status === 401) {
          console.error('🔒 Unauthorized - clearing session');
          setError('Session expired. Please login again.');
          sessionStorage.clear();
          return;
        }
        
        if (!loading) {
          setError('Failed to load issues');
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch immediately
    fetchIssues();
    
    // Refresh every 5 seconds to show new submissions from Data Collectors
    const interval = setInterval(fetchIssues, 5000);
    
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - run only on mount

  // Handle page visibility - refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is now visible, refresh issues immediately
        console.log('📱 Page became visible, fetching fresh issues...');
        setLoading(true);
        // Directly fetch instead of relying on dependency to trigger
        const token = sessionStorage.getItem('token');
        const userRole = sessionStorage.getItem('userRole');
        
        if (token && userRole === 'manager') {
          issueAPI.getAllIssues()
            .then(response => {
              setIssues(response.data || []);
              setError('');
            })
            .catch(err => {
              console.error('❌ Fetch on visibility change error:', err);
              if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                sessionStorage.clear();
              } else {
                setError('Failed to load issues');
              }
            })
            .finally(() => setLoading(false));
        } else {
          console.warn('⚠️ No valid session when tab became visible');
          setError('Session expired or invalid role. Please login again.');
          setLoading(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle storage changes (logout from other tab)
  // Removed: sessionStorage is tab-specific, so we don't need cross-tab logout detection
  // Each tab manages its own session independently

  // Get display name for technician type
  const getTechnicianTypeDisplay = (techType) => {
    return TECHNICIAN_TYPES[techType] || techType;
  };

  // Check if an issue is newly submitted (within last 2 minutes)
  const isNewIssue = (issue) => {
    if (!issue.timestamps?.submitted) return false;
    const submittedTime = new Date(issue.timestamps.submitted);
    const now = new Date();
    const minutesAgo = (now - submittedTime) / (1000 * 60);
    return minutesAgo < 2; // Highlight as "new" if submitted within 2 minutes
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
    const total = submitted + assigned + completed; // Sum of all tracked statuses

    // Weekly analysis - issues from last 7 days (use all issues if none are this week)
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const weeklyIssues = issues.filter(i => {
      if (!i.timestamps?.submitted) return false;
      const submittedDate = new Date(i.timestamps.submitted);
      return submittedDate >= sevenDaysAgo;
    });

    // Use weekly issues if available, otherwise use all issues for display
    const dataSourceIssues = weeklyIssues.length > 0 ? weeklyIssues : issues;

    // Count by technician/issue type (from weekly issues only)
    const countsByType = dataSourceIssues.reduce((acc, it) => {
      const key = it.technicianType || it.issueType || 'Others';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Calculate weekly totals by technician type
    const electricalCount = dataSourceIssues.filter(i => i.technicianType === 'electrical').length;
    const itSystemCount = dataSourceIssues.filter(i => i.technicianType === 'it_system').length;
    const maintenanceCount = dataSourceIssues.filter(i => i.technicianType === 'maintenance').length;
    const safetyCount = dataSourceIssues.filter(i => i.technicianType === 'safety').length;
    const generalSupportCount = dataSourceIssues.filter(i => i.technicianType === 'general_support').length;
    const weeklyTotalCount = electricalCount + itSystemCount + maintenanceCount + safetyCount + generalSupportCount;

    setAnalyticsData({
      submitted,
      assigned,
      completed,
      total,
      weeklyTotal: weeklyTotalCount,
      countsByType,
      weeklyByPriority: {
        1: electricalCount,
        2: itSystemCount,
        3: maintenanceCount,
        4: safetyCount,
        5: generalSupportCount
      }
    });
  }, [issues]);

  const handleSaveAnalysisAndAssign = async (issueId) => {
    try {
      const typeToAssign = selectedTechnicianType || selectedIssue?.technicianType;
      const payload = {
        risk: analysisRisk || undefined,
        analysisNotes: analysisNotes || undefined,
        technicianType: typeToAssign || undefined,
        status: 'assigned'
      };

      console.log('📤 Assigning issue:', issueId);
      console.log('   Payload:', payload);
      console.log('   selectedTechnicianType:', typeToAssign);

      const response = await issueAPI.updateIssueStatus(issueId, payload);
      console.log('✅ Response received:', response.data);
      console.log('   Issue technicianType:', response.data.technicianType);
      console.log('   Issue status:', response.data.status);
      console.log('   Assigned to:', response.data.assignedTechnician?.username);

      // Update local state
      setIssues(issues.map(i => i._id === issueId ? response.data : i));

      alert('Analysis saved and issue assigned.');
      setSelectedTechnicianType('');
      setAnalysisRisk('');
      setAnalysisNotes('');
      setShowDetails(false);
    } catch (err) {
      console.error('❌ Save analysis / assign error:', err);
      const errorMsg = err.response?.data?.details || err.response?.data?.message || err.message;
      alert(`Failed to save analysis or assign: ${errorMsg}`);
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

  const handleDeleteIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      try {
        await issueAPI.deleteIssue(issueId);
        // Remove from local state
        setIssues(issues.filter(issue => issue._id !== issueId));
        alert('Issue deleted successfully');
      } catch (err) {
        console.error('❌ Delete issue error:', err.response?.data || err.message);
        alert('Failed to delete issue: ' + (err.response?.data?.message || err.message));
      }
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
      <Navbar userName={displayName} role="Manager" onLogout={onLogout} />

      <div className="manager-main">
        <div className="manager-header">
          <h2>Manager Dashboard</h2>
          <p>Review, analyze, and assign environmental issues to technicians</p>
        </div>

        <div className="manager-content">
          {loading && <div className="loading-spinner">Loading issues...</div>}
          {error && <div className="error-message">{error}</div>}
          {newIssueAlert && <div className="success-message" style={{ animation: 'slideDown 0.3s ease-in-out' }}>{newIssueAlert}</div>}
          
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
                <p className="label">⚡ Electrical Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[1] || 0}</p>
              </div>
              <div className="analysis-card priority-2">
                <p className="label">💻 IT / System Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[2] || 0}</p>
              </div>
              <div className="analysis-card priority-3">
                <p className="label">🔧 Maintenance Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[3] || 0}</p>
              </div>
              <div className="analysis-card priority-4">
                <p className="label">🚨 Safety Issues</p>
                <p className="value">{analyticsData.weeklyByPriority?.[4] || 0}</p>
              </div>
              <div className="analysis-card priority-5">
                <p className="label">👥 General Support</p>
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
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTabIssues?.map((issue, index) => (
                        <tr key={issue._id} className={`issue-row status-${issue.status} ${issue.responseAlert ? 'alert-response' : ''} ${issue.solveAlert ? 'alert-solve' : ''} ${isNewIssue(issue) ? 'new-issue-highlight' : ''}`}>
                          <td>IS{index + 1}</td>
                          <td>
                            Block {issue.block}, Floor {issue.floor}, Room {issue.roomNumber}
                          </td>
                          <td>{issue.name || issue.submittedBy?.username || (issue.userType === 'student' ? 'Student' : issue.userType === 'faculty' ? 'Faculty' : 'Data Collector')}</td>
                          <td>{issue.locationCategory}</td>
                          <td>
                            <span className={`priority-badge priority-${issue.priority}`}>
                              P{issue.priority}
                            </span>
                          </td>
                          <td>
                            <span className="tech-badge">{getTechnicianTypeDisplay(issue.technicianType) || 'Pending'}</span>
                          </td>
                          <td>
                            <span className={`status-badge status-${issue.status}`}>
                              {issue.status === 'submitted' ? 'New' : issue.status === 'assigned' ? 'In Progress' : issue.status}
                            </span>
                            {issue.responseAlert && <span className="alert-badge">⚠️ No Response</span>}
                            {issue.solveAlert && <span className="alert-badge solve">🚨 Not Solved</span>}
                            {isNewIssue(issue) && <span className="alert-badge" style={{ backgroundColor: '#10b981' }}>✨ JUST SUBMITTED</span>}
                          </td>
                          <td>{new Date(issue.timestamps?.submitted).toLocaleString()}</td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() => {
                                setSelectedIssue(issue);
                                setSelectedIssueDisplayId(`IS${index + 1}`);
                                setShowDetails(true);
                              }}
                            >
                              View
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteIssue(issue._id)}
                              title="Delete issue"
                            >
                              🗑️ Delete
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
                    {completedTabIssues?.map((issue, index) => (
                      <tr key={issue._id} className="issue-row status-completed">
                        <td>IS{index + 1}</td>
                        <td>
                          Block {issue.block}, Floor {issue.floor}, Room {issue.roomNumber}
                        </td>
                        <td>{issue.name || issue.submittedBy?.username || (issue.userType === 'student' ? 'Student' : issue.userType === 'faculty' ? 'Faculty' : 'Data Collector')}</td>
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
                              setSelectedIssueDisplayId(`IS${index + 1}`);
                              setShowDetails(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteIssue(issue._id)}
                            title="Delete issue"
                          >
                            🗑️ Delete
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
              <h3>Issue ID: {selectedIssueDisplayId}</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="issue-details">
                {/* Reporter Information - Dynamic based on userType */}
                <div className="detail-section">
                  <h4>Reporter Information</h4>
                  
                  {selectedIssue.userType === 'student' && (
                    <>
                      <p><strong>Type:</strong> Student</p>
                      <p><strong>Name:</strong> {selectedIssue.data?.name || selectedIssue.name || 'Student'}</p>
                      <p><strong>Roll Number:</strong> {selectedIssue.data?.rollNumber || selectedIssue.rollNumber || 'Not provided'}</p>
                      <p><strong>Department:</strong> {selectedIssue.data?.dept || selectedIssue.dept || 'Not provided'}</p>
                      <p><strong>Email:</strong> {selectedIssue.data?.email || selectedIssue.submittedBy?.email || 'Not provided'}</p>
                    </>
                  )}

                  {selectedIssue.userType === 'faculty' && (
                    <>
                      <p><strong>Type:</strong> Faculty</p>
                      <p><strong>Name:</strong> {selectedIssue.data?.name || selectedIssue.name || 'Faculty'}</p>
                      <p><strong>Faculty ID:</strong> {selectedIssue.data?.facultyId || selectedIssue.facultyId || 'Not provided'}</p>
                      <p><strong>Email:</strong> {selectedIssue.data?.email || selectedIssue.submittedBy?.email || 'Not provided'}</p>
                    </>
                  )}

                  {selectedIssue.userType === 'data_collector' && (
                    <>
                      <p><strong>Type:</strong> Data Collector</p>
                      <p><strong>Name:</strong> {selectedIssue.data?.name || selectedIssue.name || 'Data Collector'}</p>
                      <p><strong>ID:</strong> {selectedIssue.data?.collectorId || selectedIssue.collectorId || 'Not provided'}</p>
                      <p><strong>Email:</strong> {selectedIssue.data?.email || selectedIssue.submittedBy?.email || 'Not provided'}</p>
                    </>
                  )}
                </div>

                {/* Location Details */}
                <div className="detail-section">
                  <h4>Location Details</h4>
                  <p><strong>Block:</strong> {selectedIssue.block}</p>
                  <p><strong>Floor:</strong> {selectedIssue.floor}</p>
                  <p><strong>Room Number:</strong> {selectedIssue.roomNumber}</p>
                  <p><strong>Location Type:</strong> {selectedIssue.locationCategory}</p>
                </div>

                {/* Issue Details - Overall Condition and Issue */}
                <div className="detail-section">
                  <h4>Issue Details</h4>
                  <p><strong>Overall Condition:</strong> {selectedIssue.condition || 'Not assessed'}</p>
                  
                  {/* Display specific problems from the issue data */}
                  <p><strong>Specific Issues Found:</strong></p>
                  {selectedIssue.data ? (
                    <div style={{ marginLeft: '20px' }}>
                      {(() => {
                        const problems = [];
                        const data = selectedIssue.data;
                        
                        // Infrastructure Issues
                        if (data.whiteboardNeedsCleaning) problems.push('📝 Whiteboard needs cleaning');
                        if (data.whiteboardDamaged) problems.push('📝 Whiteboard damaged');
                        if (data.brokenChairs) problems.push('🪑 Broken chairs');
                        if (data.damagedTables) problems.push('📦 Damaged tables');
                        
                        // Digital Equipment Issues
                        if (data.systemSlowPerformance) problems.push('💻 System slow performance');
                        if (data.systemNotWorking) problems.push('💻 System/PC not working');
                        if (data.projectorNotWorking) problems.push('📽️ Projector not working');
                        if (data.projectorNotAvailable) problems.push('📽️ Projector not available');
                        if (data.slowInternet) problems.push('🌐 Slow internet');
                        if (data.noInternet) problems.push('🌐 No internet');
                        
                        // Environmental Issues
                        if (data.temperatureTooHot) problems.push('🌡️ Temperature too hot');
                        if (data.temperatureTooCold) problems.push('❄️ Temperature too cold');
                        if (data.dustyEnvironment) problems.push('💨 Dusty environment');
                        if (data.poorVentilation) problems.push('💨 Poor ventilation');
                        
                        // Electrical & Power Issues
                        if (data.powerSupplyFluctuating) problems.push('⚡ Power supply fluctuating');
                        if (data.powerFailure) problems.push('⚡ Power failure');
                        if (data.acNotWorking) problems.push('❄️ AC not working');
                        if (data.dimLighting) problems.push('💡 Dim lighting');
                        if (data.lightingNotWorking) problems.push('💡 Lighting not working');
                        if (data.fanNotWorking) problems.push('🌀 Fan not working');
                        if (data.junctionBoxExtraAvailable) problems.push('📦 Junction box extra available');
                        if (data.junctionBoxDamaged) problems.push('🚨 Junction box damaged');
                        
                        // Safety Issues
                        if (data.fireEquipmentNotAvailable) problems.push('🔥 Fire equipment not available');
                        if (data.exitBlocked) problems.push('🚪 Emergency exit blocked');
                        if (data.looseWires) problems.push('⚠️ Loose wires');
                        if (data.damagedSwitches) problems.push('⚠️ Damaged switches');
                        
                        if (problems.length > 0) {
                          return (
                            <>
                              {problems.map((p, i) => <p key={i} style={{ margin: '5px 0', color: '#e74c3c' }}>{p}</p>)}
                              {data.otherSuggestions && (
                                <>
                                  <p style={{ margin: '8px 0 3px 0', color: '#2c3e50', fontWeight: '500' }}>📋 Additional Comments:</p>
                                  <p style={{ margin: '3px 0', color: '#555', fontStyle: 'italic' }}>{data.otherSuggestions}</p>
                                </>
                              )}
                            </>
                          );
                        } else if (data.otherSuggestions) {
                          return (
                            <>
                              <p style={{ margin: '5px 0', color: '#27ae60' }}>✓ No specific issues detected</p>
                              <>
                                <p style={{ margin: '8px 0 3px 0', color: '#2c3e50', fontWeight: '500' }}>📋 Additional Issue Details:</p>
                                <p style={{ margin: '3px 0', color: '#555', fontStyle: 'italic' }}>{data.otherSuggestions}</p>
                              </>
                            </>
                          );
                        } else {
                          return <p style={{ margin: '5px 0', color: '#27ae60' }}>✓ No specific issues - all systems functioning normally</p>;
                        }
                      })()}
                    </div>
                  ) : (
                    <p style={{ marginLeft: '20px' }}>No additional details</p>
                  )}
                  
                  <p style={{ marginTop: '0.75rem', color: '#2c3e50' }}><strong>Priority:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>P{selectedIssue.priority}</span></p>
                </div>
              </div>

              {/* Manager Assignment Section - Only for submitted issues */}
              {selectedIssue.status === 'submitted' && (
                <div className="analysis-section">
                  <h4>Manager Analysis & Assignment</h4>

                  <div className="form-group">
                    <label>Risk Level</label>
                    <select
                      value={analysisRisk}
                      onChange={(e) => setAnalysisRisk(e.target.value)}
                      className="form-input form-select"
                    >
                      <option value="">Select risk level...</option>
                      <option value="Low">Low</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Analysis Notes</label>
                    <textarea
                      value={analysisNotes}
                      onChange={(e) => setAnalysisNotes(e.target.value)}
                      className="form-input form-textarea"
                      placeholder="Enter your analysis and notes here..."
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assign to Technician</label>
                    <select
                      value={selectedTechnicianType}
                      onChange={(e) => setSelectedTechnicianType(e.target.value)}
                      className="form-input form-select"
                    >
                      <option value="">Select technician type...</option>
                      <option value="electrical">Electrical Technician</option>
                      <option value="it_system">IT / System Technician</option>
                      <option value="maintenance">Maintenance Technician</option>
                      <option value="safety">Safety Technician</option>
                      <option value="general_support">General Support Technician</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Assigned Status Section */}
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
                    onClick={() => handleSaveAnalysisAndAssign(selectedIssue._id)}
                  >
                    Save & Assign
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
