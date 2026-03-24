import { API_BASE_URL } from '../services/api';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const ISSUE_CODE_LABELS = {
  whiteboardNeedsCleaning: 'Whiteboard Needs Cleaning',
  whiteboardDamaged: 'Whiteboard Damaged',
  brokenChairs: 'Broken Chairs',
  damagedTables: 'Damaged Tables',
  systemSlowPerformance: 'System Slow Performance',
  systemNotWorking: 'System Not Working',
  projectorNotWorking: 'Projector Not Working',
  projectorNotAvailable: 'Projector Not Available',
  slowInternet: 'Slow Internet',
  noInternet: 'No Internet',
  temperatureTooHot: 'Temperature Too Hot',
  temperatureTooCold: 'Temperature Too Cold',
  dustyEnvironment: 'Dusty Environment',
  poorVentilation: 'Poor Ventilation',
  powerSupplyFluctuating: 'Power Supply Fluctuating',
  powerFailure: 'Power Failure',
  acNotWorking: 'AC Not Working',
  dimLighting: 'Dim Lighting',
  lightingNotWorking: 'Lighting Not Working',
  fanNotWorking: 'Fan Not Working',
  junctionBoxExtraAvailable: 'Junction Box Extra Available',
  junctionBoxDamaged: 'Junction Box Damaged',
  fireEquipmentNotAvailable: 'Fire Equipment Not Available',
  exitBlocked: 'Emergency Exit Blocked',
  looseWires: 'Loose Wires',
  damagedSwitches: 'Damaged Switches'
};

export const getIssueImageUrl = (issue = {}) => {
  if (issue.image?.url) return issue.image.url;
  if (issue.image?.path) return `${API_ORIGIN}/${String(issue.image.path).replace(/^\/+/, '')}`;
  return '';
};

export const getResolvedIssueLocation = (issue = {}) => ({
  category:
    issue.location?.category ||
    issue.data?.locationCategory ||
    issue.locationCategory ||
    '',
  block:
    issue.location?.block ||
    issue.data?.block ||
    issue.block ||
    '',
  floor:
    issue.location?.floor ||
    issue.data?.floor ||
    issue.floor ||
    '',
  roomNumber:
    issue.location?.roomNumber ||
    issue.data?.roomNumber ||
    issue.roomNumber ||
    '',
  locationName:
    issue.location?.locationName ||
    issue.data?.locationName ||
    issue.locationName ||
    '',
  locationFieldLabel:
    issue.location?.locationFieldLabel ||
    issue.data?.locationFieldLabel ||
    issue.locationFieldLabel ||
    ''
});

export const getResolvedIssueCondition = (issue = {}) =>
  issue.condition || issue.data?.condition || issue.problemLevel || '';

export const getResolvedIssueUserType = (issue = {}) =>
  issue.userType || issue.submittedBy?.userType || 'data_collector';

export const getResolvedIssueSpecificIssues = (issue = {}) => {
  if (Array.isArray(issue.relevantSpecificIssues) && issue.relevantSpecificIssues.length > 0) {
    return issue.relevantSpecificIssues;
  }

  if (Array.isArray(issue.specificIssues) && issue.specificIssues.length > 0) {
    return issue.specificIssues;
  }

  if (Array.isArray(issue.issues) && issue.issues.length > 0) {
    return issue.issues.map((code) => ISSUE_CODE_LABELS[code] || code).filter(Boolean);
  }

  const data = issue.data || {};
  return Object.entries(ISSUE_CODE_LABELS)
    .filter(([code]) => Boolean(data[code]))
    .map(([, label]) => label);
};

export const getResolvedOtherSuggestions = (issue = {}) =>
  issue.relevantOtherSuggestions || issue.otherSuggestions || issue.data?.otherSuggestions || '';

export const formatUserTypeLabel = (userType = '') => {
  if (userType === 'student') return 'Student';
  if (userType === 'faculty') return 'Faculty';
  if (userType === 'data_collector') return 'Data Collector';
  return userType || 'Unknown';
};
