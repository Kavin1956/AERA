const Issue = require('../models/issue');

// Get tasks assigned to the logged-in technician (either assigned to them
// explicitly or matching their technicianType with appropriate statuses)
exports.getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const technicianType = req.user.technicianType?.toLowerCase();

    console.log(`\n📋 getAssignedTasks for technician: ${req.user.username}`);
    console.log(`   technicianType: ${technicianType}`);
    console.log(`   userId: ${userId}`);

    let filter;
    if (technicianType) {
      filter = {
        $or: [
          { assignedTechnician: userId },
          { technicianType: { $regex: `^${technicianType}$`, $options: 'i' }, status: { $in: ['submitted', 'assigned', 'in_progress', 'completed'] } }
        ]
      };
    } else {
      // If technician has no type, only show assigned to them
      filter = { assignedTechnician: userId };
    }

    console.log(`   filter: ${JSON.stringify(filter)}`);

    const tasks = await Issue.find(filter)
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName technicianType');

    console.log(`   found ${tasks.length} tasks`);
    tasks.forEach((task, idx) => {
      console.log(`   [${idx}] issue ${task._id}, technicianType: ${task.technicianType}, status: ${task.status}, assigned: ${task.assignedTechnician?._id}`);
    });

    res.json(tasks);
  } catch (error) {
    console.error('❌ getAssignedTasks error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update task progress
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, updateNotes } = req.body;

    if (!['assigned', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const update = { status };
    if (typeof updateNotes !== 'undefined') update.updateNotes = updateNotes;
    if (status === 'completed') update['timestamps.completed'] = new Date();

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    )
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName technicianType');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
