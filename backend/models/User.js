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
  technicianType: String
});

module.exports = mongoose.model('User', userSchema);
