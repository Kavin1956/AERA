const cron = require('node-cron');
const Issue = require('./models/issue');
const Notification = require('./models/notification');
const User = require('./models/User');

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    // Find all assigned issues not completed
    const now = new Date();
    const issues = await Issue.find({
      status: { $in: ['assigned', 'in_progress'] },
      assignedTechnician: { $ne: null }
    });

    for (const issue of issues) {
      const assignedAt = issue.timestamps.assigned || issue.updatedAt || issue.createdAt;
      const hoursSinceAssigned = (now - assignedAt) / (1000 * 60 * 60);
      if (hoursSinceAssigned > 5) {
        // Check if a warning notification already exists for this issue/technician
        const existing = await Notification.findOne({
          technicianId: issue.assignedTechnician,
          issueId: issue._id,
          message: /delayed more than 5 hours/
        });
        if (!existing) {
          await Notification.create({
            technicianId: issue.assignedTechnician,
            issueId: issue._id,
            message: 'Warning: Issue delayed more than 5 hours. Please resolve immediately.'
          });
        }
      }
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});
