// import React from 'react';
// import '../styles/DataCollector.css';
// import Navbar from '../components/Navbar';

// export default function DataCollector({ userName, onLogout }) {
//   return (
//     <div className="data-collector-container">
//       <Navbar userName={userName} role="Data Collector" onLogout={onLogout} />
//       <div className="data-collector-main">
//         <h2>Data Collector</h2>
//         <p>The Data Collector UI was temporarily disabled to fix a syntax error. Form functionality can be restored on request.</p>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import '../styles/DataCollector.css';
import Navbar from '../components/Navbar';
import { issueAPI } from '../services/api';

const TECHNICIAN_TYPE_LABELS = {
  maintenance: 'Maintenance',
  it_system: 'IT / System',
  electrical: 'Electrical',
  safety: 'Safety',
  general_support: 'General Support'
};

const formatAssignmentStatus = (status) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'assigned':
      return 'Assigned';
    default:
      return status || 'Pending';
  }
};

const getDisplayStatus = (issue) => {
  const assignments = issue.technicianAssignments || [];

  if (assignments.length === 0) {
    return issue.status;
  }

  if (assignments.every((assignment) => assignment.status === 'completed')) {
    return 'Completed';
  }

  if (assignments.some((assignment) => assignment.status === 'completed')) {
    return 'Partially Completed';
  }

  return issue.status;
};

