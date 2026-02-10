// // const router = require('express').Router();
// // const auth = require('../middleware/authMiddleware');
// // const role = require('../middleware/roleMiddleware');
// // const issueCtrl = require('../controllers/issueController');

// // // Anyone authenticated can submit an issue (data collectors, managers, technicians can all report)
// // router.post('/', auth, issueCtrl.createIssue);

// // // Only managers can view all issues
// // 	// Allow any authenticated user to view all issues
// // 	router.get('/', auth, issueCtrl.getAllIssues);

// // // Only managers can assign issues
// // router.put('/:id/assign', auth, role('manager'), issueCtrl.assignIssue);

// // // Only technicians can complete issues
// // router.put('/:id/complete', auth, role('technician'), issueCtrl.completeIssue);

// // module.exports = router;

// const express = require('express');
// const router = express.Router();

// const auth = require('../middleware/authMiddleware');
// const role = require('../middleware/roleMiddleware');
// const issueController = require('../controllers/issueController');

// // Create issue (Data Collector)
// router.post(
//   '/',
//   auth,
//   role('data_collector'),
//   issueController.createIssue
// );

// // Get issues (Manager / Technician / Data Collector)
// router.get(
//   '/',
//   auth,
//   issueController.getAllIssues
// );

// // Assign issue (Manager)
// router.put(
//   '/:id/assign',
//   auth,
//   role('manager'),
//   issueController.assignIssue
// );

// // Complete issue (Technician)
// router.put(
//   '/:id/complete',
//   auth,
//   role('technician'),
//   issueController.completeIssue
// );

// module.exports = router;


const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const issueController = require('../controllers/issueController');

// Create issue (Data Collector)
router.post(
  '/',
  auth,
  role('data_collector'),
  issueController.createIssue
);

// Get issues (Manager / Technician / Data Collector)
router.get(
  '/',
  auth,
  issueController.getAllIssues
);

// Assign issue (Manager)
router.put(
  '/:id/assign',
  auth,
  role('manager'),
  issueController.assignIssue
);

// Complete issue (Technician)
router.put(
  '/:id/complete',
  auth,
  role('technician'),
  issueController.completeIssue
);

module.exports = router;
