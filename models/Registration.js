const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Вкажіть ваше ім\'я'],
    trim: true,
    maxlength: [100, 'Ім\'я занадто довге']
  },
  email: {
    type: String,
    required: [true, 'Вкажіть контактну електронну пошту'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Некоректний формат email']
  },
  phone: {
    type: String,
    required: [true, 'Вкажіть номер телефону'],
    trim: true
  },
  courseId: {
    type: String,
    required: [true, 'Оберіть напрямок або курс'],
    trim: true
  },
  courseTitle: {
    type: String,
    default: 'Загальний курс'
  },
  format: {
    type: String,
    enum: ['online', 'hybrid', 'campus-labs'],
    default: 'online'
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'enrolled', 'cancelled'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Registration', RegistrationSchema);
