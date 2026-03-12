import React, { useState, useEffect } from 'react';
import '../styles/Technician.css';
import Navbar from '../components/Navbar';
// import { issueAPI } from '../services/api';
import { technicianAPI } from '../services/api';

const WARNING_THRESHOLD_HOURS = 5;
const LOCATION_TYPE_LABELS = {
  classroom: 'Classroom',
  laboratory: 'Laboratory',
  lab: 'Laboratory',
  seminar_hall: 'Seminar Hall',
  seminar: 'Seminar Hall',
  special_lab: 'Special Lab'
};

const normalizeLocationCategory = (category = '') => {
  const normalized = String(category).trim().toLowerCase();

  if (normalized === 'seminar hall') return 'seminar_hall';
  if (normalized === 'special lab') return 'special_lab';

  return normalized;
};

const getLocationDetail = (location = {}, data = {}) => {
  const normalizedCategory = normalizeLocationCategory(location.category || data.locationCategory);
  const locationName = location.locationName || data.locationName || '';

  if (normalizedCategory === 'classroom') {
    return {
      categoryLabel: LOCATION_TYPE_LABELS.classroom,
      detailLabel: 'Room Number',
      detailValue: location.roomNumber || data.roomNumber || ''
    };
  }

  if (normalizedCategory === 'laboratory' || normalizedCategory === 'lab') {
    return {
      categoryLabel: LOCATION_TYPE_LABELS.laboratory,
      detailLabel: 'Laboratory Name',
      detailValue: locationName || data.laboratoryName || ''
    };
  }

  if (normalizedCategory === 'seminar_hall' || normalizedCategory === 'seminar') {
    return {
      categoryLabel: LOCATION_TYPE_LABELS.seminar_hall,
      detailLabel: 'Seminar Hall Name',
      detailValue: locationName || data.seminarHallName || ''
    };
  }

  if (normalizedCategory === 'special_lab') {
    return {
      categoryLabel: LOCATION_TYPE_LABELS.special_lab,
      detailLabel: 'Special Lab Name',
      detailValue: locationName || data.specialLabName || ''
    };
  }

  return {
    categoryLabel: location.category || data.locationCategory || '',
    detailLabel: location.locationFieldLabel || data.locationFieldLabel || 'Room Number',
    detailValue: locationName || location.roomNumber || data.roomNumber || ''
  };
};

const getReporterDetails = (task = {}) => ({
  name: task.reporterName || task.reporter?.name || task.submittedBy?.fullName || task.submittedBy?.username || 'Unknown',
  email: task.reporterEmail || task.reporter?.email || task.submittedBy?.email || 'Not provided'
});
const WARNING_COPY = {
  notSolved: '⚠ Issue not solved yet. Please take action.',
  noResponse: '⚠ Please update the issue status.'
};



