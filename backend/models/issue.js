const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  userType: String,
  locationCategory: String,
  block: String,
  floor: String,
  roomNumber: String,

  condition: String,
  problemLevel: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },

  technicianType: String,
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  data: Object,
  otherSuggestions: String,

  // status: {
  //   type: String,
  //   enum: ['submitted', 'assigned', 'completed'],
  //   default: 'submitted'
  // },

  status: {
  type: String,
  enum: ['submitted', 'assigned', 'in_progress', 'completed'],
  default: 'submitted'},

  timestamps: {
    submitted: { type: Date, default: Date.now },
    assigned: Date,
    completed: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);
