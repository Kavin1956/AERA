const Notification = require('../models/notification');

// Fetch notifications for a technician
exports.getTechnicianNotifications = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const notifications = await Notification.find({ technicianId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};
