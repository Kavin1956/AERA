const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const issueController = require('../controllers/issueController');

// Create issue (Data Collector only)
router.post(
  '/',
  auth,
  role('data_collector'),
  issueController.createIssue
);

// Get issues (All authenticated users - filtering done in controller)
router.get(
  '/',
  auth,
  issueController.getAllIssues
);

// Assign issue (Manager only)
router.put(
  '/:id/assign',
  auth,
  role('manager'),
  issueController.assignIssue
);

// Update issue status / manager analysis (Manager only)
router.put(
  '/:id/status',
  auth,
  role('manager'),
  issueController.updateIssueStatus
);

// Complete issue (Technician or Manager can mark as complete)
const allowTechnicianOrManager = (req, res, next) => {
  const userRole = req.user?.role;
  if (userRole !== 'technician' && userRole !== 'manager') {
    console.error(`❌ Access denied: ${userRole} !== technician or manager`);
    return res.status(403).json({ 
      message: 'Access denied',
      details: `Your role '${userRole}' is not authorized for this action. Required: 'technician' or 'manager'`
    });
  }
  next();
};

router.put(
  '/:id/complete',
  auth,
  allowTechnicianOrManager,
  issueController.completeIssue
);

module.exports = router;
