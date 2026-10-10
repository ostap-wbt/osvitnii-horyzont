require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { connectDB, getDbStatus, inMemoryData } = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Registration = require('./models/Registration');
const Inquiry = require('./models/Inquiry');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'horizon_quantum_jwt_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Load initial seed courses
let staticCourses = [];
try {
  const coursesRaw = fs.readFileSync(path.join(__dirname, 'data', 'courses.json'), 'utf8');
  staticCourses = JSON.parse(coursesRaw);
} catch (e) {
  console.error('Не вдалося завантажити data/courses.json:', e.message);
}

// Authentication Token Helper
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      discipline: user.discipline,
      institution: user.institution
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Потрібна авторизація для цієї дії' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Недійсний або прострочений токен авторизації' });
  }
}

// ==========================================
// 1. AUTHENTICATION & USERS API
// ==========================================

// Register via Email & Password (for Teachers or Students)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, role, discipline, institution, bio } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Заповніть обов\'язкові поля: Ім\'я, Email та Пароль' });
    }

    const dbStatus = getDbStatus();
    const cleanEmail = email.toLowerCase().trim();

    if (dbStatus.connected) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Користувач із цією електронною поштою вже зареєстрований' });
      }

      const user = await User.create({
        fullName,
        email: cleanEmail,
        password,
        role: role === 'teacher' ? 'teacher' : 'student',
        discipline: discipline || (role === 'teacher' ? 'Загальні дисципліни' : ''),
        institution: institution || '',
        bio: bio || ''
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        message: `Вітаємо, ${user.fullName}! Реєстрацію успішно завершено.`,
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          discipline: user.discipline,
          institution: user.institution
        }
      });
    } else {
      // In-memory fallback
      const token = jwt.sign({ id: 'mem_' + Date.now(), email: cleanEmail, name: fullName, role: role || 'student' }, JWT_SECRET);
      return res.status(201).json({
        success: true,
        message: `Реєстрація успішна (In-Memory режим).`,
        token,
        user: { id: 'mem_' + Date.now(), fullName, email: cleanEmail, role: role || 'student' }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Помилка реєстрації: ' + error.message });
  }
});

// Login via Email & Password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Вкажіть email та пароль' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Користувача з такою поштою не знайдено' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Невірний пароль' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          discipline: user.discipline,
          institution: user.institution
        }
      });
    } else {
      // Fallback
      const token = jwt.sign({ id: 'mem_user', email: cleanEmail, name: cleanEmail.split('@')[0], role: 'student' }, JWT_SECRET);
      return res.json({
        success: true,
        token,
        user: { id: 'mem_user', fullName: cleanEmail.split('@')[0], email: cleanEmail, role: 'student' }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка входу: ' + error.message });
  }
});

// Login or Register via Google (Google Sign-In)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, fullName, googleId, avatar, role, discipline, institution } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email є обов\'язковим від Google' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      let user = await User.findOne({ email: cleanEmail });

      if (!user) {
        // Create new user via Google
        user = await User.create({
          fullName: fullName || cleanEmail.split('@')[0],
          email: cleanEmail,
          googleId: googleId || 'g_' + Date.now(),
          avatar: avatar || '',
          role: role === 'teacher' ? 'teacher' : 'student',
          discipline: discipline || (role === 'teacher' ? 'Загальні дисципліни' : ''),
          institution: institution || ''
        });
        console.log(`[Google Auth] 🟢 Створено нового користувача: ${user.fullName} (${user.role})`);
      } else {
        // Update googleId if missing
        if (!user.googleId && googleId) {
          user.googleId = googleId;
          await user.save();
        }
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        message: 'Успішний вхід через Google!',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          discipline: user.discipline,
          institution: user.institution,
          avatar: user.avatar
        }
      });
    } else {
      const token = jwt.sign({ id: 'mem_google', email: cleanEmail, name: fullName || 'Google User', role: role || 'student' }, JWT_SECRET);
      return res.json({
        success: true,
        token,
        user: { id: 'mem_google', fullName: fullName || 'Google User', email: cleanEmail, role: role || 'student' }
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Помилка входу через Google: ' + error.message });
  }
});

