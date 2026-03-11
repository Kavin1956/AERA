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
        console.log(`   technician: techType=${techType}, filter set for both assigned and type-matching`);
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
    
    console.log(`   ✅ found ${issues.length} issues matching filter`);
    
    if (process.env.DEBUG_ISSUE === 'true') {
      issues.forEach((issue, idx) => {
        console.log(`   [${idx}] ID: ${issue._id}, status: "${issue.status}", techType: "${issue.technicianType}", assigned: ${issue.assignedTechnician?.username || 'none'}`);
      });
    }
    
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

    const techTypeNormalized = technicianType.toLowerCase().trim();
    console.log(`\n📤 assignIssue: finding technician with type="${techTypeNormalized}"`);

    // Find technician by type (case-insensitive, trim whitespace)
    const technician = await User.findOne({
      role: 'technician',
      technicianType: { $regex: `^${techTypeNormalized}$`, $options: 'i' }
    });

    if (!technician) {
      console.log(`   ❌ No technician found with type: ${techTypeNormalized}`);
      
      // Debug: Show all technicians and their types
      const allTechs = await User.find({ role: 'technician' }).select('username technicianType');
      console.log(`   Available technicians:`, allTechs.map(t => ({ username: t.username, type: t.technicianType })));
      
      return res.status(404).json({ 
        message: `Technician not found for type "${techTypeNormalized}"`,
        availableTypes: allTechs.map(t => t.technicianType)
      });
    }

    console.log(`   ✅ Found technician: ${technician.username} (type: ${technician.technicianType})`);

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        assignedTechnician: technician._id,
        technicianType: techTypeNormalized, // ✅ Store in lowercase
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

    console.log(`   ✅ Issue assigned: ${issue._id} -> ${technician.username} (type: ${issue.technicianType})`);
    res.json(issue);
  } catch (error) {
    console.error('❌ Assign issue error:', error);
    res.status(500).json({ message: 'Error assigning issue', error: error.message });
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

// Delete issue (Data Collector can delete their own issues, Manager can delete any issue)
exports.deleteIssue = async (req, res) => {
  try {
    const issueId = req.params.id;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    console.log(`\n🗑️  Delete Issue Request:`);
    console.log(`   Issue ID: ${issueId}`);
    console.log(`   User: ${req.user?.username} (${userRole})`);

    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({ 
        message: 'Issue not found',
        details: `No issue found with ID: ${issueId}`
      });
    }

    // Authorization: Data collectors can only delete their own issues, managers can delete any issue
    if (userRole === 'data_collector' && issue.submittedBy.toString() !== userId) {
      console.error(`❌ Unauthorized: Data collector ${userId} cannot delete issue submitted by ${issue.submittedBy}`);
      return res.status(403).json({ 
        message: 'Access denied',
        details: 'Data collectors can only delete their own submitted issues'
      });
    }

    // Delete the issue
    await Issue.findByIdAndDelete(issueId);

    console.log(`✅ Issue deleted: ${issueId}`);
    res.json({ 
      message: 'Issue deleted successfully',
      issueId: issueId
    });
  } catch (error) {
    console.error('❌ Delete issue error:', error);
    res.status(500).json({ 
      message: 'Error deleting issue',
      error: error.message,
      details: error.message
    });
  }
};

exports.sendWarningAlert = async (req, res) => {
  try {
    const issueId = req.params.id;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const { message } = req.body;

    console.log(`\n⚠️  Send Warning Alert Request:`);
    console.log(`   Issue ID: ${issueId}`);
    console.log(`   User: ${req.user?.username} (${userRole})`);

    // Only managers can send warning alerts
    if (userRole !== 'manager') {
      return res.status(403).json({ 
        message: 'Access denied',
        details: 'Only managers can send warning alerts'
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ 
        message: 'Issue not found',
        details: `No issue found with ID: ${issueId}`
      });
    }

    // Check if issue has assigned technician
    if (!issue.assignedTechnician) {
      return res.status(400).json({ 
        message: 'No technician assigned',
        details: 'Cannot send warning to an issue without an assigned technician'
      });
    }

    // Import Notification model
    const Notification = require('../models/notification');

    // Create notification for the technician
    const notification = await Notification.create({
      technicianId: issue.assignedTechnician,
      issueId: issueId,
      message: message || `⚠️ Warning: Issue ${issueId} needs urgent attention. Please respond immediately.`
    });

    // Update issue to mark that warning was sent
    issue.warningAlert = true;
    issue.lastWarningAlert = new Date();
    await issue.save();

    console.log(`✅ Warning alert sent to technician for issue ${issueId}`);
    res.json({ 
      message: 'Warning alert sent successfully',
      notificationId: notification._id,
      issueId: issueId
    });
  } catch (error) {
    console.error('❌ Send warning alert error:', error);
    res.status(500).json({ 
      message: 'Error sending warning alert',
      error: error.message
    });
  }
};
