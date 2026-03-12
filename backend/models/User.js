const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['data_collector', 'manager', 'technician'],
    required: true
  },
  userType: {
    type: String,
    enum: ['student', 'faculty', 'data_collector'],
    default: 'data_collector'
  },
  technicianType: String
});

module.exports = mongoose.model('User', userSchema);