// Get current user profile (/api/auth/me)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const dbStatus = getDbStatus();
    if (dbStatus.connected) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
      return res.json({ success: true, user });
    }
    res.json({ success: true, user: req.user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================
// 2. COURSES & DISCIPLINES CATALOG
// ==========================================

// Seed static courses into MongoDB Atlas if collection is empty
async function seedInitialCourses() {
  try {
    for (const sc of staticCourses) {
      const exists = await Course.findOne({ inviteCode: sc.inviteCode });
      if (!exists) {
        await Course.create({
          title: sc.title,
          discipline: sc.discipline || sc.categoryName,
          category: sc.category || 'stem',
          categoryName: sc.categoryName || 'Точні науки',
          badge: sc.badge || 'PRO',
          level: sc.level || 'Всі рівні',
          duration: sc.duration || '3 місяці',
          description: sc.description,
          instructorName: sc.instructorName || 'Викладач платформи',
          institution: sc.institution || 'Освітній горизонт',
          inviteCode: sc.inviteCode,
          techStack: sc.techStack || [],
          highlights: sc.highlights || [],
          spotsLeft: sc.spotsLeft || 20,
          materials: [
            {
              title: 'Вступна лекція: Огляд програми та методології',
              type: 'lecture',
              content: 'Огляд навчального плану, критерії оцінювання та графік вебінарів.'
            },
            {
              title: 'Організаційний вебінар (Прямий ефір)',
              type: 'webinar',
              content: 'Прямий ефір знайомства з викладачем та відповіді на запитання.',
              link: 'https://meet.google.com/new'
            }
          ]
        });
      }
    }
    console.log('✅ Перевірка та посів навчальних курсів у MongoDB Atlas завершено.');
  } catch (err) {
    console.warn('Не вдалося виконати перевірку курсів:', err.message);
  }
}

// Get all courses (supports discipline, category, search)
app.get('/api/courses', async (req, res) => {
  try {
    const { category, discipline, search } = req.query;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      const filter = { isPublished: true };

      if (category && category !== 'all') {
        filter.category = category;
      }
      if (discipline && discipline !== 'all') {
        filter.discipline = new RegExp(discipline, 'i');
      }
      if (search) {
        filter.$or = [
          { title: new RegExp(search, 'i') },
          { discipline: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { instructorName: new RegExp(search, 'i') }
        ];
      }

      const courses = await Course.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, count: courses.length, courses });
    }

    // In-memory / static fallback
    let filtered = staticCourses;
    if (category && category !== 'all') {
      filtered = filtered.filter(c => c.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || (c.discipline && c.discipline.toLowerCase().includes(q)));
    }

    res.json({ success: true, count: filtered.length, courses: filtered });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single course by ID or inviteCode
app.get('/api/courses/:id', async (req, res) => {
  try {
    const idOrCode = req.params.id;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      let course = null;
      if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
        course = await Course.findById(idOrCode);
      }
      if (!course) {
        course = await Course.findOne({ inviteCode: idOrCode.toUpperCase() });
      }

      if (!course) {
        const staticMatch = staticCourses.find(c => c.id === idOrCode || c.inviteCode === idOrCode);
        if (staticMatch) return res.json({ success: true, course: staticMatch });
        return res.status(404).json({ success: false, error: 'Курс не знайдено' });
      }

      return res.json({ success: true, course });
    }

    const course = staticCourses.find(c => c.id === idOrCode || c.inviteCode === idOrCode);
    if (!course) return res.status(404).json({ success: false, error: 'Курс не знайдено' });
    res.json({ success: true, course });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================
// 3. TEACHER STUDIO (CREATE COURSE, MATERIALS, WEBINARS)
// ==========================================

// Create course by Teacher
app.post('/api/courses', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, error: 'Тільки викладачі можуть створювати власні навчальні курси' });
    }

    const { title, discipline, category, level, duration, description, techStack, highlights, institution } = req.body;

    if (!title || !discipline || !description) {
      return res.status(400).json({ success: false, error: 'Вкажіть назву курсу, предмет/дисципліну та опис' });
    }

    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({ success: false, error: 'База даних Atlas очікує підключення' });
    }

    // Category Name mapping
    const categoryNames = {
      it: 'IT & Програмування',
      cybersecurity: 'Кібербезпека',
      robotics: 'Робототехніка',
      vrar: 'VR / AR & Metaverse',
      networks: 'Цифрові мережі & Cloud',
      stem: 'Точні науки (Математика, Фізика)',
      science: 'Природничі науки (Біологія, Хімія)',
      languages: 'Мови та Комунікація',
      humanities: 'Гуманітарні науки & Історія',
      creative: 'Мистецтво та Дизайн'
    };

    const newCourse = await Course.create({
      title,
      discipline,
      category: category || 'stem',
      categoryName: categoryNames[category] || discipline,
      badge: 'АВТОРСЬКИЙ КУРС',
      level: level || 'Всі рівні',
      duration: duration || '3 місяці',
      description,
      instructor: req.user.id,
      instructorName: req.user.name,
      instructorEmail: req.user.email,
      institution: institution || req.user.institution || 'Освітній горизонт',
      techStack: Array.isArray(techStack) ? techStack : (techStack ? techStack.split(',').map(s => s.trim()) : []),
      highlights: Array.isArray(highlights) ? highlights : (highlights ? highlights.split('\n').map(s => s.trim()).filter(Boolean) : []),
      materials: [
        {
          title: 'Вітальне слово викладача та силабус',
          type: 'lecture',
          content: `Вітаємо на курсі "${title}"! Тут будуть публікуватися лекції, конспекти та посилання на онлайн-вебінари.`
        }
      ]
    });

    console.log(`[Teacher Studio] 👨‍🏫 Викладач ${req.user.name} створив курс: "${newCourse.title}" (Код: ${newCourse.inviteCode})`);

    res.status(201).json({
      success: true,
      message: 'Курс успішно створено!',
      course: newCourse,
      inviteCode: newCourse.inviteCode
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка створення курсу: ' + error.message });
  }
});