function DataCollector({ userName, onLogout }) {
  // Fallback to sessionStorage if userName prop is not available
  const displayName = userName || sessionStorage.getItem('userName');
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [locationCategory, setLocationCategory] = useState('');
  const [formData, setFormData] = useState({});
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch submitted issues from backend
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await issueAPI.getAllIssues();
        if (process.env.REACT_APP_DEBUG === 'true') console.debug('📥 All issues from backend:', response.data);
        
        // Show ALL issues (not just user's for now for debugging)
        setIssues(response.data || []);
        setError('');
      } catch (err) {
        console.error('❌ Fetch issues error:', err.response?.data || err.message);
        setIssues([]);
        // Don't set error here so form is still visible
      }
    };

    fetchIssues();
  }, []);

  // Delete issue handler
  const handleDeleteIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    console.debug(`📝 Form field updated: ${name} = "${value}"`);
    setError('');
  };

  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
    setError('');
  };

  const handleLocationChange = (e) => {
    setLocationCategory(e.target.value);
    setError('');
  };

  const validateStep1 = () => {
    if (!userType) {
      setError('Please select a user type');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return false;
    }

    if (userType === 'student') {
      if (!formData.rollNumber || !formData.year || !formData.dept) {
        setError('Please fill in all student details');
        return false;
      }
    } else if (userType === 'faculty') {
      if (!formData.facultyId || !formData.dept) {
        setError('Please fill in all faculty details');
        return false;
      }
    } else if (userType === 'data_collector') {
      if (!formData.collectorId) {
        setError('Please fill in collector ID');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.block || !formData.floor || !formData.roomNumber || !locationCategory) {
      setError('Please fill in all location details and select location type');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.condition) {
      setError('Please select a condition status');
      return false;
    }
    // Check if at least one issue or comment is provided
    const hasAnyIssue = 
      formData.whiteboardNeedsCleaning || formData.whiteboardDamaged ||
      formData.brokenChairs || formData.damagedTables ||
      formData.systemSlowPerformance || formData.systemNotWorking ||
      formData.projectorNotWorking || formData.projectorNotAvailable ||
      formData.slowInternet || formData.noInternet ||
      formData.temperatureTooHot || formData.temperatureTooCold ||
      formData.dustyEnvironment || formData.poorVentilation ||
      formData.powerSupplyFluctuating || formData.powerFailure ||
      formData.acNotWorking ||
      formData.dimLighting || formData.lightingNotWorking ||
      formData.fanNotWorking ||
      formData.junctionBoxExtraAvailable || formData.junctionBoxDamaged ||
      formData.fireEquipmentNotAvailable ||
      formData.exitBlocked ||
      formData.looseWires || formData.damagedSwitches ||
      formData.otherSuggestions;
    
    if (!hasAnyIssue) {
      setError('Please select at least one issue or provide additional comments');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const calculateProblemLevel = () => {
    // High level: Multiple issues or critical issues
    const criticalIssues = [
      formData.acNotWorking,
      formData.systemNotWorking,
      formData.powerFailure,
      formData.projectorNotWorking,
      formData.exitBlocked,
      formData.fireEquipmentNotAvailable,
      formData.looseWires,
      formData.damagedSwitches,
      formData.condition === 'Critical Issue' || formData.condition === 'Serious Issue'
    ].filter(Boolean).length;

    if (criticalIssues >= 2) return 'High';
    if (criticalIssues >= 1) return 'Medium';
    return 'Low';
  };

  const calculatePriority = () => {
    // Priority based on condition and detected issues
    let priority = 'Low'; // Default: Low priority
    let technicianType = 'general_support';

    // Critical/Safety issues -> High priority -> Safety Technician
    if (formData.exitBlocked || formData.looseWires || formData.damagedSwitches || 
        formData.fireEquipmentNotAvailable) {
      priority = 'High';
      technicianType = 'safety';
    }
    // Electrical issues (Power/AC/Lighting) -> High priority -> Electrical Technician
    else if (formData.powerFailure || formData.powerSupplyFluctuating || 
             formData.acNotWorking || formData.lightingNotWorking || formData.dimLighting ||
             formData.fanNotWorking) {
      priority = 'High';
      technicianType = 'electrical';
    }
    // System/PC or Projector issues -> High priority -> IT / System Technician
    else if (formData.systemNotWorking || formData.projectorNotWorking || 
             formData.systemSlowPerformance || formData.slowInternet || formData.noInternet ||
             formData.projectorNotAvailable) {
      priority = 'High';
      technicianType = 'it_system';
    }
    else if (formData.brokenChairs || formData.damagedTables ||
             formData.whiteboardDamaged || formData.whiteboardNeedsCleaning ||
             formData.junctionBoxDamaged) {
      priority = 'Medium';
      technicianType = 'maintenance';
    }
    // Environmental/Comfort issues -> Low priority -> General Support Technician
    else if (formData.temperatureTooHot || formData.temperatureTooCold ||
             formData.dustyEnvironment || formData.poorVentilation) {
      priority = 'Low';
      technicianType = 'general_support';
    }

    return { priority, technicianType };
  };

  const getReportedIssues = () => {
    const issues = [];
    
    // Infrastructure Issues
    if (formData.whiteboardNeedsCleaning) issues.push('Whiteboard Needs Cleaning');
    if (formData.whiteboardDamaged) issues.push('Whiteboard Damaged');
    if (formData.brokenChairs) issues.push('Broken Chairs');
    if (formData.damagedTables) issues.push('Damaged Tables');
    
    // Digital Equipment Issues
    if (formData.systemSlowPerformance) issues.push('System Slow Performance');
    if (formData.systemNotWorking) issues.push('System Not Working');
    if (formData.projectorNotWorking) issues.push('Projector Not Working');
    if (formData.projectorNotAvailable) issues.push('Projector Not Available');
    if (formData.slowInternet) issues.push('Slow Internet');
    if (formData.noInternet) issues.push('No Internet');
    
    // Environmental Issues
    if (formData.temperatureTooHot) issues.push('Temperature Too Hot');
    if (formData.temperatureTooCold) issues.push('Temperature Too Cold');
    if (formData.dustyEnvironment) issues.push('Dusty Environment');
    if (formData.poorVentilation) issues.push('Poor Ventilation');
    
    // Electrical & Power Issues
    if (formData.powerSupplyFluctuating) issues.push('Power Supply Fluctuating');
    if (formData.powerFailure) issues.push('Power Failure');
    if (formData.acNotWorking) issues.push('AC Not Working');
    if (formData.dimLighting) issues.push('Dim Lighting');
    if (formData.lightingNotWorking) issues.push('Lighting Not Working');
    if (formData.fanNotWorking) issues.push('Fan Not Working');
    if (formData.junctionBoxExtraAvailable) issues.push('Junction Box Extra Available');
    if (formData.junctionBoxDamaged) issues.push('Junction Box Damaged');
    
    // Safety Issues
    if (formData.fireEquipmentNotAvailable) issues.push('Fire Equipment Not Available');
    if (formData.exitBlocked) issues.push('Emergency Exit Blocked');
    if (formData.looseWires) issues.push('Loose Wires');
    if (formData.damagedSwitches) issues.push('Damaged Switches');
    
    return issues;
  };

  const getIssueCodes = () => {
    const codes = [];
    
    // Infrastructure Issues
    if (formData.whiteboardNeedsCleaning) codes.push('whiteboardNeedsCleaning');
    if (formData.whiteboardDamaged) codes.push('whiteboardDamaged');
    if (formData.brokenChairs) codes.push('brokenChairs');
    if (formData.damagedTables) codes.push('damagedTables');
    
    // Digital Equipment Issues
    if (formData.systemSlowPerformance) codes.push('systemSlowPerformance');
    if (formData.systemNotWorking) codes.push('systemNotWorking');
    if (formData.projectorNotWorking) codes.push('projectorNotWorking');
    if (formData.projectorNotAvailable) codes.push('projectorNotAvailable');
    if (formData.slowInternet) codes.push('slowInternet');
    if (formData.noInternet) codes.push('noInternet');
    
    // Environmental Issues
    if (formData.temperatureTooHot) codes.push('temperatureTooHot');
    if (formData.temperatureTooCold) codes.push('temperatureTooCold');
    if (formData.dustyEnvironment) codes.push('dustyEnvironment');
    if (formData.poorVentilation) codes.push('poorVentilation');
    
    // Electrical & Power Issues
    if (formData.powerSupplyFluctuating) codes.push('powerSupplyFluctuating');
    if (formData.powerFailure) codes.push('powerFailure');
    if (formData.acNotWorking) codes.push('acNotWorking');
    if (formData.dimLighting) codes.push('dimLighting');
    if (formData.lightingNotWorking) codes.push('lightingNotWorking');
    if (formData.fanNotWorking) codes.push('fanNotWorking');
    if (formData.junctionBoxExtraAvailable) codes.push('junctionBoxExtraAvailable');
    if (formData.junctionBoxDamaged) codes.push('junctionBoxDamaged');
    
    // Safety Issues
    if (formData.fireEquipmentNotAvailable) codes.push('fireEquipmentNotAvailable');
    if (formData.exitBlocked) codes.push('exitBlocked');
    if (formData.looseWires) codes.push('looseWires');
    if (formData.damagedSwitches) codes.push('damagedSwitches');
    
    return codes;
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;

    // Check if user is actually a data_collector or manager (both can submit)
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'data_collector' && userRole !== 'manager') {
      setError(`❌ Access denied: Only data collectors and managers can submit issues. Your role is: ${userRole || 'unknown'}`);
      alert(`Error: Only data collectors and managers can submit issues.\nYour current role: ${userRole || 'unknown'}\n\nPlease logout and login as a Data Collector or Manager.`);
      return;
    }

    const { priority, technicianType } = calculatePriority();
    const problemLevel = calculateProblemLevel();
    const reportedIssues = getReportedIssues();

    setLoading(true);
    setError('');

    try {
      console.log('\n📤 SUBMITTING ISSUE:');
      console.log('User Type:', userType);
      console.log('Location Category:', locationCategory);
      console.log('Location Block:', formData.block);
      console.log('Location Floor:', formData.floor);
      console.log('Location Room:', formData.roomNumber);
      console.log('Condition:', formData.condition);
      console.log('Priority:', priority);
      console.log('Technician Type:', technicianType);
      
      if (process.env.REACT_APP_DEBUG === 'true') {
        console.debug('\n📤 Submitting Issue:');
        console.debug('Token:', sessionStorage.getItem('token')?.substring(0, 30) + '...');
        console.debug('User Role:', sessionStorage.getItem('userRole'));
        console.debug('User Name:', sessionStorage.getItem('userName'));
        console.debug('Issue Data:', {
          userType,
          locationCategory,
          block: formData.block,
          floor: formData.floor,
          roomNumber: formData.roomNumber,
          condition: formData.condition,
          problemLevel,
          priority,
          technicianType,
          reportedIssues
        });
      }

      const issueData = {
        userType,
        location: {
          category: locationCategory,
          block: formData.block,
          floor: formData.floor,
          roomNumber: formData.roomNumber
        },
        reporter: {
          name: formData.name,
          email: formData.email,
          rollNumber: formData.rollNumber,
          year: formData.year,
          dept: formData.dept
        },
        condition: formData.condition,
        problemLevel,
        otherSuggestions: formData.otherSuggestions,
        specificIssues: reportedIssues, // Array of specific issues found
        issues: getIssueCodes(), // Array of issue codes (e.g., ["slowInternet", "projectorNotWorking"])
        data: formData,
        priority,
        technicianType,
        status: 'submitted',
        timestamps: {
          submitted: new Date()
        }
      };

      // Send to backend API
      const response = await issueAPI.createIssue(issueData);
      console.log('✅ Issue submitted successfully:', response.data);
      
      // Immediately show the newly created issue in the UI for the submitter
      setIssues(prev => [response.data, ...(prev || [])]);

      // Build detailed success message
      const issuesList = reportedIssues.length > 0 
        ? reportedIssues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')
        : 'No specific issues reported';
      
      alert(`Issue Submitted Successfully!\n\nOverall Condition: ${formData.condition}\n\nReported Issues:\n${issuesList}${formData.otherSuggestions ? `\n\nAdditional Comments:\n${formData.otherSuggestions}` : ''}`);
      
      // Background: still attempt to refresh from server (best-effort)
      issueAPI.getAllIssues().then(r => {
        setIssues(r.data || []);
        console.log('🔁 Background refresh succeeded');
      }).catch(() => {
        console.warn('⚠️ Background refresh failed — using optimistic update');
      });

      // Reset form
      setFormData({});
      setUserType('');
      setLocationCategory('');
      setCurrentStep(1);
      setError('');
    } catch (err) {
      console.error('❌ Submit issue error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMsg = err.response?.data?.details || err.response?.data?.message || 'Failed to submit issue. Please check your role.';
      setError(`❌ ${errorMsg}`);
      
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-collector-container">
      <Navbar userName={displayName} role="Data Collector" onLogout={onLogout} />
      
      <div className="data-collector-main">
        <div className="data-collector-header">
          <h2>Environmental Data Collection Form</h2>
          <p>Submit facility conditions for review and management</p>
        </div>

        <div className="data-collector-content">
          <div className="form-wrapper">
            {/* Step Indicator */}
            <div className="step-indicator">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
              <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
              <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
              <div className={`step-line ${currentStep >= 4 ? 'active' : ''}`}></div>
              <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4</div>
            </div>

            <div className="step-title">
              {currentStep === 1 && 'Step 1: Select User Type'}
              {currentStep === 2 && 'Step 2: Personal Details'}
              {currentStep === 3 && 'Step 3: Location Details'}
              {currentStep === 4 && 'Step 4: Condition Details'}
            </div>

            <form className="form-content">
              {/* Step 1: User Type */}
              {currentStep === 1 && (
                <div className="form-step">
                  <div className="form-group">
                    <label className="form-label">Select Your Type *</label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="userType"
                          value="student"
                          checked={userType === 'student'}
                          onChange={handleUserTypeChange}
                        />
                        <span className="radio-label">Student</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="userType"
                          value="faculty"
                          checked={userType === 'faculty'}
                          onChange={handleUserTypeChange}
                        />
                        <span className="radio-label">Faculty</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="userType"
                          value="data_collector"
                          checked={userType === 'data_collector'}
                          onChange={handleUserTypeChange}
                        />
                        <span className="radio-label">Data Collector</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {currentStep === 2 && (
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={formData.name || ''}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={formData.email || ''}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                    />
                  </div>

                  {userType === 'student' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="rollNumber" className="form-label">Roll Number *</label>
                        <input
                          type="text"
                          id="rollNumber"
                          name="rollNumber"
                          className="form-input"
                          value={formData.rollNumber || ''}
                          onChange={handleChange}
                          placeholder="Enter your roll number"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="year" className="form-label">Year *</label>
                          <select
                            id="year"
                            name="year"
                            className="form-input form-select"
                            value={formData.year || ''}
                            onChange={handleChange}
                          >
                            <option value="">Select Year</option>
                            <option value="1st">1st Year</option>
                            <option value="2nd">2nd Year</option>
                            <option value="3rd">3rd Year</option>
                            <option value="4th">4th Year</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="dept" className="form-label">Department *</label>
                          <input
                            type="text"
                            id="dept"
                            name="dept"
                            className="form-input"
                            value={formData.dept || ''}
                            onChange={handleChange}
                            placeholder="Enter your department"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {userType === 'faculty' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="facultyId" className="form-label">Faculty ID *</label>
                          <input
                            type="text"
                            id="facultyId"
                            name="facultyId"
                            className="form-input"
                            value={formData.facultyId || ''}
                            onChange={handleChange}
                            placeholder="Enter your faculty ID"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="dept" className="form-label">Department *</label>
                          <input
                            type="text"
                            id="dept"
                            name="dept"
                            className="form-input"
                            value={formData.dept || ''}
                            onChange={handleChange}
                            placeholder="Enter your department"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {userType === 'data_collector' && (
                    <div className="form-group">
                      <label htmlFor="collectorId" className="form-label">Collector ID *</label>
                      <input
                        type="text"
                        id="collectorId"
                        name="collectorId"
                        className="form-input"
                        value={formData.collectorId || ''}
                        onChange={handleChange}
                        placeholder="Enter your collector ID"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Location Details */}
              {currentStep === 3 && (
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="block" className="form-label">Block *</label>
                    <select
                      id="block"
                      name="block"
                      className="form-input form-select"
                      value={formData.block || ''}
                      onChange={handleChange}
                    >
                      <option value="">Select Block</option>
                      <option value="AS">AS Block</option>
                      <option value="IB">IB Block</option>
                      <option value="SUNFLOWER">Sunflower Block</option>
                      <option value="MECHANICAL">Mechanical Block</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="floor" className="form-label">Floor *</label>
                    <select
                      id="floor"
                      name="floor"
                      className="form-input form-select"
                      value={formData.floor || ''}
                      onChange={handleChange}
                    >
                      <option value="">Select Floor</option>
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="1st Floor">1st Floor</option>
                      <option value="2nd Floor">2nd Floor</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="roomNumber" className="form-label">Room Number *</label>
                    <input
                      type="text"
                      id="roomNumber"
                      name="roomNumber"
                      className="form-input"
                      value={formData.roomNumber || ''}
                      onChange={handleChange}
                      onInput={handleChange}
                      placeholder="Enter room number"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="locationType" className="form-label">Location Type *</label>
                    <select
                      id="locationType"
                      name="locationType"
                      className="form-input form-select"
                      value={locationCategory || ''}
                      onChange={handleLocationChange}
                    >
                      <option value="">Select Location Type</option>
                      <option value="classroom">Classroom</option>
                      <option value="lab">Lab</option>
                      <option value="seminar">Seminar Hall</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 4: Condition Details */}
              {currentStep === 4 && (
                <div className="form-step">
                  {/* Section 1: Overall Condition Status */}
                  <div className="form-section">
                    <h3 className="section-title">1. Overall Condition Status</h3>
                    <div className="form-group">
                      <label htmlFor="condition" className="form-label">Severity Level *</label>
                      <select
                        id="condition"
                        name="condition"
                        className="form-input form-select"
                        value={formData.condition || ''}
                        onChange={handleChange}
                      >
                        <option value="">Select Condition</option>
                        <option value="Moderate Issue">Moderate Issue</option>
                        <option value="Serious Issue">Serious Issue</option>
                        <option value="Critical Issue">Critical Issue</option>
                      </select>
                    </div>
                  </div>

                  {/* Section 2: Classroom Infrastructure Issues */}
                  <div className="form-section">
                    <h3 className="section-title">2. Classroom Infrastructure Issues</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Whiteboard Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="whiteboardNeedsCleaning"
                            checked={formData.whiteboardNeedsCleaning || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Needs Cleaning</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="whiteboardDamaged"
                            checked={formData.whiteboardDamaged || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Damaged</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Furniture Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="brokenChairs"
                            checked={formData.brokenChairs || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Broken Chairs</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="damagedTables"
                            checked={formData.damagedTables || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Damaged Tables</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Digital Equipment Issues */}
                  <div className="form-section">
                    <h3 className="section-title">3. Digital Equipment Issues</h3>
                    
                    <div className="form-group">
                      <label className="form-label">System / PC Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="systemSlowPerformance"
                            checked={formData.systemSlowPerformance || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Slow Performance</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="systemNotWorking"
                            checked={formData.systemNotWorking || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Not Working</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Projector Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="projectorNotWorking"
                            checked={formData.projectorNotWorking || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Not Working</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="projectorNotAvailable"
                            checked={formData.projectorNotAvailable || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Not Available</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Internet Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="slowInternet"
                            checked={formData.slowInternet || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Slow Internet</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="noInternet"
                            checked={formData.noInternet || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>No Internet</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Environmental Issues */}
                  <div className="form-section">
                    <h3 className="section-title">4. Environmental Issues</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Temperature Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="temperatureTooHot"
                            checked={formData.temperatureTooHot || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Too Hot</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="temperatureTooCold"
                            checked={formData.temperatureTooCold || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Too Cold</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Air Quality Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="dustyEnvironment"
                            checked={formData.dustyEnvironment || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Dusty Environment</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="poorVentilation"
                            checked={formData.poorVentilation || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Poor Ventilation</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Electrical & Power Issues */}
                  <div className="form-section">
                    <h3 className="section-title">5. Electrical & Power Issues</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Power Supply Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="powerSupplyFluctuating"
                            checked={formData.powerSupplyFluctuating || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Fluctuating Power</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="powerFailure"
                            checked={formData.powerFailure || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Power Failure</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">AC Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="acNotWorking"
                            checked={formData.acNotWorking || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Not Working</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lighting Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="dimLighting"
                            checked={formData.dimLighting || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Dim Lighting</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="lightingNotWorking"
                            checked={formData.lightingNotWorking || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Not Working</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Fan Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="fanNotWorking"
                            checked={formData.fanNotWorking || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Not Working</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Junction Box Status</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="junctionBoxExtraAvailable"
                            checked={formData.junctionBoxExtraAvailable || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Extra Available</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="junctionBoxDamaged"
                            checked={formData.junctionBoxDamaged || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Damaged</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Safety Risk Identification */}
                  <div className="form-section">
                    <h3 className="section-title">6. Safety Risk Identification</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Fire Safety Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="fireEquipmentNotAvailable"
                            checked={formData.fireEquipmentNotAvailable || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Fire Equipment Not Available</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Emergency Exit Issue</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="exitBlocked"
                            checked={formData.exitBlocked || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Exit Blocked</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Electrical Hazard</label>
                      <div className="checkbox-group">
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="looseWires"
                            checked={formData.looseWires || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Loose Wires</span>
                        </label>
                        <label className="checkbox-option">
                          <input
                            type="checkbox"
                            name="damagedSwitches"
                            checked={formData.damagedSwitches || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                          />
                          <span>Damaged Switches</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 7: Additional Issue Details */}
                  <div className="form-section">
                    <h3 className="section-title">7. Additional Issue Details</h3>
                    <div className="form-group">
                      <label htmlFor="otherSuggestions" className="form-label">Other Issue / Suggestions</label>
                      <textarea
                        id="otherSuggestions"
                        name="otherSuggestions"
                        className="form-input form-textarea"
                        value={formData.otherSuggestions || ''}
                        onChange={handleChange}
                        placeholder="Add any other observations, suggestions, or recommendations... (e.g., Broken desk, AC noise problem, Projector cable issue)"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              {/* Navigation Buttons */}
              <div className="button-group">
                {currentStep > 1 && (
                  <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                    Previous
                  </button>
                )}
                {currentStep < 4 && (
                  <button type="button" className="btn-primary" onClick={handleNextStep}>
                    Next
                  </button>
                )}
                {currentStep === 4 && (
                  <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Submitted Issues */}
          <div className="issues-panel">
            <div className="panel-header">
              <h3>Submitted Reports ({issues.length})</h3>
            </div>

            {issues.length === 0 ? (
              <div className="empty-state">
                <p>No reports submitted yet</p>
              </div>
            ) : (
              <div className="issues-list">
                {issues.map((issue) => (
                  <div key={issue._id} className="issue-card">
                    <div className="issue-header">
                      <span className="issue-type">{issue.userType}</span>
                      <span className="issue-status">{getDisplayStatus(issue)}</span>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteIssue(issue._id)}
                        title="Delete this issue"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="issue-time">
                      {issue.timestamps?.submitted ? new Date(issue.timestamps.submitted).toLocaleString() : 'Just now'}
                    </p>
                    <p className="issue-info">
                      <strong>Location:</strong> {issue.location?.block} Block, {issue.location?.floor}, Room {issue.location?.roomNumber || 'N/A'}
                    </p>
                    <p className="issue-info">
                      <strong>Condition:</strong> {issue.condition}
                    </p>
                    <p className="issue-info">
                      <strong>Priority:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>P{issue.priority}</span>
                    </p>
                    {issue.technicianAssignments?.length > 0 && (
                      <div className="issue-info">
                        <strong>Technician Progress:</strong>
                        <div style={{ marginTop: '0.35rem', marginLeft: '10px' }}>
                          {issue.technicianAssignments.map((assignment, idx) => (
                            <div key={`${assignment.technicianType}-${idx}`} style={{ marginBottom: '0.4rem' }}>
                              <strong>{TECHNICIAN_TYPE_LABELS[assignment.technicianType] || assignment.technicianType}:</strong>{' '}
                              {formatAssignmentStatus(assignment.status)}
                              {assignment.notes ? ` - ${assignment.notes}` : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Specific Issues Found */}
                    <p className="issue-info">
                      <strong>Specific Issues Found:</strong>
                    </p>
                    {issue.specificIssues && issue.specificIssues.length > 0 ? (
                      <div style={{ marginLeft: '10px', fontSize: '0.9rem' }}>
                        {issue.specificIssues.map((problem, idx) => (
                          <div key={idx} style={{ color: '#e74c3c', marginBottom: '0.3rem' }}>
                            • {problem}
                          </div>
                        ))}
                      </div>
                    ) : issue.data ? (
                      <div style={{ marginLeft: '10px', fontSize: '0.9rem' }}>
                        {(() => {
                          const problems = [];
                          const data = issue.data;
                          
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
                                {problems.map((p, i) => <p key={i} style={{ margin: '3px 0', color: '#e74c3c' }}>{p}</p>)}
                                {data.otherSuggestions && (
                                  <>
                                    <p style={{ margin: '6px 0 3px 0', color: '#2c3e50', fontWeight: '500' }}>📋 Additional Comments:</p>
                                    <p style={{ margin: '3px 0', color: '#555', fontStyle: 'italic' }}>{data.otherSuggestions}</p>
                                  </>
                                )}
                              </>
                            );
                          } else {
                            return <p style={{ margin: '3px 0', color: '#27ae60' }}>✓ No specific issues - all systems normal</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <p style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#7f8c8d' }}>No issues recorded</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataCollector;


