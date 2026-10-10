const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Вкажіть ваше повне ім\'я'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Вкажіть електронну пошту'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Некоректний email']
  },
  password: {
    type: String,
    minlength: 6,
    select: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    default: 'student'
  },
  discipline: {
    type: String,
    trim: true,
    default: 'Загальна' // Для викладачів: Математика, Фізика, Кібербезпека тощо
  },
  institution: {
    type: String,
    trim: true,
    default: '' // Школа, Ліцей, Університет або приватний викладач
  },
  googleId: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
