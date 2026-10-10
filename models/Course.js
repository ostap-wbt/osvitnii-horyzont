const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Вкажіть назву матеріалу'],
    trim: true
  },
  type: {
    type: String,
    enum: ['lecture', 'webinar', 'document', 'video', 'assignment'],
    default: 'lecture'
  },
  content: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: '' // Посилання на Zoom, Google Meet, YouTube, Google Drive або документ
  },
  scheduledAt: {
    type: Date,
    default: null // Дата та час для вебінару або дедлайну
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const EnrolledStudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Вкажіть назву курсу'],
    trim: true
  },
  discipline: {
    type: String,
    required: [true, 'Вкажіть предмет або дисципліну (напр. Математика, Фізика, Кібербезпека, Історія)'],
    trim: true
  },
  category: {
    type: String,
    enum: ['it', 'stem', 'languages', 'humanities', 'science', 'creative', 'robotics', 'vrar', 'networks', 'cybersecurity', 'programming'],
    default: 'stem'
  },
  categoryName: {
    type: String,
    default: 'Точні та природничі науки'
  },
  badge: {
    type: String,
    default: 'АВТОРСЬКИЙ КУРС'
  },
  level: {
    type: String,
    default: 'Всі рівні'
  },
  duration: {
    type: String,
    default: '3 місяці'
  },
  description: {
    type: String,
    required: [true, 'Додайте опис курсу'],
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  instructorName: {
    type: String,
    default: 'Викладач платформи'
  },
  instructorEmail: {
    type: String,
    default: ''
  },
  institution: {
    type: String,
    default: 'Освітній горизонт'
  },
  inviteCode: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  techStack: {
    type: [String],
    default: []
  },
  highlights: {
    type: [String],
    default: []
  },
  students: [EnrolledStudentSchema],
  materials: [MaterialSchema],
  spotsLeft: {
    type: Number,
    default: 25
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper function to generate clean unique code
CourseSchema.pre('validate', function(next) {
  if (!this.inviteCode) {
    const prefix = (this.discipline || 'HORIZON')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase() || 'HORZ';
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.inviteCode = `${prefix}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Course', CourseSchema);
