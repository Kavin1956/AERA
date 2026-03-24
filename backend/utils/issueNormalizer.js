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

const deriveSpecificIssues = (issue = {}) => {
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

const normalizeLocation = (issue = {}) => ({
  category: issue.location?.category || issue.data?.locationCategory || issue.locationCategory || '',
  block: issue.location?.block || issue.data?.block || issue.block || '',
  floor: issue.location?.floor || issue.data?.floor || issue.floor || '',
  roomNumber: issue.location?.roomNumber || issue.data?.roomNumber || issue.roomNumber || '',
  locationName: issue.location?.locationName || issue.data?.locationName || issue.locationName || '',
  locationFieldLabel: issue.location?.locationFieldLabel || issue.data?.locationFieldLabel || issue.locationFieldLabel || ''
});

const normalizeImage = (issue = {}, baseUrl = '') => {
  if (!issue.image) return issue.image;

  const normalizedPath = issue.image.path ? String(issue.image.path).replace(/^\/+/, '') : '';
  return {
    ...issue.image,
    path: normalizedPath,
    url: issue.image.url || (normalizedPath && baseUrl ? `${baseUrl}/${normalizedPath}` : '')
  };
};

const normalizeIssueObject = (issue = {}, baseUrl = '') => {
  const location = normalizeLocation(issue);
  const condition = issue.condition || issue.data?.condition || issue.problemLevel || '';

  return {
    ...issue,
    userType: issue.userType || 'data_collector',
    location,
    condition,
    specificIssues: deriveSpecificIssues(issue),
    image: normalizeImage(issue, baseUrl),
    data: {
      ...(issue.data || {}),
      block: issue.data?.block || location.block,
      floor: issue.data?.floor || location.floor,
      roomNumber: issue.data?.roomNumber || location.roomNumber,
      locationName: issue.data?.locationName || location.locationName,
      locationCategory: issue.data?.locationCategory || location.category,
      locationFieldLabel: issue.data?.locationFieldLabel || location.locationFieldLabel,
      condition: issue.data?.condition || condition
    }
  };
};

const normalizeIssueDocument = (issueDoc, baseUrl = '') => {
  const plainIssue = issueDoc?.toObject ? issueDoc.toObject() : issueDoc;
  return normalizeIssueObject(plainIssue, baseUrl);
};

module.exports = {
  normalizeIssueDocument,
  normalizeIssueObject
};
