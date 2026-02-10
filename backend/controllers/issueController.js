const Issue = require('../models/issue');
const User = require('../models/User');

exports.createIssue = async (req, res) => {
  try {
    console.log('\n📝 Create Issue Request:');
    console.log('User ID:', req.user?.id);
    console.log('User Role:', req.user?.role);
    console.log('Issue Data:', req.body);
    
    const issue = await Issue.create({
      ...req.body,
      submittedBy: req.user.id
    });
    
    console.log('✅ Issue created:', issue._id);
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
    // Technicians see only issues assigned to their technicianType;
    // Data collectors (and others) see only their submitted issues
    let filter = {};
    if (req.user?.role === 'manager') {
      filter = {};
    } else if (req.user?.role === 'technician') {
      // Technicians should see issues either assigned to them, or matching their technicianType
      const techType = req.user.technicianType;
      filter = {
        $or: [
          { assignedTechnician: req.user.id },
          ...(techType ? [{ technicianType: techType }] : [])
        ]
      };
    } else {
      filter = { submittedBy: req.user.id };
    }

    const issues = await Issue.find(filter)
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName technicianType');
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

    // Find technician by type
    const technician = await User.findOne({
      role: 'technician',
      technicianType
    });

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        assignedTechnician: technician._id, // ✅ KEY LINE
        technicianType,
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
    console.log('\n✅ Complete Issue Request:');
    console.log('Issue ID:', req.params.id);
    console.log('User Role:', req.user?.role);
    
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

    console.log('✅ Issue completed:', issue._id);
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