function Technician({ userName, onLogout }) {
  // Fallback to sessionStorage if userName prop is not available
  const displayName = userName || sessionStorage.getItem('userName');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateProgress, setUpdateProgress] = useState('in_progress');
  const [filterStatus, setFilterStatus] = useState('assigned');

  // Fetch assigned tasks from backend and auto-refresh every 5 seconds (reduced from 3 for performance)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await technicianAPI.getAssignedTasks();

        // The backend returns only tasks relevant to this technician (either assigned or matching technicianType)
        const assignedTasks = response.data || [];

        if (process.env.REACT_APP_DEBUG === 'true') console.debug('📥 Technician tasks loaded:', assignedTasks.length);
        setTasks(assignedTasks);
        setError('');
      } catch (err) {
        console.error('❌ Fetch tasks error:', err.response?.data || err.message);
        // Keep existing tasks even if fetch fails, for better UX
        if (tasks.length === 0) {
          setError('Failed to load tasks - will retry');
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch with a small delay to allow login transition to complete
    const initialTimer = setTimeout(() => {
      fetchTasks();
    }, 100);
    
    // Refresh every 5 seconds to see new assignments (reduced frequency for better performance)
    const interval = setInterval(fetchTasks, 5000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [tasks.length]);

  const handleUpdateTask = async (taskId) => {
    if (!updateNotes.trim()) {
      alert('Please enter update notes');
      return;
    }

    try {
      if (process.env.REACT_APP_DEBUG === 'true') console.debug('📤 Updating task status to:', updateProgress);
      // Map front-end status to backend status
      // const statusMap = {
      //   'in_progress': 'in_progress',
      //   'completed': 'completed'
      // };
      
      // Call backend API to update issue
      // await issueAPI.completeIssue(taskId, {
      //   status: statusMap[updateProgress],
      //   notes: updateNotes
      // });
      
      // await issueAPI.updateIssueStatus(taskId, {
      //   status: updateProgress,
      //   technicianNotes: updateNotes
      // });

      await technicianAPI.updateTaskStatus(
        taskId,
        updateProgress,
        updateNotes
      );


      alert('Task updated successfully!');
      
      // Refresh tasks list
      // const response = await issueAPI.getAllIssues();
      // // const assignedTasks = (response.data || []).filter(issue => 
      // //   issue.status === 'assigned' || issue.status === 'in_progress' || issue.status === 'completed'
      // // );
      // const username = sessionStorage.getItem('userName');
      // const assignedTasks = (response.data || []).filter(issue =>
      //   issue.assignedTechnician?.username === username &&
      //   ['assigned', 'in_progress', 'completed'].includes(issue.status));
      // setTasks(assignedTasks);
      

      const response = await technicianAPI.getAssignedTasks();
      setTasks(response.data || []);


      setUpdateNotes('');
      setUpdateProgress('in_progress');
      setShowDetails(false);
    } catch (err) {
      console.error('❌ Error updating task:', err.response?.data || err.message);
      alert('Failed to update task: ' + (err.response?.data?.details || err.message));
    }
  };

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(task => task.status === filterStatus);

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  const getTaskWarningDetails = (task) => {
    if (!['assigned', 'in_progress'].includes(task.status)) {
      return { status: null, message: '', isDelayed: false, hoursOpen: 0 };
    }

    const startedAt = task.timestamps?.assigned || task.timestamps?.submitted;
    const hoursOpen = startedAt ? (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60) : 0;
    const hasTechnicianResponse = Boolean(task.technicianNotes?.trim());
    const warningStatus = hasTechnicianResponse ? 'notSolved' : 'noResponse';

    return {
      status: hoursOpen >= WARNING_THRESHOLD_HOURS ? warningStatus : null,
      message: hoursOpen >= WARNING_THRESHOLD_HOURS ? WARNING_COPY[warningStatus] : '',
      isDelayed: hoursOpen >= WARNING_THRESHOLD_HOURS,
      hoursOpen
    };
  };

  const getTaskLocation = (task) => ({
    block: task?.location?.block || task?.data?.block || task?.block || '',
    floor: task?.location?.floor || task?.data?.floor || task?.floor || '',
    roomNumber: task?.location?.roomNumber || task?.data?.roomNumber || task?.roomNumber || '',
    category: task?.location?.category || task?.data?.locationCategory || task?.locationCategory || '',
    locationName: task?.location?.locationName || task?.data?.locationName || '',
    locationFieldLabel: task?.location?.locationFieldLabel || task?.data?.locationFieldLabel || ''
  });

  // const getPriorityColor = (priority) => {
  //   switch (priority) {
  //     case 'high':
  //       return '#e74c3c';
  //     case 'medium':
  //       return '#f39c12';
  //     case 'low':
  //       return '#27ae60';
  //     default:
  //       return '#3498db';
  //   }
  // };

  const getPriorityColor = (priority) => {
  switch (priority) {
    case 1: return '#e74c3c'; // P1
    case 2: return '#f39c12';
    case 3: return '#f1c40f';
    case 4: return '#2ecc71';
    case 5: return '#3498db';
    default: return '#3498db';
  }
};

  const delayedTasks = tasks.filter((task) => getTaskWarningDetails(task).isDelayed);


  return (
    <div className="technician-container">
      <Navbar userName={displayName} role="Technician" onLogout={onLogout} />

      <div className="technician-main">
        <div className="technician-header">
          <h2>Technician Dashboard</h2>
          <p>View assigned tasks and update their status</p>
        </div>

        <div className="technician-content">
          {loading && <div className="loading-message" style={{ padding: '20px' }}>Loading tasks...</div>}
          {delayedTasks.length > 0 && (
            <div className="technician-warning-alert">
              <strong>⚠ Warning:</strong> {delayedTasks.length} task{delayedTasks.length > 1 ? 's are' : ' is'} delayed for more than {WARNING_THRESHOLD_HOURS} hours.
            </div>
          )}
          <div className="dashboard-stats">
            <div className="stat-card">
              <h4>Total Tasks</h4>
              <p className="stat-number">{tasks.length}</p>
            </div>
            <div className="stat-card">
              <h4>Assigned</h4>
              <p className="stat-number">{tasks.filter(t => t.status === 'assigned').length}</p>
            </div>
            <div className="stat-card">
              <h4>In Progress</h4>
              <p className="stat-number">{tasks.filter(t => t.status === 'in_progress').length}</p>
            </div>
            <div className="stat-card">
              <h4>Completed</h4>
              <p className="stat-number">{tasks.filter(t => t.status === 'completed').length}</p>
            </div>
            <div className="stat-card warning-stat-card">
              <h4>Delayed Warnings</h4>
              <p className="stat-number">{delayedTasks.length}</p>
            </div>
          </div>

          <div className="technician-controls">
            <div className="filter-section">
              <label>Filter by Status:</label>
              <div className="filter-buttons">
                <button
                  className={filterStatus === 'all' ? 'active' : ''}
                  onClick={() => setFilterStatus('all')}
                >
                  All Tasks
                </button>
                <button
                  className={filterStatus === 'assigned' ? 'active' : ''}
                  onClick={() => setFilterStatus('assigned')}
                >
                  Assigned
                </button>
                <button
                  className={filterStatus === 'in_progress' ? 'active' : ''}
                  onClick={() => setFilterStatus('in_progress')}
                >
                  In Progress
                </button>
                <button
                  className={filterStatus === 'completed' ? 'active' : ''}
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: 'red', padding: '10px', marginBottom: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
              ❌ {error}
            </div>
          )}

          <div className="tasks-grid">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks with this status</p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const warning = getTaskWarningDetails(task);
                const taskLocation = getTaskLocation(task);
                const taskLocationDetail = getLocationDetail(taskLocation, task.data || {});
                return (
                <div key={task._id || task.id} className={`task-card ${warning.isDelayed ? 'task-card-delayed' : ''}`}>
                  <div className="task-header">
                    <h3>
                      <span className="location-type">{taskLocationDetail.categoryLabel || task.userType || 'Location'}</span>
                      <span className="room-info">
                        {[
                          `Block ${taskLocation.block || 'N/A'}`,
                          `Floor ${taskLocation.floor || 'N/A'}`,
                          `${taskLocationDetail.detailLabel} ${taskLocationDetail.detailValue || 'N/A'}`
                        ].join(' • ')}
                      </span>
                    </h3>
                    <span
                      className="priority-badge"
                      // style={{ backgroundColor: getPriorityColor(task.priority?.toLowerCase() || 'medium') }}
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </div>

                  <div className="task-body">
                    <p className="issue-description">
                      <strong>Issue:</strong> {task.condition || 'See details'}
                    </p>
                    {task.relevantSpecificIssues?.length > 0 && (
                      <p className="issue-analysis">
                        <strong>Assigned Issues:</strong> {task.relevantSpecificIssues.join(', ')}
                      </p>
                    )}
                    {task.relevantOtherSuggestions && (
                      <p className="update-notes">
                        <strong>Additional Issue:</strong> {task.relevantOtherSuggestions}
                      </p>
                    )}
                    <p className="issue-analysis">
                      <strong>Problem Level:</strong> {task.problemLevel || task.data?.problemLevel || 'Unknown'}
                    </p>
                    <p className="reported-by">
                      <strong>Reported by:</strong> {getReporterDetails(task).name}
                    </p>
                    <p className="reported-by">
                      <strong>Email:</strong> {getReporterDetails(task).email}
                    </p>
                    {task.data?.otherSuggestions && (
                      <p className="update-notes">
                        <strong>Notes:</strong> {task.data.otherSuggestions}
                      </p>
                    )}
                    {warning.status && (
                      <div className={`warning-note ${warning.status}`}>
                        {warning.message}
                      </div>
                    )}
                  </div>

                  <div className="task-footer">
                    <span className={`status-badge ${getStatusClass(task.status)}`}>
                      {(task.status || 'assigned').replace('_', ' ')}
                    </span>
                    <span className="task-time">
                      {task.timestamps?.assigned ? new Date(task.timestamps.assigned).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>

                  <button
                    className="view-details-btn"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowDetails(true);
                      setUpdateNotes('');
                      setUpdateProgress(task.status || 'in_progress');
                    }}
                  >
                    View Details
                  </button>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {showDetails && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Task Details</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="task-details">
                {(() => {
                  const warning = getTaskWarningDetails(selectedTask);
                  if (!warning.status) {
                    return null;
                  }

                  return (
                    <div className={`warning-note-panel ${warning.status}`}>
                      <p>{warning.message}</p>
                      {warning.isDelayed && (
                        <p className="warning-meta">
                          Delayed for more than {WARNING_THRESHOLD_HOURS} hours.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Reporter Information - Dynamic based on userType */}
                <div className="detail-section">
                  <h4>Reporter Information</h4>
                  <p><strong>Reported by:</strong> {getReporterDetails(selectedTask).name}</p>
                  <p><strong>Email:</strong> {getReporterDetails(selectedTask).email}</p>
                </div>

                {/* Location Details */}
                <div className="detail-section">
                  <h4>Location Details</h4>
                  <p><strong>Block:</strong> {getTaskLocation(selectedTask).block || 'N/A'}</p>
                  <p><strong>Floor:</strong> {getTaskLocation(selectedTask).floor || 'N/A'}</p>
                  <p><strong>{getLocationDetail(getTaskLocation(selectedTask), selectedTask.data || {}).detailLabel}:</strong> {getLocationDetail(getTaskLocation(selectedTask), selectedTask.data || {}).detailValue || 'N/A'}</p>
                  <p><strong>Location Type:</strong> {getLocationDetail(getTaskLocation(selectedTask), selectedTask.data || {}).categoryLabel || 'N/A'}</p>
                </div>

                {/* Issue Details - Overall Condition and Issue */}
                <div className="detail-section">
                  <h4>Issue Details</h4>
                  <p><strong>Overall Condition:</strong> {selectedTask.condition || 'Not assessed'}</p>
                  {/* Display specific problems from the issue data */}
                  <p><strong>Specific Issues Found:</strong></p>
                  {selectedTask.relevantSpecificIssues?.length > 0 ? (
                    <div style={{ marginLeft: '20px' }}>
                      {selectedTask.relevantSpecificIssues.map((problem, i) => (
                        <p key={i} style={{ margin: '5px 0', color: '#e74c3c' }}>{problem}</p>
                      ))}
                      {selectedTask.relevantOtherSuggestions && (
                        <>
                          <p style={{ margin: '8px 0 3px 0', color: '#2c3e50', fontWeight: '500' }}>Additional Issue:</p>
                          <p style={{ margin: '3px 0', color: '#555', fontStyle: 'italic' }}>{selectedTask.relevantOtherSuggestions}</p>
                        </>
                      )}
                    </div>
                  ) : selectedTask.data ? (
                    <div style={{ marginLeft: '20px' }}>
                      {(() => {
                        const problems = [];
                        const data = selectedTask.data;
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
                  <p style={{ marginTop: '0.75rem', color: '#2c3e50' }}><strong>Priority:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>P{selectedTask.priority}</span></p>
                </div>

                {(selectedTask.risk || selectedTask.analysisNotes) && (
                  <div className="detail-section">
                    <h4>Manager Analysis</h4>
                    <p><strong>Risk Level:</strong> {selectedTask.risk || 'N/A'}</p>
                    <p><strong>Analysis Notes:</strong> {selectedTask.analysisNotes || 'N/A'}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Timeline</h4>
                  <p><strong>Submitted:</strong> {selectedTask.timestamps?.submitted ? new Date(selectedTask.timestamps.submitted).toLocaleString() : 'Unknown'}</p>
                  {selectedTask.timestamps?.assigned && (
                    <p><strong>Assigned Date:</strong> {new Date(selectedTask.timestamps.assigned).toLocaleString()}</p>
                  )}
                  {selectedTask.timestamps?.completed && (
                    <p><strong>Completed Date:</strong> {new Date(selectedTask.timestamps.completed).toLocaleString()}</p>
                  )}
                </div>

                {selectedTask.status !== 'completed' && (
                  <div className="update-section">
                    <h4>Update Task Status</h4>
                    <div className="form-group">
                      <label>Progress Status</label>
                      <select
                        value={updateProgress}
                        onChange={(e) => setUpdateProgress(e.target.value)}
                      >
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Update Notes</label>
                      <textarea
                        value={updateNotes}
                        onChange={(e) => setUpdateNotes(e.target.value)}
                        placeholder="Enter work progress, actions taken, or completion details..."
                        rows="5"
                      />
                    </div>
                  </div>
                )}

                {selectedTask.status === 'completed' && (
                  <div className="completed-message">
                    <p>✓ This task has been completed</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedTask.status !== 'completed' && (
                <button
                  className="update-btn"
                  onClick={() => handleUpdateTask(selectedTask._id || selectedTask.id)}
                >
                  Update Task
                </button>
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

export default Technician;
