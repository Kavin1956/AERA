const Issue = require('../models/issue');
const Notification = require('../models/notification');
const { normalizeIssueDocument } = require('../utils/issueNormalizer');

const TECHNICIAN_ISSUE_CODES = {
  maintenance: ['whiteboardNeedsCleaning', 'whiteboardDamaged', 'brokenChairs', 'damagedTables'],
  it_system: ['systemSlowPerformance', 'systemNotWorking', 'projectorNotWorking', 'projectorNotAvailable', 'slowInternet', 'noInternet'],
  electrical: ['temperatureTooHot', 'temperatureTooCold', 'dustyEnvironment', 'poorVentilation', 'powerSupplyFluctuating', 'powerFailure', 'acNotWorking', 'dimLighting', 'lightingNotWorking', 'fanNotWorking', 'junctionBoxExtraAvailable', 'junctionBoxDamaged'],
  safety: ['fireEquipmentNotAvailable', 'exitBlocked', 'looseWires', 'damagedSwitches'],
  general_support: []
};

const deriveTechnicianTypesFromIssue = (task) => {
  const savedTypes = (task.technicianTypes || []).map((type) => String(type).toLowerCase().trim()).filter(Boolean);
  if (savedTypes.length > 0) {
    return [...new Set(savedTypes)];
  }

  const issueCodes = new Set((task.issues || []).map((code) => String(code).trim()));
  const derivedTypes = [];

  Object.entries(TECHNICIAN_ISSUE_CODES).forEach(([techType, codes]) => {
    if (techType === 'general_support') {
      return;
    }

    if (codes.some((code) => issueCodes.has(code))) {
      derivedTypes.push(techType);
    }
  });

  if ((task.otherSuggestions || task.data?.otherSuggestions || '').trim()) {
    derivedTypes.push('general_support');
  }

  if (derivedTypes.length === 0 && task.technicianType) {
    derivedTypes.push(String(task.technicianType).toLowerCase().trim());
  }

  return [...new Set(derivedTypes)];
};

const TECHNICIAN_USERNAME_TYPE_MAP = {
  tech_electrical_bob: 'electrical',
  tech_it_charlie: 'it_system',
  tech_maintenance_diana: 'maintenance',
  tech_safety_evan: 'safety',
  tech_support_frank: 'general_support'
};

const resolveTechnicianType = (user) => {
  const usernameType = TECHNICIAN_USERNAME_TYPE_MAP[user?.username];
  const storedType = String(user?.technicianType || '').toLowerCase().trim();
  return usernameType || storedType || '';
};

const buildRelevantIssueQuery = (technicianType) => {
  const codes = TECHNICIAN_ISSUE_CODES[technicianType] || [];

  if (technicianType === 'general_support') {
    return {
      $or: [
        { otherSuggestions: { $exists: true, $ne: '' } },
        { 'data.otherSuggestions': { $exists: true, $ne: '' } }
      ]
    };
  }

  if (codes.length === 0) {
    return null;
  }

  return { issues: { $in: codes } };
};

const getAssignmentForTechnician = (task, userId, technicianType) => {
  const assignments = task.technicianAssignments || [];
  const normalizedType = technicianType?.toLowerCase();

  const existingAssignment = assignments.find((assignment) => {
    const assignmentTechId = assignment.technicianId?._id || assignment.technicianId;
    const matchesId = assignmentTechId && String(assignmentTechId) === String(userId);
    const matchesType = normalizedType && assignment.technicianType === normalizedType;
    return matchesId || matchesType;
  });

  if (existingAssignment) {
    return existingAssignment;
  }

  const taskTechnicianTypes = deriveTechnicianTypesFromIssue(task);
  const legacyType = String(task.technicianType || '').toLowerCase().trim();

  if (normalizedType && (taskTechnicianTypes.includes(normalizedType) || legacyType === normalizedType)) {
    return {
      technicianType: normalizedType,
      technicianId: null,
      status: task.status === 'completed' ? 'completed' : (task.status === 'in_progress' ? 'in_progress' : 'assigned'),
      notes: '',
      timestamps: {
        assigned: task.timestamps?.assigned,
        completed: task.timestamps?.completed
      }
    };
  }

  return null;
};

