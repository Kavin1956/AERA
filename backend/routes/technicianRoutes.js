const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const technicianController = require('../controllers/technicianController');

// Get tasks assigned to logged-in technician
router.get(
  '/tasks',
  auth,
  role('technician'),
  technicianController.getAssignedTasks
);

// Update task status (in progress / completed)
router.put(
  '/tasks/:id',
  auth,
  role('technician'),
  technicianController.updateTaskStatus
);

module.exports = router;
