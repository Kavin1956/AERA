import React, { useState, useEffect } from 'react';
import '../styles/Manager.css';
import Navbar from '../components/Navbar';
import { issueAPI } from '../services/api';

const WARNING_THRESHOLD_HOURS = 5;
const ASSIGNMENT_REMINDER_THRESHOLD_HOURS = 3;
const LOCATION_TYPE_LABELS = {
  classroom: 'Classroom',
  laboratory: 'Laboratory',
  lab: 'Laboratory',
  seminar_hall: 'Seminar Hall',
  seminar: 'Seminar Hall',
  special_lab: 'Special Lab'
};
const ISSUE_GROUPS = {
  maintenance: ['whiteboardNeedsCleaning', 'whiteboardDamaged', 'brokenChairs', 'damagedTables'],
  it_system: ['systemSlowPerformance', 'systemNotWorking', 'projectorNotWorking', 'projectorNotAvailable', 'slowInternet', 'noInternet'],
  electrical: ['temperatureTooHot', 'temperatureTooCold', 'dustyEnvironment', 'poorVentilation', 'powerSupplyFluctuating', 'powerFailure', 'acNotWorking', 'dimLighting', 'lightingNotWorking', 'fanNotWorking', 'junctionBoxExtraAvailable', 'junctionBoxDamaged'],
  safety: ['fireEquipmentNotAvailable', 'exitBlocked', 'looseWires', 'damagedSwitches']
};

const normalizeLocationCategory = (category = '') => {
  const normalized = String(category).trim().toLowerCase();

  if (normalized === 'seminar hall') return 'seminar_hall';
  if (normalized === 'special lab') return 'special_lab';

  return normalized;
};

