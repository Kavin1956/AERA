const Issue = require('../models/issue');

// Get tasks assigned to the logged-in technician (either assigned to them
// explicitly or matching their technicianType with appropriate statuses)
exports.getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const technicianType = req.user.technicianType;

    const tasks = await Issue.find({
      $or: [
        { assignedTechnician: userId },
        { technicianType: technicianType, status: { $in: ['assigned', 'in_progress'] } }
      ]
    })
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName technicianType');

    res.json(tasks);
  } catch (error) {
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