const decorateTaskForTechnician = (task, assignment) => {
  if (!assignment) return task;

  const taskObj = task.toObject ? task.toObject() : task;
  const effectiveTechnicianTypes = deriveTechnicianTypesFromIssue(taskObj);
  const relevantCodes = TECHNICIAN_ISSUE_CODES[assignment.technicianType] || [];
  const relevantSpecificIssues = (taskObj.specificIssues || []).filter((_, index) => {
    const issueCode = taskObj.issues?.[index];
    if (assignment.technicianType === 'general_support') {
      return Boolean(taskObj.otherSuggestions || taskObj.data?.otherSuggestions);
    }
    return relevantCodes.includes(issueCode);
  });

  return {
    ...taskObj,
    status: assignment.status || taskObj.status,
    technicianNotes: assignment.notes || '',
    taskAssignment: assignment,
    technicianTypes: effectiveTechnicianTypes,
    relevantIssueCodes: assignment.technicianType === 'general_support'
      ? []
      : (taskObj.issues || []).filter((code) => relevantCodes.includes(code)),
    relevantSpecificIssues,
    relevantOtherSuggestions: assignment.technicianType === 'general_support'
      ? (taskObj.otherSuggestions || taskObj.data?.otherSuggestions || '')
      : '',
    timestamps: {
      ...taskObj.timestamps,
      assigned: assignment.timestamps?.assigned || taskObj.timestamps?.assigned,
      completed: assignment.timestamps?.completed || taskObj.timestamps?.completed
    }
  };
};

const getRequestBaseUrl = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${protocol}://${req.get('host')}`;
};

