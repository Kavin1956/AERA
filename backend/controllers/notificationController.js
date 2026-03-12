const Notification = require('../models/notification');
const Issue = require('../models/issue');

const buildIssueWarningQuery = (userId, technicianType = '') => {
  const filters = [
    { assignedTechnician: userId },
    { assignedTechnicians: userId },
    { 'technicianAssignments.technicianId': userId }
  ];

  if (technicianType) {
    filters.push(
      { technicianType: { $regex: `^${technicianType}$`, $options: 'i' } },
      { technicianTypes: { $elemMatch: { $regex: `^${technicianType}$`, $options: 'i' } } },
      { 'technicianAssignments.technicianType': technicianType }
    );
  }

  return {
    warningAlert: true,
    warningMessage: { $exists: true, $ne: '' },
    $or: filters
  };
};

const normalizeIssueWarnings = (issues = []) =>
  issues.map((issue) => ({
    _id: `issue-warning-${issue._id}`,
    technicianId: null,
    issueId: issue._id,
    message: issue.warningMessage,
    createdAt: issue.lastWarningAlert || issue.updatedAt || issue.timestamps?.assigned || issue.timestamps?.submitted,
    read: false,
    source: 'issue'
  }));

// Fetch notifications for a technician
exports.getTechnicianNotifications = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const technicianType = String(req.user.technicianType || '').toLowerCase().trim();

    const [storedNotifications, warningIssues] = await Promise.all([
      Notification.find({ technicianId }).sort({ createdAt: -1 }),
      Issue.find(buildIssueWarningQuery(technicianId, technicianType))
        .select('_id warningMessage lastWarningAlert updatedAt timestamps')
        .sort({ lastWarningAlert: -1, updatedAt: -1 })
    ]);

    const merged = [...normalizeIssueWarnings(warningIssues), ...storedNotifications];
    const seen = new Set();
    const notifications = merged.filter((notification) => {
      const key = `${notification.issueId || notification._id}-${notification.message}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    notifications.sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};
