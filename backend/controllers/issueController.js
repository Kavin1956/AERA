const Issue = require('../models/issue');
const User = require('../models/User');

exports.createIssue = async (req, res) => {
  try {
    if (process.env.DEBUG_ISSUE === 'true') {
      console.debug('\n📝 Create Issue Request:');
      console.debug('User ID:', req.user?.id);
      console.debug('User Role:', req.user?.role);
      console.debug('Issue Data:', req.body);
    }

    const issue = await Issue.create({
      ...req.body,
      submittedBy: req.user.id
    });

    // Keep a single informative server log for successful creates
    console.info('✅ Issue created:', issue._id);
    res.status(201).json(issue);
  } catch (error) {
    console.error('❌ Create issue error:', error);
    res.status(500).json({ 
      message: 'Error creating issue', 
      error: error.message,
      details: error.message
    });
  }
};

exports.getAllIssues = async (req, res) => {
  try {
    // Managers see all issues;
    // Technicians see only issues assigned to their technicianType (case-insensitive);
    // Data collectors (and others) see only their submitted issues
    let filter = {};
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    console.log(`\n📥 getAllIssues called by ${req.user?.username} (role: ${userRole})`);

    if (userRole === 'manager') {
      filter = {};
      console.log(`   manager: showing all issues`);
    } else if (userRole === 'technician') {
      // Technicians should see issues either assigned to them, or matching their technicianType
      const techType = req.user.technicianType?.toLowerCase();
      if (techType) {
        // Use case-insensitive regex for matching
        filter = {
          $or: [
            { assignedTechnician: userId },
            { technicianType: { $regex: `^${techType}$`, $options: 'i' } }
          ]
        };
        console.log(`   technician: techType=${techType}, filter set`);
      } else {
        // If technician has no type, only show assigned to them
        filter = { assignedTechnician: userId };
        console.log(`   technician: no type, showing only assigned`);
      }
    } else {
      // Data collectors see only their submitted issues (NOT technician issues)
      filter = { submittedBy: userId };
      console.log(`   data_collector: showing only own submitted issues`);
    }

    const issues = await Issue.find(filter)
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName technicianType');
    
    console.log(`   found ${issues.length} issues`);
    
    res.json(issues);
  } catch (error) {
    console.error('❌ Get issues error:', error);
    res.status(500).json({ message: 'Error fetching issues' });
  }
};

// exports.assignIssue = async (req, res) => {
//   try {
//     console.log('\n📤 Assign Issue Request:');
//     console.log('Issue ID:', req.params.id);
//     console.log('Request Body:', req.body);
//     console.log('User Role:', req.user?.role);
    
//     const { assignedTechnician, technicianType } = req.body;

//     if (!assignedTechnician) {
//       return res.status(400).json({ 
//         message: 'Missing assignedTechnician',
//         details: 'assignedTechnician is required in request body'
//       });
//     }

//     // Resolve assignedTechnician to an ObjectId. Accept either an ObjectId string or a technician username.
//     let technicianId = assignedTechnician;
//     const isObjectIdLike = typeof assignedTechnician === 'string' && /^[0-9a-fA-F]{24}$/.test(assignedTechnician);
//     if (!isObjectIdLike) {
//       // Atomically find or create a technician user by username to avoid duplicate key race conditions.
//       const placeholderEmail = `${assignedTechnician.replace(/[^a-zA-Z0-9_.-]/g, '')}@placeholder.local`;
//       const techUser = await User.findOneAndUpdate(
//         { username: assignedTechnician, role: 'technician' },
//         { $setOnInsert: { username: assignedTechnician, fullName: assignedTechnician, role: 'technician', technicianType, email: placeholderEmail } },
//         { new: true, upsert: true, setDefaultsOnInsert: true }
//       );
//       technicianId = techUser._id;
//     }

//     const issue = await Issue.findByIdAndUpdate(
//       req.params.id,
//       {
//         assignedTechnician: technicianId,
//         technicianType,
//         status: 'assigned',
//         'timestamps.assigned': new Date()
//       },
//       { new: true }
//     ).populate('submittedBy', 'username fullName')
//      .populate('assignedTechnician', 'username fullName technicianType');