// Get tasks assigned to the logged-in technician (either assigned to them
// explicitly or matching their technicianType with appropriate statuses)
exports.getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const technicianType = resolveTechnicianType(req.user);

    console.log(`\n📋 getAssignedTasks for technician: ${req.user.username}`);
    console.log(`   userId: ${userId}`);
    console.log(`   technicianType: ${technicianType}`);

    let filter;
    if (technicianType) {
      const relevantIssueQuery = buildRelevantIssueQuery(technicianType);
      filter = {
        $or: [
          { 'technicianAssignments.technicianId': userId },
          { 'technicianAssignments.technicianType': technicianType },
          { assignedTechnicians: userId },
          { technicianTypes: { $elemMatch: { $regex: `^${technicianType}$`, $options: 'i' } } },
          { assignedTechnician: userId },
          { technicianType: { $regex: `^${technicianType}$`, $options: 'i' } },
          ...(relevantIssueQuery ? [relevantIssueQuery] : [])
        ]
      };
      console.log(`   Looking for technicianAssignments / technicianTypes for "${technicianType}"`);
    } else {
      // If technician has no type, only show assigned to them
      filter = { assignedTechnician: userId };
      console.log(`   No technicianType - showing only directly assigned issues`);
    }

    const tasks = await Issue.find(filter)
      .populate('submittedBy', 'username fullName email')
      .populate('assignedTechnician', 'username fullName technicianType')
      .populate('assignedTechnicians', 'username fullName technicianType')
      .populate('technicianAssignments.technicianId', 'username fullName technicianType');

    console.log(`   ✅ Found ${tasks.length} matching tasks`);
    
    if (process.env.DEBUG_ISSUE === 'true' || process.env.DEBUG === 'true') {
      tasks.forEach((task, idx) => {
        console.log(`   [${idx}] ID: ${task._id}, techType: "${task.technicianType}", status: "${task.status}", assigned: ${task.assignedTechnician?.username || 'unassigned'}`);
      });
    }

    const decoratedTasks = tasks
      .map((task) => decorateTaskForTechnician(task, getAssignmentForTechnician(task, userId, technicianType)))
      .filter((task) => {
        if (!technicianType) return true;
        const assignment = task.taskAssignment;
        const taskTechnicianTypes = deriveTechnicianTypesFromIssue(task);
        return Boolean(assignment) ||
          String(task.technicianType || '').toLowerCase() === technicianType ||
          taskTechnicianTypes.includes(technicianType);
      });

    res.json(decoratedTasks.map((task) => normalizeIssueDocument(task, getRequestBaseUrl(req))));
  } catch (error) {
    console.error('❌ getAssignedTasks error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update task progress
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, updateNotes } = req.body;
    const technicianType = resolveTechnicianType(req.user);
    const userId = req.user.id;

    if (!['assigned', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    let assignmentUpdated = false;
    issue.technicianAssignments = (issue.technicianAssignments || []).map((assignment) => {
      const assignmentTechId = assignment.technicianId?._id || assignment.technicianId;
      const matchesId = assignmentTechId && String(assignmentTechId) === String(userId);
      const matchesType = technicianType && assignment.technicianType === technicianType;

      if (!matchesId && !matchesType) {
        return assignment;
      }

      assignmentUpdated = true;
      assignment.status = status;
      if (typeof updateNotes !== 'undefined') {
        assignment.notes = updateNotes;
      }
      if (!assignment.timestamps) {
        assignment.timestamps = {};
      }
      if (!assignment.timestamps.assigned) {
        assignment.timestamps.assigned = issue.timestamps?.assigned || new Date();
      }
      if (status === 'completed') {
        assignment.timestamps.completed = new Date();
      } else {
        assignment.timestamps.completed = undefined;
      }
      return assignment;
    });

    if (!assignmentUpdated) {
      const directlyAssigned =
        (issue.assignedTechnician && String(issue.assignedTechnician) === String(userId)) ||
        (issue.assignedTechnicians || []).some((technicianId) => String(technicianId) === String(userId));
      const issueTechnicianTypes = (issue.technicianTypes || [])
        .map((type) => String(type).toLowerCase().trim())
        .filter(Boolean);
      const typeAssigned =
        (technicianType && String(issue.technicianType || '').toLowerCase().trim() === technicianType) ||
        (technicianType && issueTechnicianTypes.includes(technicianType));

      if (!directlyAssigned && !typeAssigned) {
        return res.status(404).json({ message: 'No technician assignment found for this task' });
      }

      const assignmentType =
        technicianType ||
        String(issue.technicianType || '').toLowerCase().trim() ||
        issueTechnicianTypes[0] ||
        'general_support';

      issue.technicianAssignments = [
        ...(issue.technicianAssignments || []),
        {
          technicianType: assignmentType,
          technicianId: userId,
          status,
          notes: typeof updateNotes !== 'undefined' ? updateNotes : '',
          timestamps: {
            assigned: issue.timestamps?.assigned || new Date(),
            completed: status === 'completed' ? new Date() : undefined
          }
        }
      ];

      assignmentUpdated = true;
    }

    const assignments = issue.technicianAssignments || [];
    if (assignments.every((assignment) => assignment.status === 'completed')) {
      issue.status = 'completed';
      issue.timestamps.completed = new Date();
      issue.warningAlert = false;
      issue.warningMessage = '';
      issue.lastWarningAlert = undefined;
    } else if (assignments.some((assignment) => assignment.status === 'in_progress' || assignment.status === 'completed')) {
      issue.status = 'in_progress';
      issue.timestamps.completed = undefined;
    } else {
      issue.status = 'assigned';
      issue.timestamps.completed = undefined;
    }

    issue.technicianNotes = assignments
      .filter((assignment) => assignment.notes)
      .map((assignment) => `${assignment.technicianType}: ${assignment.notes}`)
      .join(' | ');

    await issue.save();
    if (status === 'completed') {
      await Notification.deleteMany({ issueId: issue._id });
    }

    const populatedIssue = await Issue.findById(req.params.id)
      .populate('submittedBy', 'username fullName email')
      .populate('assignedTechnician', 'username fullName technicianType')
      .populate('assignedTechnicians', 'username fullName technicianType')
      .populate('technicianAssignments.technicianId', 'username fullName technicianType');

    res.json(
      normalizeIssueDocument(
        decorateTaskForTechnician(
          populatedIssue,
          getAssignmentForTechnician(populatedIssue, userId, technicianType)
        ),
        getRequestBaseUrl(req)
      )
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
