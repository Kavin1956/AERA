const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const issueController = require('../controllers/issueController');

// Create issue (Data Collector or Manager)
router.post(
  '/',
  auth,
  role(['data_collector', 'manager']),
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

// Delete issue (Data collector can delete their own, Manager can delete any)
router.delete(
  '/:id',
  auth,
  issueController.deleteIssue
);

// Send warning alert to assigned technician (Manager only)
router.post(
  '/:id/send-warning',
  auth,
  role('manager'),
  issueController.sendWarningAlert
);

module.exports = router;