// Publish Material, Lecture or Webinar to Course
app.post('/api/courses/:id/materials', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Курс не знайдено' });
    }

    // Check ownership
    if (course.instructor && course.instructor.toString() !== req.user.id && req.user.email !== course.instructorEmail) {
      return res.status(403).json({ success: false, error: 'Ви можете додавати матеріали лише до власних курсів' });
    }

    const { title, type, content, link, scheduledAt } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Вкажіть назву матеріалу' });
    }

    const newMaterial = {
      title,
      type: type || 'lecture',
      content: content || '',
      link: link || '',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdAt: new Date()
    };

    course.materials.push(newMaterial);
    await course.save();

    console.log(`[Materials] 📄 Додано матеріал: "${title}" (${type}) до курсу "${course.title}"`);

    res.status(201).json({
      success: true,
      message: 'Матеріал/вебінар успішно опубліковано!',
      material: newMaterial,
      course
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Invite student by email
app.post('/api/courses/:id/invite', authMiddleware, async (req, res) => {
  try {
    const { studentEmail, studentName } = req.body;
    if (!studentEmail) {
      return res.status(400).json({ success: false, error: 'Вкажіть email студента або учня' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Курс не знайдено' });
    }

    // Check if already in students
    const cleanEmail = studentEmail.toLowerCase().trim();
    const alreadyEnrolled = course.students.some(s => s.email === cleanEmail);

    if (!alreadyEnrolled) {
      course.students.push({
        name: studentName || cleanEmail.split('@')[0],
        email: cleanEmail,
        enrolledAt: new Date()
      });
      await course.save();
    }

    const inviteLink = `${req.protocol}://${req.get('host')}?join=${course.inviteCode}`;

    res.json({
      success: true,
      message: `Запрошення для ${cleanEmail} сформовано! Учень доданий до списку курсу.`,
      inviteCode: course.inviteCode,
      inviteLink
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get teacher's created courses
app.get('/api/teacher/my-courses', authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({
      $or: [
        { instructor: req.user.id },
        { instructorEmail: req.user.email }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. STUDENT LEARNING HUB (JOIN COURSE, VIEW ENROLLED)
// ==========================================

// Join course by invite code or ID
app.post('/api/courses/join', authMiddleware, async (req, res) => {
  try {
    const { inviteCode, courseId } = req.body;

    if (!inviteCode && !courseId) {
      return res.status(400).json({ success: false, error: 'Введіть код запрошення або оберіть курс' });
    }

    let course = null;
    if (inviteCode) {
      course = await Course.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
    } else if (courseId) {
      course = await Course.findById(courseId);
    }

    if (!course) {
      return res.status(404).json({ success: false, error: 'Курс із таким кодом запрошення не знайдено. Перевірте код.' });
    }

    const cleanEmail = req.user.email.toLowerCase();
    const isAlreadyEnrolled = course.students.some(s => s.email === cleanEmail || (s.user && s.user.toString() === req.user.id));

    if (isAlreadyEnrolled) {
      return res.json({
        success: true,
        message: 'Ви вже приєднані до цього курсу!',
        course
      });
    }

    course.students.push({
      user: req.user.id,
      name: req.user.name,
      email: cleanEmail,
      enrolledAt: new Date()
    });

    if (course.spotsLeft > 0) course.spotsLeft -= 1;
    await course.save();

    console.log(`[Enrollment] 🎓 Студент ${req.user.name} приєднався до курсу "${course.title}"`);

    res.json({
      success: true,
      message: `Вітаємо! Ви успішно приєдналися до курсу "${course.title}"!`,
      course
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's enrolled courses
app.get('/api/student/my-courses', authMiddleware, async (req, res) => {
  try {
    const cleanEmail = req.user.email.toLowerCase();
    const courses = await Course.find({
      $or: [
        { 'students.user': req.user.id },
        { 'students.email': cleanEmail }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. GENERAL & SYSTEM API
// ==========================================

// Health check for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'osvitnii-horyzont-platform'
  });
});

// System and Database status
app.get('/api/system-status', async (req, res) => {
  const dbStatus = getDbStatus();
  let usersCount = 0;
  let coursesCount = 0;

  if (dbStatus.connected) {
    try {
      usersCount = await User.countDocuments();
      coursesCount = await Course.countDocuments();
    } catch (e) {}
  }

  res.json({
    platform: 'Освітній горизонт',
    version: '2.0.0',
    deployment: {
      provider: 'Render.com',
      environment: process.env.NODE_ENV || 'production',
      port: PORT
    },
    database: {
      provider: 'MongoDB Atlas',
      account: 'ostap.yunak@gmail.com',
      ...dbStatus,
      usersCount,
      coursesCount
    },
    repository: 'https://github.com/ostap-wbt/osvitnii-horyzont'
  });
});

// Public Lead Registration (from hero landing forms)
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, phone, courseId, format, experienceLevel, notes } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Будь ласка, заповніть обов\'язкові поля: Ім\'я, Email та Телефон'
      });
    }

    const dbStatus = getDbStatus();
    let courseTitle = courseId || 'Загальна консультація';

    if (dbStatus.connected && courseId) {
      const c = await Course.findOne({ $or: [{ id: courseId }, { inviteCode: courseId }] });
      if (c) courseTitle = c.title;
    }

    const payload = {
      fullName,
      email,
      phone,
      courseId: courseId || 'general',
      courseTitle,
      format: format || 'online',
      experienceLevel: experienceLevel || 'beginner',
      notes: notes || '',
      createdAt: new Date()
    };

    if (dbStatus.connected) {
      const record = await Registration.create(payload);
      return res.status(201).json({
        success: true,
        message: 'Вашу заявку успішно зареєстровано в базі даних MongoDB Atlas!',
        dataId: record._id,
        storage: 'MongoDB Atlas'
      });
    } else {
      inMemoryData.registrations.push({ ...payload, id: 'mem_' + Date.now() });
      return res.status(201).json({
        success: true,
        message: 'Вашу заявку прийнято сервером!',
        storage: 'In-Memory Fallback'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fast inquiry
app.post('/api/inquiry', async (req, res) => {
  try {
    const { name, contact, question, category } = req.body;
    if (!name || !contact) return res.status(400).json({ success: false, error: 'Вкажіть ім\'я та контакт' });

    const dbStatus = getDbStatus();
    const payload = { name, contact, question: question || '', category: category || 'general', createdAt: new Date() };

    if (dbStatus.connected) {
      const record = await Inquiry.create(payload);
      return res.status(201).json({ success: true, message: 'Запит збережено в MongoDB Atlas!', dataId: record._id });
    }
    inMemoryData.inquiries.push({ ...payload, id: 'inq_' + Date.now() });
    res.status(201).json({ success: true, message: 'Дякуємо! Наш ментор зв\'яжеться з вами найближчим часом.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stats API
app.get('/api/stats', async (req, res) => {
  let teachers = 45;
  let courses = 24;
  let students = 1480;

  if (getDbStatus().connected) {
    try {
      teachers = await User.countDocuments({ role: 'teacher' }) + 45;
      students = await User.countDocuments({ role: 'student' }) + 1480;
      courses = await Course.countDocuments();
    } catch (e) {}
  }

  res.json({
    studentsCount: students,
    teachersCount: teachers,
    coursesCount: courses,
    hiredRate: 97.4,
    activeLabs: 6,
    partnersCount: 48
  });
});

// Catch-all SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
async function startServer() {
  const connected = await connectDB();
  if (connected) {
    await seedInitialCourses();
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Платформа 'Освітній горизонт' v2.0 успішно запущена!`);
    console.log(`🌐 Адреса: http://localhost:${PORT}`);
    console.log(`👨‍🏫 Кабінет викладача & Студентський хаб: АКТИВНІ`);
    console.log(`🍃 База даних: MongoDB Atlas (ostap.yunak@gmail.com)`);
    console.log(`=======================================================`);
  });
}

startServer();
