const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    studentId: { type: String, trim: true, unique: true, sparse: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student', required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