//     if (!issue) {
//       return res.status(404).json({ 
//         message: 'Issue not found',
//         details: `No issue found with ID: ${req.params.id}`
//       });
//     }
    
//     console.log('✅ Issue assigned:', issue._id);
//     res.json(issue);
//   } catch (error) {
//     console.error('❌ Assign issue error:', error);
//     res.status(500).json({ 
//       message: 'Error assigning issue',
//       error: error.message,
//       details: error.message
//     });
//   }
// };


exports.assignIssue = async (req, res) => {
  try {
    const { technicianType } = req.body;

    if (!technicianType) {
      return res.status(400).json({ message: 'technicianType is required' });
    }

    // Find technician by type (case-insensitive)
    const technician = await User.findOne({
      role: 'technician',
      technicianType: { $regex: `^${technicianType.toLowerCase()}$`, $options: 'i' }
    });

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        assignedTechnician: technician._id,
        technicianType: technicianType.toLowerCase(), // ✅ Store in lowercase
        status: 'assigned',
        'timestamps.assigned': new Date()
      },
      { new: true }
    )
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName technicianType');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error('Assign issue error:', error);
    res.status(500).json({ message: 'Error assigning issue' });
  }
};



exports.completeIssue = async (req, res) => {
  try {
    if (process.env.DEBUG_ISSUE === 'true') {
      console.debug('\n✅ Complete Issue Request:');
      console.debug('Issue ID:', req.params.id);
      console.debug('User Role:', req.user?.role);
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        'timestamps.completed': new Date()
      },
      { new: true }
    ).populate('submittedBy', 'username fullName')
     .populate('assignedTechnician', 'username fullName technicianType');

    if (!issue) {
      return res.status(404).json({ 
        message: 'Issue not found',
        details: `No issue found with ID: ${req.params.id}`
      });
    }

    console.info('✅ Issue completed:', issue._id);
    res.json(issue);
  } catch (error) {
    console.error('❌ Complete issue error:', error);
    res.status(500).json({ 
      message: 'Error completing issue',
      error: error.message,
      details: error.message
    });
  }
};

// Manager updates issue status, risk, analysis notes and optionally assigns a technician
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, technicianType, risk, analysisNotes } = req.body;

    console.log(`\n📝 updateIssueStatus for issue: ${req.params.id}`);
    console.log(`   technicianType: ${technicianType}, status: ${status}`);

    const update = {};
    if (status) update.status = status;
    if (technicianType) update.technicianType = technicianType.toLowerCase(); // ✅ Store in lowercase
    if (risk) update.risk = risk;
    if (analysisNotes) update.analysisNotes = analysisNotes;

    // If assigning, find a technician of that type and set assignedTechnician
    if (status === 'assigned' && technicianType) {
      const techType = technicianType.toLowerCase();
      console.log(`   finding technician with type: ${techType}`);
      
      const technician = await User.findOne({ 
        role: 'technician', 
        technicianType: { $regex: `^${techType}$`, $options: 'i' }
      });
      
      if (technician) {
        console.log(`   ✅ found technician: ${technician.username} (${technician._id})`);
        update.assignedTechnician = technician._id;
      } else {
        console.log(`   ❌ no technician found with type: ${techType}`);
      }
      update['timestamps.assigned'] = new Date();
    }

    if (status === 'completed') {
      update['timestamps.completed'] = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    )
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName technicianType');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    console.log(`   ✅ issue updated: technicianType=${issue.technicianType}, status=${issue.status}, assignedTechnician=${issue.assignedTechnician?.username}`);

    // Add history entry
    issue.history = issue.history || [];
    issue.history.push({
      action: 'update',
      by: req.user?.id,
      role: req.user?.role,
      timestamp: new Date(),
      details: { status, technicianType, risk, analysisNotes }
    });

    await issue.save();

    if (process.env.DEBUG_ISSUE === 'true') {
      console.debug('🔁 Issue status updated and history saved for:', issue._id);
    }

    res.json(issue);
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ message: 'Error updating issue status' });
  }
};
