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

function DataCollector({ userName, onLogout }) {
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
        console.log('📥 All issues from backend:', response.data);
        
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
    
    // Refresh every 5 seconds to show latest
    const interval = setInterval(fetchIssues, 5000);
    return () => clearInterval(interval);
  }, [userName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    if (!formData.name) {
      setError('Name is required');
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
    // Check if at least one detail field is filled
    const hasAnyDetail = formData.whiteboard || formData.ac || formData.systemPc || 
                         formData.temperature || formData.powerSupply || formData.projector ||
                         formData.whiteboards || formData.seatsAvailability || formData.junctionBox ||
                         formData.mikeCondition || formData.otherSuggestions;
    
    if (!hasAnyDetail) {
      setError('Please provide at least one detail about the condition');
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
      formData.ac === 'Not Working',
      formData.powerSupply === 'Frequent Outages',
      formData.projector === 'Not Working',
      formData.systemPc === 'Not Working',
      formData.junctionBox === 'Unsafe',
      formData.condition === 'Critical' || formData.condition === 'Poor'
    ].filter(Boolean).length;

    if (criticalIssues >= 2) return 'High';
    if (criticalIssues >= 1) return 'Medium';
    return 'Low';
  };

  const calculatePriority = () => {
    // Priority based on condition and location type
    const severity = formData.condition?.toLowerCase();
    let priority = 'Low'; // Default: Low priority
    let technicianType = 'Others';

    // Water supply issues -> High priority
    if (formData.powerSupply?.toLowerCase().includes('water') || 
        formData.waterSupply) {
      priority = 'High';
      technicianType = 'Water Management';
    }
    // Projector problems -> High priority
    else if (formData.projector === 'Not Working' || 
             formData.projector === 'not_working') {
      priority = 'High';
      technicianType = 'Electricity';
    }
    // Electricity/power supply or AC not working -> High priority
    else if (formData.powerSupply?.toLowerCase().includes('outage') || 
             formData.powerSupply === 'Frequent Outages' ||
             formData.ac === 'Not Working') {
      priority = 'High';
      technicianType = 'Electricity';
    }
    // Cleanliness or poor condition -> Medium priority
    else if (formData.whiteboard === 'Poor' || 
             formData.whiteboards === 'Poor' ||
             severity === 'poor') {
      priority = 'Medium';
      technicianType = 'Cleaning';
    }

    return { priority, technicianType };
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;

    const { priority, technicianType } = calculatePriority();
    const problemLevel = calculateProblemLevel();

    setLoading(true);
    setError('');

    try {
      console.log('\n📤 Submitting Issue:');
      console.log('Token:', localStorage.getItem('token')?.substring(0, 30) + '...');
      console.log('User Role:', localStorage.getItem('userRole'));
      console.log('User Name:', localStorage.getItem('userName'));
      
      const issueData = {
        userType,
        locationCategory,
        block: formData.block,
        floor: formData.floor,
        roomNumber: formData.roomNumber,
        condition: formData.condition,
        problemLevel,
        otherSuggestions: formData.otherSuggestions,
        data: formData,
        priority,
        technicianType,
        status: 'submitted'
      };

      console.log('Issue Data:', issueData);

      // Send to backend API
      const response = await issueAPI.createIssue(issueData);
      console.log('✅ Issue submitted successfully:', response.data);
      
      alert(`Issue submitted successfully!\nPriority: P${priority}\nProblem Level: ${problemLevel}\nTechnician Type: ${technicianType}`);
      
      // Refresh issues list
      try {
        const updatedIssuesResponse = await issueAPI.getAllIssues();
        setIssues(updatedIssuesResponse.data || []);
        console.log('✅ Issues refreshed:', updatedIssuesResponse.data);
      } catch (refreshErr) {
        console.error('⚠️ Could not refresh issues list:', refreshErr);
      }
      
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
      <Navbar userName={userName} role="Data Collector" onLogout={onLogout} />
      
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
                      placeholder="Enter room number"
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
                  <div className="form-group">
                    <label htmlFor="condition" className="form-label">Overall Condition Status *</label>
                    <select
                      id="condition"
                      name="condition"
                      className="form-input form-select"
                      value={formData.condition || ''}
                      onChange={handleChange}
                    >
                      <option value="">Select Condition</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Classroom Condition Fields */}
                  {locationCategory === 'classroom' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="whiteboard" className="form-label">Whiteboard Condition *</label>
                        <select
                          id="whiteboard"
                          name="whiteboard"
                          className="form-input form-select"
                          value={formData.whiteboard || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="ac" className="form-label">AC Status *</label>
                        <select
                          id="ac"
                          name="ac"
                          className="form-input form-select"
                          value={formData.ac || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Partially Working">Partially Working</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="systemPc" className="form-label">System/PC Status *</label>
                        <select
                          id="systemPc"
                          name="systemPc"
                          className="form-input form-select"
                          value={formData.systemPc || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Not Available">Not Available</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="temperature" className="form-label">Temperature (°C) *</label>
                        <input
                          type="number"
                          id="temperature"
                          name="temperature"
                          className="form-input"
                          value={formData.temperature || ''}
                          onChange={handleChange}
                          placeholder="Enter temperature"
                          min="0"
                          max="50"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="powerSupply" className="form-label">Power Supply Status *</label>
                        <select
                          id="powerSupply"
                          name="powerSupply"
                          className="form-input form-select"
                          value={formData.powerSupply || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Stable">Stable</option>
                          <option value="Fluctuating">Fluctuating</option>
                          <option value="Frequent Outages">Frequent Outages</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Lab Condition Fields */}
                  {locationCategory === 'lab' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="ac" className="form-label">AC Status *</label>
                        <select
                          id="ac"
                          name="ac"
                          className="form-input form-select"
                          value={formData.ac || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Partially Working">Partially Working</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="powerSupply" className="form-label">Power Supply Status *</label>
                        <select
                          id="powerSupply"
                          name="powerSupply"
                          className="form-input form-select"
                          value={formData.powerSupply || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Stable">Stable</option>
                          <option value="Fluctuating">Fluctuating</option>
                          <option value="Frequent Outages">Frequent Outages</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="systemPc" className="form-label">System/PC Status *</label>
                        <select
                          id="systemPc"
                          name="systemPc"
                          className="form-input form-select"
                          value={formData.systemPc || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Not Available">Not Available</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="projector" className="form-label">Projector Status *</label>
                        <select
                          id="projector"
                          name="projector"
                          className="form-input form-select"
                          value={formData.projector || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Not Available">Not Available</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="whiteboards" className="form-label">Whiteboards Condition *</label>
                        <select
                          id="whiteboards"
                          name="whiteboards"
                          className="form-input form-select"
                          value={formData.whiteboards || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="seatsAvailability" className="form-label">Seats Availability *</label>
                        <input
                          type="number"
                          id="seatsAvailability"
                          name="seatsAvailability"
                          className="form-input"
                          value={formData.seatsAvailability || ''}
                          onChange={handleChange}
                          placeholder="Number of available seats"
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="junctionBox" className="form-label">Junction Box Status *</label>
                        <select
                          id="junctionBox"
                          name="junctionBox"
                          className="form-input form-select"
                          value={formData.junctionBox || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Safe">Safe</option>
                          <option value="Needs Attention">Needs Attention</option>
                          <option value="Unsafe">Unsafe</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Seminar Hall Condition Fields */}
                  {locationCategory === 'seminar' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="projector" className="form-label">Projector Status *</label>
                        <select
                          id="projector"
                          name="projector"
                          className="form-input form-select"
                          value={formData.projector || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Not Available">Not Available</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="systemPc" className="form-label">System/PC Status *</label>
                        <select
                          id="systemPc"
                          name="systemPc"
                          className="form-input form-select"
                          value={formData.systemPc || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Not Available">Not Available</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="whiteboard" className="form-label">Whiteboard Condition *</label>
                        <select
                          id="whiteboard"
                          name="whiteboard"
                          className="form-input form-select"
                          value={formData.whiteboard || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="powerSupply" className="form-label">Power Supply Status *</label>
                        <select
                          id="powerSupply"
                          name="powerSupply"
                          className="form-input form-select"
                          value={formData.powerSupply || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Stable">Stable</option>
                          <option value="Fluctuating">Fluctuating</option>
                          <option value="Frequent Outages">Frequent Outages</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="ac" className="form-label">AC Status *</label>
                        <select
                          id="ac"
                          name="ac"
                          className="form-input form-select"
                          value={formData.ac || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Working">Working</option>
                          <option value="Not Working">Not Working</option>
                          <option value="Partially Working">Partially Working</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="temperature" className="form-label">Temperature (°C) *</label>
                        <input
                          type="number"
                          id="temperature"
                          name="temperature"
                          className="form-input"
                          value={formData.temperature || ''}
                          onChange={handleChange}
                          placeholder="Enter temperature"
                          min="0"
                          max="50"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="mikeCondition" className="form-label">Mike/Speaker Condition *</label>
                        <select
                          id="mikeCondition"
                          name="mikeCondition"
                          className="form-input form-select"
                          value={formData.mikeCondition || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="Good">Good</option>
                          <option value="Needs Repair">Needs Repair</option>
                          <option value="Not Available">Not Available</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Other Suggestions - Common for all location types */}
                  <div className="form-group">
                    <label htmlFor="otherSuggestions" className="form-label">Other Suggestions / Additional Comments</label>
                    <textarea
                      id="otherSuggestions"
                      name="otherSuggestions"
                      className="form-input form-textarea"
                      value={formData.otherSuggestions || ''}
                      onChange={handleChange}
                      placeholder="Add any other observations, suggestions, or recommendations..."
                      rows="3"
                    ></textarea>
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
                      <span className="issue-status">{issue.status}</span>
                    </div>
                    <p className="issue-time">
                      {issue.timestamps?.submitted ? new Date(issue.timestamps.submitted).toLocaleString() : 'Just now'}
                    </p>
                    <p className="issue-info">
                      <strong>Reported by:</strong> {issue.submittedBy?.fullName || 'System'}
                    </p>
                    <p className="issue-info">
                      <strong>Location:</strong> {issue.block} Block, {issue.floor}, Room {issue.roomNumber}
                    </p>
                    <p className="issue-info">
                      <strong>Condition:</strong> {issue.condition}
                    </p>
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