const getLocationDetails = (location = {}, data = {}) => {
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

const getReporterDetails = (issue = {}) => ({
  name: issue.reporterName || issue.reporter?.name || issue.submittedBy?.fullName || issue.submittedBy?.username || 'Unknown',
  email: issue.reporterEmail || issue.reporter?.email || issue.submittedBy?.email || 'Not provided'
});

const sortIssuesBySubmitted = (issueList = []) => (
  [...issueList].sort((a, b) => {
    const aTime = a?.timestamps?.submitted ? new Date(a.timestamps.submitted).getTime() : 0;
    const bTime = b?.timestamps?.submitted ? new Date(b.timestamps.submitted).getTime() : 0;
    return bTime - aTime;
  })
);

const sortIssuesBySubmittedOldestFirst = (issueList = []) => (
  [...issueList].sort((a, b) => {
    const aTime = a?.timestamps?.submitted ? new Date(a.timestamps.submitted).getTime() : 0;
    const bTime = b?.timestamps?.submitted ? new Date(b.timestamps.submitted).getTime() : 0;
    return aTime - bTime;
  })
);

const ITEMS_PER_PAGE = 10;

const deriveRecommendedTechnicianTypes = (issue) => {
  if (!issue) return [];

  if (issue.technicianTypes?.length) {
    return issue.technicianTypes;
  }

  const issueCodes = new Set(issue.issues || []);
  const recommended = new Set();

  Object.entries(ISSUE_GROUPS).forEach(([techType, codes]) => {
    if (codes.some((code) => issueCodes.has(code))) {
      recommended.add(techType);
    }
  });

  if ((issue.otherSuggestions || issue.data?.otherSuggestions || '').trim()) {
    recommended.add('general_support');
  }

  if (recommended.size === 0 && issue.technicianType) {
    recommended.add(issue.technicianType);
  }

  return [...recommended];
};

const getPrimaryTechnicianType = (issue) => {
  const recommendedTypes = deriveRecommendedTechnicianTypes(issue);

  if (issue?.technicianType) {
    return issue.technicianType;
  }

  if (recommendedTypes.length > 0) {
    return recommendedTypes[0];
  }

  return issue?.issueType || 'general_support';
};
const WARNING_COPY = {
  notSolved: '⚠ Issue not solved yet. Please take action.',
  noResponse: '⚠ No response from technician.'
};

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
  const [filterTechnicianType, setFilterTechnicianType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnicianTypes, setSelectedTechnicianTypes] = useState([]);
  const [analysisRisk, setAnalysisRisk] = useState('');
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [analyticsData, setAnalyticsData] = useState({});
  const [showDelayedWarnings, setShowDelayedWarnings] = useState(false);
  const [showManagerNotifications, setShowManagerNotifications] = useState(false);
  const [currentIssuesPage, setCurrentIssuesPage] = useState(1);
  const [historyIssuesPage, setHistoryIssuesPage] = useState(1);
  const [previousIssueCount, setPreviousIssueCount] = useState(0); // Track previous count to detect new issues
  const sortedIssuesBySubmission = sortIssuesBySubmittedOldestFirst(issues);
  const issueDisplayIdMap = sortedIssuesBySubmission.reduce((acc, issue, index) => {
    acc[issue._id] = `IS${index + 1}`;
    return acc;
  }, {});
  const getIssueDisplayId = (issue) => issueDisplayIdMap[issue?._id] || 'IS-';

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
        console.log('📥 ALL ISSUES RECEIVED:', JSON.stringify(response.data?.slice(0, 2), null, 2));
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

    // Initial fetch immediately on mount
    fetchIssues();
    
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

  const getTechnicianTypesDisplay = (issue) => {
    const types = issue?.technicianTypes?.length ? issue.technicianTypes : (issue?.technicianType ? [issue.technicianType] : []);
    if (types.length === 0) return 'Pending';
    return types.map((type) => getTechnicianTypeDisplay(type)).join(', ');
  };

  const openIssueDetails = (issue, displayId) => {
    setSelectedIssue(issue);
    setSelectedIssueDisplayId(displayId);
    setSelectedTechnicianTypes(deriveRecommendedTechnicianTypes(issue));
    setAnalysisRisk(issue.risk || '');
    setAnalysisNotes(issue.analysisNotes || '');
    setShowDetails(true);
  };

  const toggleTechnicianType = (techType) => {
    setSelectedTechnicianTypes((current) =>
      current.includes(techType)
        ? current.filter((type) => type !== techType)
        : [...current, techType]
    );
  };

  // (removed) priority class helper no longer needed since priority is plain text
  // Check if an issue is newly submitted (within last 2 minutes)
  const isNewIssue = (issue) => {
    if (!issue.timestamps?.submitted) return false;
    const submittedTime = new Date(issue.timestamps.submitted);
    const now = new Date();
    const minutesAgo = (now - submittedTime) / (1000 * 60);
    return minutesAgo < 2; // Highlight as "new" if submitted within 2 minutes
  };

  const formatLocationForTable = (loc, data) => {
    if (!loc) return '';
    const parts = [];
    const locationDetails = getLocationDetails(loc, data);

    if (loc.block) {
      parts.push(String(loc.block).toUpperCase());
    }

    if (loc.floor) {
      const floorValue = String(loc.floor).trim().toLowerCase();
      const floorLabels = {
        '0': 'Ground Floor',
        'ground': 'Ground Floor',
        'ground floor': 'Ground Floor',
        '1': 'First Floor',
        '1st': 'First Floor',
        '1st floor': 'First Floor',
        'first': 'First Floor',
        'first floor': 'First Floor',
        '2': 'Second Floor',
        '2nd': 'Second Floor',
        '2nd floor': 'Second Floor',
        'second': 'Second Floor',
        'second floor': 'Second Floor',
        '3': 'Third Floor',
        '3rd': 'Third Floor',
        '3rd floor': 'Third Floor',
        'third': 'Third Floor',
        'third floor': 'Third Floor'
      };
      parts.push(floorLabels[floorValue] || String(loc.floor));
    }

    if (locationDetails.detailValue) {
      parts.push(`${locationDetails.detailLabel}: ${locationDetails.detailValue}`);
    }

    return parts.filter(Boolean).join(', ');
  };

  const getIssueWarningDetails = (issue) => {
    if (!['assigned', 'in_progress'].includes(issue.status)) {
      return { status: null, message: '', isDelayed: false, hoursOpen: 0 };
    }

    const startedAt = issue.timestamps?.assigned || issue.timestamps?.submitted;
    const hoursOpen = startedAt ? (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60) : 0;
    const hasTechnicianResponse = Boolean(issue.technicianNotes?.trim());
    const warningStatus = hasTechnicianResponse ? 'notSolved' : 'noResponse';

    return {
      status: hoursOpen >= WARNING_THRESHOLD_HOURS ? warningStatus : null,
      message: hoursOpen >= WARNING_THRESHOLD_HOURS ? WARNING_COPY[warningStatus] : '',
      isDelayed: hoursOpen >= WARNING_THRESHOLD_HOURS,
      hoursOpen
    };
  };

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

    const countsByType = dataSourceIssues.reduce((acc, issue) => {
      const primaryType = getPrimaryTechnicianType(issue);
      acc[primaryType] = (acc[primaryType] || 0) + 1;
      return acc;
    }, {});

    const electricalCount = countsByType.electrical || 0;
    const itSystemCount = countsByType.it_system || 0;
    const maintenanceCount = countsByType.maintenance || 0;
    const safetyCount = countsByType.safety || 0;
    const generalSupportCount = countsByType.general_support || 0;
    const weeklyTotalCount = dataSourceIssues.length;

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
      const typesToAssign = selectedTechnicianTypes.length > 0
        ? selectedTechnicianTypes
        : deriveRecommendedTechnicianTypes(selectedIssue);
      const payload = {
        risk: analysisRisk || undefined,
        analysisNotes: analysisNotes || undefined,
        technicianType: typesToAssign[0] || undefined,
        technicianTypes: typesToAssign,
        status: 'assigned'
      };

      console.log('📤 Assigning issue:', issueId);
      console.log('   Payload:', payload);
      console.log('   selectedTechnicianTypes:', typesToAssign);

      const response = await issueAPI.updateIssueStatus(issueId, payload);
      console.log('✅ Response received:', response.data);
      console.log('   Issue technicianType:', response.data.technicianType);
      console.log('   Issue status:', response.data.status);
      console.log('   Assigned to:', response.data.assignedTechnician?.username);

      // Update local state
      setIssues(issues.map(i => i._id === issueId ? response.data : i));

      alert('Analysis saved and issue assigned.');
      setSelectedTechnicianTypes([]);
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
    if (!issueId) {
      alert('Error: Issue ID is missing');
      return;
    }

    const warningMessage = prompt('Enter warning message for the technician (optional):', 
      '⚠️ This issue requires your immediate attention');
    
    if (warningMessage === null) {
      // User cancelled
      return;
    }

    try {
      console.log(`📨 Sending warning alert for issue ${issueId}`);
      
      // Call the backend API to send warning
      const response = await issueAPI.sendWarningAlert(issueId, {
        message: warningMessage || '⚠️ This issue requires your immediate attention'
      });

      console.log('✅ Warning alert sent:', response);
      
      // Update local state to mark warning sent
      setIssues(issues.map(i =>
        i._id === issueId ? { 
          ...i, 
          warningAlert: true,
          warningMessage: warningMessage || 'Warning: This issue requires your immediate attention.',
          lastWarningAlert: new Date()
        } : i
      ));

      // Update selected issue display
      if (selectedIssue && selectedIssue._id === issueId) {
        setSelectedIssue(prev => ({
          ...prev,
          warningAlert: true,
          warningMessage: warningMessage || 'Warning: This issue requires your immediate attention.',
          lastWarningAlert: new Date()
        }));
      }

      alert('✅ Warning alert sent to assigned technician!');
    } catch (err) {
      console.error('❌ Send warning error:', err);
      alert('Failed to send warning alert: ' + (err.response?.data?.message || err.message));
    }
  };

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

  const getAssignmentReminderDetails = (issue) => {
    if (issue.status !== 'submitted') {
      return { isDelayed: false, hoursWaiting: 0 };
    }

    const submittedAt = issue.timestamps?.submitted;
    const hoursWaiting = submittedAt
      ? (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60)
      : 0;

    return {
      isDelayed: hoursWaiting >= ASSIGNMENT_REMINDER_THRESHOLD_HOURS,
      hoursWaiting
    };
  };

  const applySearchFilter = (issueList = []) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return issueList;
    }

    return issueList.filter((issue) => {
      const locationText = formatLocationForTable(issue.location, issue.data);
      const searchFields = [
        getIssueDisplayId(issue),
        issue.condition,
        issue.priority,
        issue.status,
        issue.userType,
        getReporterDetails(issue).name,
        getReporterDetails(issue).email,
        getLocationDetails(issue.location, issue.data).categoryLabel,
        locationText,
        getTechnicianTypesDisplay(issue),
        ...(issue.specificIssues || []),
        issue.otherSuggestions,
        issue.technicianNotes
      ];

      return searchFields
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  };

  const getFilteredIssues = () => {
    let filtered = [...issues];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((issue) => issue.status === filterStatus);
    }

    if (filterTechnicianType !== 'all') {
      filtered = filtered.filter((issue) => {
        const issueTechnicianTypes = issue?.technicianTypes?.length
          ? issue.technicianTypes
          : (issue?.technicianType ? [issue.technicianType] : deriveRecommendedTechnicianTypes(issue));

        return issueTechnicianTypes.includes(filterTechnicianType);
      });
    }

    return sortIssuesBySubmitted(applySearchFilter(filtered));
  };

  const getCompletedIssues = () => {
    let filtered = issues.filter(i => i.status === 'completed');

    if (filterTechnicianType !== 'all') {
      filtered = filtered.filter((issue) => {
        const issueTechnicianTypes = issue?.technicianTypes?.length
          ? issue.technicianTypes
          : (issue?.technicianType ? [issue.technicianType] : deriveRecommendedTechnicianTypes(issue));

        return issueTechnicianTypes.includes(filterTechnicianType);
      });
    }

    return sortIssuesBySubmitted(applySearchFilter(filtered));
  };

  useEffect(() => {
    setCurrentIssuesPage(1);
  }, [filterStatus, filterTechnicianType, searchTerm, issues.length]);

  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryIssuesPage(1);
    }
  }, [activeTab, searchTerm]);

  const delayedIssues = sortIssuesBySubmitted(issues.filter((issue) => getIssueWarningDetails(issue).isDelayed));
  const managerNotifications = sortIssuesBySubmitted(
    issues.filter((issue) => getAssignmentReminderDetails(issue).isDelayed)
  );
  const currentTabIssues = activeTab === 'current' ? getFilteredIssues() : null;
  const completedTabIssues = activeTab === 'history' ? getCompletedIssues() : null;
  const currentIssuesTotalPages = Math.max(1, Math.ceil((currentTabIssues?.length || 0) / ITEMS_PER_PAGE));
  const historyIssuesTotalPages = Math.max(1, Math.ceil((completedTabIssues?.length || 0) / ITEMS_PER_PAGE));
  const paginatedCurrentIssues = currentTabIssues?.slice(
    (currentIssuesPage - 1) * ITEMS_PER_PAGE,
    currentIssuesPage * ITEMS_PER_PAGE
  );
  const paginatedCompletedIssues = completedTabIssues?.slice(
    (historyIssuesPage - 1) * ITEMS_PER_PAGE,
    historyIssuesPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentIssuesPage > currentIssuesTotalPages) {
      setCurrentIssuesPage(currentIssuesTotalPages);
    }
  }, [currentIssuesPage, currentIssuesTotalPages]);

  useEffect(() => {
    if (historyIssuesPage > historyIssuesTotalPages) {
      setHistoryIssuesPage(historyIssuesTotalPages);
    }
  }, [historyIssuesPage, historyIssuesTotalPages]);

  return (
    <div className="manager-container">
      <Navbar userName={displayName} role="Manager" onLogout={onLogout} />

      <div className="manager-main">
        <div className="manager-header">
          <div>
            <h2>Manager Dashboard</h2>
            <p>Review, analyze, and assign environmental issues to technicians</p>
          </div>
          <div className="manager-header-tools">
            <div className="manager-notification-wrapper">
              <button
                type="button"
                className="manager-notification-btn"
                onClick={() => setShowManagerNotifications((current) => !current)}
              >
                <span className="manager-notification-icon">🔔</span>
                {managerNotifications.length > 0 && (
                  <span className="manager-notification-badge">{managerNotifications.length}</span>
                )}
              </button>

              {showManagerNotifications && (
                <div className="manager-notification-panel">
                  <div className="manager-notification-panel-header">
                    <h3>Manager Notifications</h3>
                    <div className="manager-notification-header-actions">
                      <span className="manager-notification-count">{managerNotifications.length}</span>
                      <button
                        type="button"
                        className="manager-notification-close-btn"
                        onClick={() => setShowManagerNotifications(false)}
                        aria-label="Close notifications"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {managerNotifications.length === 0 ? (
                    <p className="manager-notification-empty">No notifications right now.</p>
                  ) : (
                    <div className="manager-notification-list">
                      {managerNotifications.map((issue) => {
                        const issueDisplayId = getIssueDisplayId(issue);
                        const reminder = getAssignmentReminderDetails(issue);

                        return (
                          <div key={issue._id} className="manager-notification-item">
                            <div className="manager-notification-copy">
                              <p className="manager-notification-title">
                                This issue has not been sent to technician for more than 3 hours.
                              </p>
                              <p className="manager-notification-meta">
                                {new Date(issue.timestamps?.submitted).toLocaleString()}
                              </p>
                              <p className="manager-notification-meta">
                                Waiting {Math.floor(reminder.hoursWaiting)} hour{Math.floor(reminder.hoursWaiting) === 1 ? '' : 's'} for assignment
                              </p>
                            </div>
                            <button
                              type="button"
                              className="manager-notification-view-btn"
                              onClick={() => {
                                setShowManagerNotifications(false);
                                openIssueDetails(issue, issueDisplayId);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="manager-content">
          {loading && <div className="loading-spinner">Loading issues...</div>}
          {error && <div className="error-message">{error}</div>}
          {newIssueAlert && <div className="success-message" style={{ animation: 'slideDown 0.3s ease-in-out' }}>{newIssueAlert}</div>}
          {delayedIssues.length > 0 && (
            <button
              type="button"
              className="warning-dashboard-alert"
              onClick={() => setShowDelayedWarnings(true)}
            >
              <strong>⚠ Manager warning:</strong> {delayedIssues.length} delayed issue{delayedIssues.length > 1 ? 's' : ''} need attention.
            </button>
          )}
          
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
                  <label htmlFor="manager-issue-search">Search Issues:</label>
                  <input
                    id="manager-issue-search"
                    type="text"
                    className="manager-search-input"
                    placeholder="Search by ID, location, user, issue, or technician"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-section">
                  <label htmlFor="manager-technician-filter">Technician Type:</label>
                  <select
                    id="manager-technician-filter"
                    className="manager-search-input manager-status-select"
                    value={filterTechnicianType}
                    onChange={(e) => setFilterTechnicianType(e.target.value)}
                  >
                    <option value="all">All technician types</option>
                    <option value="electrical">Electrical Technician</option>
                    <option value="it_system">IT / System Technician</option>
                    <option value="maintenance">Maintenance Technician</option>
                    <option value="safety">Safety Technician</option>
                    <option value="general_support">General Support Technician</option>
                  </select>
                </div>
                <div className="filter-section">
                  <label htmlFor="manager-status-filter">Status:</label>
                  <select
                    id="manager-status-filter"
                    className="manager-search-input manager-status-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="submitted">New Issues</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
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
                      {paginatedCurrentIssues?.map((issue) => {
                        const warning = getIssueWarningDetails(issue);
                        return (
                        <tr key={issue._id} className={`issue-row status-${issue.status} ${warning.isDelayed ? 'warning-delayed-row' : ''} ${isNewIssue(issue) ? 'new-issue-highlight' : ''}`}>
                          <td>{getIssueDisplayId(issue)}</td>
                          <td>{formatLocationForTable(issue.location, issue.data) || '-'}</td>
                          <td>{issue.userType === 'student' ? 'Student' : issue.userType === 'faculty' ? 'Faculty' : 'Data Collector'}</td>
                          <td>{getLocationDetails(issue.location, issue.data).categoryLabel || 'N/A'}</td>
                          <td>
                            {/* priority shown as plain lowercase text */}
                            {issue.priority ? issue.priority.toLowerCase() : ''}
                          </td>
                          <td>
                            <span className="tech-badge">{getTechnicianTypesDisplay(issue)}</span>
                          </td>
                          <td>
                            <span className={`status-badge status-${issue.status}`}>
                              {issue.status === 'submitted'
                                ? 'New'
                                : issue.status === 'assigned'
                                  ? 'Assigned'
                                  : issue.status === 'in_progress'
                                    ? 'In Progress'
                                    : issue.status === 'completed'
                                      ? 'Completed'
                                      : issue.status}
                            </span>
                            {warning.status && (
                              <div className={`warning-note ${warning.status}`}>
                                {warning.message}
                              </div>
                            )}
                            {issue.responseAlert && <span className="alert-badge">⚠️ No Response</span>}
                            {issue.solveAlert && <span className="alert-badge solve">🚨 Not Solved</span>}
                            {isNewIssue(issue) && <span className="alert-badge" style={{ backgroundColor: '#10b981' }}>✨ JUST SUBMITTED</span>}
                          </td>
                          <td>{new Date(issue.timestamps?.submitted).toLocaleString()}</td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() => {
                                console.log('🔍 SELECTED ISSUE DATA:', JSON.stringify(issue, null, 2));
                                openIssueDetails(issue, getIssueDisplayId(issue));
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {currentTabIssues && currentTabIssues.length > ITEMS_PER_PAGE && (
                <div className="table-pagination">
                  <span className="pagination-summary">
                    Showing {(currentIssuesPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentIssuesPage * ITEMS_PER_PAGE, currentTabIssues.length)} of {currentTabIssues.length} issues
                  </span>
                  <div className="pagination-actions">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentIssuesPage((page) => Math.max(1, page - 1))}
                      disabled={currentIssuesPage === 1}
                    >
                      Previous
                    </button>
                    <span className="pagination-page">
                      Page {currentIssuesPage} of {currentIssuesTotalPages}
                    </span>
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentIssuesPage((page) => Math.min(currentIssuesTotalPages, page + 1))}
                      disabled={currentIssuesPage === currentIssuesTotalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <>
              <div className="manager-controls">
                <div className="filter-section">
                  <label htmlFor="manager-history-search">Search Issues:</label>
                  <input
                    id="manager-history-search"
                    type="text"
                    className="manager-search-input"
                    placeholder="Search completed issues"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-section">
                  <label htmlFor="manager-history-technician-filter">Technician Type:</label>
                  <select
                    id="manager-history-technician-filter"
                    className="manager-search-input manager-status-select"
                    value={filterTechnicianType}
                    onChange={(e) => setFilterTechnicianType(e.target.value)}
                  >
                    <option value="all">All technician types</option>
                    <option value="electrical">Electrical Technician</option>
                    <option value="it_system">IT / System Technician</option>
                    <option value="maintenance">Maintenance Technician</option>
                    <option value="safety">Safety Technician</option>
                    <option value="general_support">General Support Technician</option>
                  </select>
                </div>
              </div>
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
                      {paginatedCompletedIssues?.map((issue) => (
                        <tr key={issue._id} className="issue-row status-completed">
                          <td>{getIssueDisplayId(issue)}</td>
                          <td>
                            {formatLocationForTable(issue.location, issue.data) || '-'}
                          </td>
                          <td>{issue.userType === 'student' ? 'Student' : issue.userType === 'faculty' ? 'Faculty' : 'Data Collector'}</td>
                          <td>{getLocationDetails(issue.location, issue.data).categoryLabel || 'N/A'}</td>
                          <td>
                            {issue.priority ? issue.priority.toLowerCase() : ''}
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
                                openIssueDetails(issue, getIssueDisplayId(issue));
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
              {completedTabIssues && completedTabIssues.length > ITEMS_PER_PAGE && (
                <div className="table-pagination">
                  <span className="pagination-summary">
                    Showing {(historyIssuesPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(historyIssuesPage * ITEMS_PER_PAGE, completedTabIssues.length)} of {completedTabIssues.length} issues
                  </span>
                  <div className="pagination-actions">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setHistoryIssuesPage((page) => Math.max(1, page - 1))}
                      disabled={historyIssuesPage === 1}
                    >
                      Previous
                    </button>
                    <span className="pagination-page">
                      Page {historyIssuesPage} of {historyIssuesTotalPages}
                    </span>
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setHistoryIssuesPage((page) => Math.min(historyIssuesTotalPages, page + 1))}
                      disabled={historyIssuesPage === historyIssuesTotalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDelayedWarnings && delayedIssues.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowDelayedWarnings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delayed Issues Warning</h3>
              <button className="close-btn" onClick={() => setShowDelayedWarnings(false)}>x</button>
            </div>

            <div className="modal-body">
              <div className="delayed-issues-section">
                <div className="delayed-issues-header">
                  <h3>Delayed Issues Warning</h3>
                  <p>Issues that have stayed in a warning state for more than {WARNING_THRESHOLD_HOURS} hours.</p>
                </div>
                <div className="delayed-issues-list">
                  {delayedIssues.map((issue) => {
                    const warning = getIssueWarningDetails(issue);
                    const issueDisplayId = getIssueDisplayId(issue);
                    const issueSummary = issue.specificIssues?.[0] || issue.condition || 'Issue details unavailable';
                    return (
                      <button
                        key={issue._id}
                        type="button"
                        className="delayed-issue-card"
                        onClick={() => {
                          setShowDelayedWarnings(false);
                          openIssueDetails(issue, issueDisplayId);
                        }}
                      >
                        <div>
                          <strong>Issue ID: {issueDisplayId}</strong>
                          <p>{issueSummary}</p>
                        </div>
                        <div>
                          <span className={`warning-note ${warning.status}`}>
                            {warning.message}
                          </span>
                          <p className="delayed-issue-time">
                            Open for {Math.floor(warning.hoursOpen)} hour{Math.floor(warning.hoursOpen) === 1 ? '' : 's'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {(() => {
                  const warning = getIssueWarningDetails(selectedIssue);
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
                  <p><strong>Type:</strong> {selectedIssue.userType === 'student' ? 'Student' : selectedIssue.userType === 'faculty' ? 'Faculty' : 'Data Collector'}</p>
                  <p><strong>Name:</strong> {getReporterDetails(selectedIssue).name}</p>
                  <p><strong>Email:</strong> {getReporterDetails(selectedIssue).email}</p>
                </div>

                {/* Location Details */}
                <div className="detail-section">
                  <h4>Location Details</h4>
                  {/* return to previous detailed layout for modal */}
                <p><strong>Block:</strong> {selectedIssue.location?.block || 'N/A'}</p>
                <p><strong>Floor:</strong> {selectedIssue.location?.floor || 'N/A'}</p>
                <p><strong>{getLocationDetails(selectedIssue.location, selectedIssue.data).detailLabel}:</strong> {getLocationDetails(selectedIssue.location, selectedIssue.data).detailValue || 'N/A'}</p>
                <p><strong>Location Type:</strong> {getLocationDetails(selectedIssue.location, selectedIssue.data).categoryLabel || 'N/A'}</p>
                </div>

                {/* Issue Details - Overall Condition and Issue */}
                <div className="detail-section">
                  <h4>Issue Details</h4>
                  <p><strong>Overall Condition:</strong> {selectedIssue.condition || 'Not assessed'}</p>
                  
                  {/* Display specific problems from the issue data */}
                  <p><strong>Specific Issues Found:</strong></p>
                  {selectedIssue.specificIssues && selectedIssue.specificIssues.length > 0 ? (
                    <div style={{ marginLeft: '20px' }}>
                      {selectedIssue.specificIssues.map((issue, i) => (
                        <p key={i} style={{ margin: '5px 0', color: '#e74c3c' }}>• {issue}</p>
                      ))}
                      {selectedIssue.otherSuggestions && (
                        <>
                          <p style={{ margin: '8px 0 3px 0', color: '#2c3e50', fontWeight: '500' }}>📋 Additional Comments:</p>
                          <p style={{ margin: '3px 0', color: '#555', fontStyle: 'italic' }}>{selectedIssue.otherSuggestions}</p>
                        </>
                      )}
                      {selectedIssue.technicianNotes && (
                        <p style={{ margin: '8px 0 3px 0', color: '#2980b9', fontWeight: '500' }}>Technician Notes: <span style={{ color: '#555', fontStyle: 'italic', marginLeft: 4 }}>{selectedIssue.technicianNotes}</span></p>
                      )}
                    </div>
                  ) : selectedIssue.data ? (
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
                  
                  <p style={{ marginTop: '0.75rem', color: '#2c3e50' }}><strong>Priority:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{selectedIssue.priority?.toLowerCase()}</span></p>
                </div>

                {selectedIssue.technicianAssignments?.length > 0 && (
                  <div className="detail-section">
                    <h4>Technician Progress</h4>
                    {selectedIssue.technicianAssignments.map((assignment, idx) => (
                      <p key={`${assignment.technicianType}-${idx}`}>
                        <strong>{getTechnicianTypeDisplay(assignment.technicianType)}:</strong> {assignment.status}
                        {assignment.notes ? ` - ${assignment.notes}` : ''}
                      </p>
                    ))}
                  </div>
                )}
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
                    <div className="form-input" style={{ display: 'grid', gap: '0.6rem', padding: '1rem' }}>
                      {Object.entries(TECHNICIAN_TYPES).map(([techType, label]) => (
                        <label key={techType} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedTechnicianTypes.includes(techType)}
                            onChange={() => toggleTechnicianType(techType)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.95rem' }}>
                      Recommended: {selectedTechnicianTypes.length > 0 ? selectedTechnicianTypes.map((type) => getTechnicianTypeDisplay(type)).join(', ') : 'Select one or more technician types'}
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned Status Section */}
              {getIssueWarningDetails(selectedIssue).isDelayed && (
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
                  {getIssueWarningDetails(selectedIssue).isDelayed && (
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
                className="delete-btn"
                onClick={() => {
                  handleDeleteIssue(selectedIssue._id);
                  setShowDetails(false);
                }}
                title="Delete this issue permanently"
              >
                 Delete Issue
              </button>
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
