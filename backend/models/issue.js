const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  userType: String,
  reporterName: String,
  reporterEmail: String,

  location: {
    category: String,
    block: String,
    floor: String,
    roomNumber: String,
    locationName: String,
    locationFieldLabel: String
  },

  reporter: {
    name: String,
    email: String,
    rollNumber: String,
    year: String,
    dept: String
  },

  condition: String,
  problemLevel: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },

  technicianType: String,
  technicianTypes: [String],
  issueType: String, // e.g., Electrical / Networking / Other
  risk: { type: String, enum: ['Low', 'Moderate', 'High'] },
  analysisNotes: String,
  history: [
    {
      action: String,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      timestamp: Date,
      details: Object
    }
  ],

  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedTechnicians: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  technicianAssignments: [
    {
      technicianType: String,
      technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      status: {
        type: String,
        enum: ['assigned', 'in_progress', 'completed'],
        default: 'assigned'
      },
      notes: String,
      timestamps: {
        assigned: Date,
        completed: Date
      }
    }
  ],


  data: Object,
  specificIssues: [String], // Array of specific issues found (e.g., ["Whiteboard needs cleaning", "Slow internet"])
  issues: [String], // Array of issue codes (e.g., ["slowInternet", "projectorNotWorking"])
  otherSuggestions: String,
  technicianNotes: String, // Notes/updates from technician
  warningAlert: {
    type: Boolean,
    default: false
  },
  warningMessage: String,
  lastWarningAlert: Date,

  status: {
    type: String,
    enum: ['submitted', 'assigned', 'in_progress', 'completed'],
    default: 'submitted'
  },

  timestamps: {
    submitted: { type: Date, default: Date.now },
    assigned: Date,
    completed: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);
