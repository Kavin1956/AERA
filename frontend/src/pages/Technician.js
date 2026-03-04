import React, { useState, useEffect } from 'react';
import '../styles/Technician.css';
import Navbar from '../components/Navbar';
// import { issueAPI } from '../services/api';
import { technicianAPI } from '../services/api';



function Technician({ userName, onLogout }) {
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
      // const username = localStorage.getItem('userName');
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


  return (
    <div className="technician-container">
      <Navbar userName={userName} role="Technician" onLogout={onLogout} />

      <div className="technician-main">
        <div className="technician-header">
          <h2>Technician Dashboard</h2>
          <p>View assigned tasks and update their status</p>
        </div>

        <div className="technician-content">
          {loading && <div className="loading-message" style={{ padding: '20px' }}>Loading tasks...</div>}
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
              filteredTasks.map(task => (
                <div key={task._id || task.id} className="task-card">
                  <div className="task-header">
                    <h3>
                      <span className="location-type">{task.userType || task.locationCategory}</span>
                      <span className="room-info">
                        Block {task.block} • Floor {task.floor} • Room {task.roomNumber}
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
                    <p className="issue-analysis">
                      <strong>Problem Level:</strong> {task.problemLevel || task.data?.problemLevel || 'Unknown'}
                    </p>
                    <p className="reported-by">
                      <strong>Reported by:</strong> {task.submittedBy?.fullName || task.submittedBy || 'System'}
                    </p>
                    {task.data?.otherSuggestions && (
                      <p className="update-notes">
                        <strong>Notes:</strong> {task.data.otherSuggestions}
                      </p>
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
              ))
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
                <div className="detail-section">
                  <h4>Location Information</h4>
                  <p><strong>Type:</strong> {selectedTask.userType || selectedTask.locationCategory}</p>
                  <p><strong>Block:</strong> {selectedTask.block}</p>
                  <p><strong>Floor:</strong> {selectedTask.floor}</p>
                  <p><strong>Room Number:</strong> {selectedTask.roomNumber}</p>
                </div>

                <div className="detail-section">
                  <h4>Issue Details</h4>
                  <p><strong>Overall Condition:</strong> {selectedTask.condition}</p>
                  
                  {/* Specific Issues Found */}
                  <p><strong>Specific Issues Found:</strong></p>
                  {selectedTask.data ? (
                    <div style={{ marginLeft: '20px' }}>
                      {(() => {
                        const problems = [];
                        const data = selectedTask.data;
                        
                        // Check for not working items
                        if (data.projector === 'Not Working') problems.push('📽️ Projector not working');
                        if (data.ac === 'Not Working') problems.push('❄️ AC not working');
                        if (data.ac === 'Partially Working') problems.push('❄️ AC partially working');
                        if (data.whiteboard === 'Poor') problems.push('📝 Whiteboard in poor condition');
                        if (data.lights === 'Not Working') problems.push('💡 Lights not working');
                        if (data.lights === 'Partial') problems.push('💡 Lights partially working');
                        if (data.fans === 'Not Working') problems.push('🌀 Fans not working');
                        if (data.fans === 'Partial') problems.push('🌀 Fans partially working');
                        if (data.powerSupply === 'Fluctuating') problems.push('⚡ Power supply fluctuating');
                        if (data.powerSupply === 'Frequent Outages') problems.push('⚡ Frequent power outages');
                        if (data.systemPc === 'Not Working') problems.push('💻 System/PC not working');
                        if (data.systemPc === 'Not Available') problems.push('💻 System/PC not available');
                        if (data.junctionBox === 'Needs Attention') problems.push('⚠️ Junction box needs attention');
                        if (data.junctionBox === 'Unsafe') problems.push('🚨 Junction box unsafe');
                        if (data.seatsAvailability && data.seatsAvailability < 10) problems.push(`📺 Limited seats: ${data.seatsAvailability} available`);
                        if (data.mikeCondition === 'Needs Repair') problems.push('🎤 Mike/Speaker needs repair');
                        if (data.mikeCondition === 'Not Available') problems.push('🎤 Mike/Speaker not available');
                        if (data.whiteboards === 'Fair') problems.push('📝 Whiteboards in fair condition');
                        if (data.whiteboards === 'Poor') problems.push('📝 Whiteboards in poor condition');
                        if (data.temperature && data.temperature > 30) problems.push(`🌡️ High temperature: ${data.temperature}°C`);
                        
                        if (problems.length > 0) {
                          return problems.map((p, i) => <p key={i} style={{ margin: '5px 0' }}>{p}</p>);
                        } else {
                          return <p style={{ margin: '5px 0', color: '#666' }}>No specific problems reported - all systems functioning normally</p>;
                        }
                      })()}
                    </div>
                  ) : (
                    <p style={{ marginLeft: '20px' }}>No additional details</p>
                  )}
                  
                  <p style={{ marginTop: '0.75rem' }}><strong>Priority:</strong> {selectedTask.priority}</p>
                </div>

                <div className="detail-section">
                  <h4>Timeline</h4>
                  <p><strong>Reported by:</strong> {selectedTask.submittedBy?.fullName || selectedTask.submittedBy || 'System'}</p>
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
