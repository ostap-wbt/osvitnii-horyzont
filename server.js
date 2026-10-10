require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB, getDbStatus, inMemoryData } = require('./config/db');
const Registration = require('./models/Registration');
const Inquiry = require('./models/Inquiry');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Load courses dataset
let staticCourses = [];
try {
  const coursesRaw = fs.readFileSync(path.join(__dirname, 'data', 'courses.json'), 'utf8');
  staticCourses = JSON.parse(coursesRaw);
} catch (e) {
  console.error('Не вдалося завантажити data/courses.json:', e.message);
}

// REST API Endpoints

// 1. Health check for Render.com
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'osvitnii-horyzont-platform'
  });
});

// 2. System and Database status
app.get('/api/system-status', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    platform: 'Освітній горизонт',
    version: '1.0.0',
    deployment: {
      provider: 'Render.com',
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    },
    database: {
      provider: 'MongoDB Atlas',
      account: 'ostap.yunak@gmail.com',
      ...dbStatus,
      registrationsCount: dbStatus.connected ? 'У хмарі Atlas' : inMemoryData.registrations.length
    },
    repository: 'https://github.com/ostap-wbt/osvitnii-horyzont'
  });
});

// 3. Courses catalog
app.get('/api/courses', (req, res) => {
  const { category } = req.query;
  let result = staticCourses;

  if (category && category !== 'all') {
    result = staticCourses.filter(c => c.category === category);
  }

  res.json({
    success: true,
    count: result.length,
    courses: result
  });
});

// 4. Single course
app.get('/api/courses/:id', (req, res) => {
  const course = staticCourses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, error: 'Курс не знайдено' });
  }
  res.json({ success: true, course });
});

// 5. Register for course / submit student application
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, phone, courseId, format, experienceLevel, notes } = req.body;

    if (!fullName || !email || !phone || !courseId) {
      return res.status(400).json({
        success: false,
        error: 'Будь ласка, заповніть обов\'язкові поля: Ім\'я, Email, Телефон та Напрямок'
      });
    }

    const matchedCourse = staticCourses.find(c => c.id === courseId);
    const courseTitle = matchedCourse ? matchedCourse.title : courseId;

    const registrationPayload = {
      fullName,
      email,
      phone,
      courseId,
      courseTitle,
      format: format || 'online',
      experienceLevel: experienceLevel || 'beginner',
      notes: notes || '',
      createdAt: new Date()
    };

    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      // Save directly to MongoDB Atlas
      const record = await Registration.create(registrationPayload);
      console.log(`[MongoDB Atlas] 🟢 Нова заявка збережена: ${record.fullName} -> ${record.courseTitle}`);
      return res.status(201).json({
        success: true,
        message: 'Вашу заявку успішно зареєстровано в базі даних MongoDB Atlas!',
        dataId: record._id,
        storage: 'MongoDB Atlas'
      });
    } else {
      // Fallback in-memory
      inMemoryData.registrations.push({ ...registrationPayload, id: 'mem_' + Date.now() });
      console.log(`[In-Memory Store] ⚠️ Збережено локально (MongoDB Atlas очікує підключення): ${fullName}`);
      return res.status(201).json({
        success: true,
        message: 'Вашу заявку прийнято! (Збережено у сесійній пам\'яті сервера, очікується підключення кластера MongoDB Atlas)',
        storage: 'In-Memory Fallback',
        hint: 'Для збереження в хмару Atlas підключіть MONGODB_URI в налаштуваннях Render'
      });
    }
  } catch (error) {
    console.error('Помилка реєстрації:', error);
    res.status(500).json({
      success: false,
      error: 'Внутрішня помилка сервера при збереженні заявки: ' + error.message
    });
  }
});

// 6. Fast consultation inquiry
app.post('/api/inquiry', async (req, res) => {
  try {
    const { name, contact, question, category } = req.body;
    if (!name || !contact) {
      return res.status(400).json({ success: false, error: 'Вкажіть ім\'я та контакт' });
    }

    const payload = {
      name,
      contact,
      question: question || '',
      category: category || 'general',
      createdAt: new Date()
    };

    const dbStatus = getDbStatus();
    if (dbStatus.connected) {
      const record = await Inquiry.create(payload);
      return res.status(201).json({ success: true, message: 'Запит збережено в MongoDB Atlas!', dataId: record._id });
    } else {
      inMemoryData.inquiries.push({ ...payload, id: 'inq_' + Date.now() });
      return res.status(201).json({ success: true, message: 'Дякуємо! Наш ментор зв\'яжеться з вами найближчим часом.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. General Stats
app.get('/api/stats', (req, res) => {
  res.json({
    studentsCount: 1480,
    hiredRate: 97.4,
    activeLabs: 6,
    partnersCount: 48,
    specializations: 6,
    activeHackathons: 3
  });
});

// Catch-all route to serve the SPA / landing page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server & Connect MongoDB Atlas
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Платформа 'Освітній горизонт' успішно запущена!`);
    console.log(`🌐 Локальна адреса: http://localhost:${PORT}`);
    console.log(`☁️ Готова для Render.com & MongoDB Atlas (${process.env.NODE_ENV || 'development'})`);
    console.log(`=======================================================`);
  });
}

startServer();
