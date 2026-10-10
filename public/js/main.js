// Main Application Logic for 'Освітній горизонт' v2.0
// Multi-disciplinary Platform, Teacher Studio, Student Hub & Auth

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let currentUser = null;
  let authToken = localStorage.getItem('horizon_token') || null;

  try {
    const savedUser = localStorage.getItem('horizon_user');
    if (savedUser) currentUser = JSON.parse(savedUser);
  } catch (e) {
    currentUser = null;
  }

  // DOM Elements
  const coursesContainer = document.getElementById('courses-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const dbStatusText = document.getElementById('live-db-status');
  const renderStatusText = document.getElementById('live-render-status');

  // Nav Elements
  const navGuestActions = document.getElementById('nav-guest-actions');
  const navUserActions = document.getElementById('nav-user-actions');
  const navUserName = document.getElementById('nav-user-name');
  const navUserRole = document.getElementById('nav-user-role');
  const navUserAvatar = document.getElementById('nav-user-avatar');
  const btnOpenDashboard = document.getElementById('btn-open-dashboard');
  const btnUserLogout = document.getElementById('btn-user-logout');

  // Modals
  const authModal = document.getElementById('auth-modal');
  const teacherModal = document.getElementById('teacher-studio-modal');
  const studentModal = document.getElementById('student-hub-modal');
  const addMaterialModal = document.getElementById('add-material-modal');

  // Auth Modal Elements
  const authTitle = document.getElementById('auth-modal-title');
  const tabBtnLogin = document.getElementById('tab-btn-login');
  const tabBtnRegister = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const roleLabelStudent = document.getElementById('role-label-student');
  const roleLabelTeacher = document.getElementById('role-label-teacher');
  const teacherExtraFields = document.getElementById('teacher-extra-fields');
  const btnGoogleAuth = document.getElementById('btn-google-auth');

  // Quick Join Code
  const quickJoinForm = document.getElementById('quick-join-code-form');
  const quickJoinInput = document.getElementById('join-invite-code-input');
  const quickJoinAlert = document.getElementById('quick-join-alert');

  // Pending Invite Code to join after login
  let pendingInviteCode = null;

  // Check URL query parameters (e.g. ?join=MATH-4019)
  const urlParams = new URLSearchParams(window.location.search);
  const urlJoinCode = urlParams.get('join');
  if (urlJoinCode && quickJoinInput) {
    quickJoinInput.value = urlJoinCode.toUpperCase();
  }

  // ==========================================
  // 1. AUTHENTICATION & UI SYNC
  // ==========================================

  function updateAuthUI() {
    if (currentUser && authToken) {
      if (navGuestActions) navGuestActions.style.display = 'none';
      if (navUserActions) navUserActions.style.display = 'flex';
      if (navUserName) navUserName.textContent = currentUser.fullName || currentUser.name || 'Користувач';
      if (navUserRole) {
        navUserRole.textContent = currentUser.role === 'teacher' ? '👨‍🏫 Викладач' : '🎓 Студент / Учень';
      }
      if (navUserAvatar) {
        navUserAvatar.textContent = (currentUser.fullName || 'К')[0].toUpperCase();
      }
      if (btnOpenDashboard) {
        btnOpenDashboard.textContent = currentUser.role === 'teacher' ? 'Кабінет викладача' : 'Моє навчання';
      }
    } else {
      if (navGuestActions) navGuestActions.style.display = 'flex';
      if (navUserActions) navUserActions.style.display = 'none';
    }
  }

  function setSession(user, token) {
    currentUser = user;
    authToken = token;
    localStorage.setItem('horizon_user', JSON.stringify(user));
    localStorage.setItem('horizon_token', token);
    updateAuthUI();

    // If there was a pending invite code, process it now
    if (pendingInviteCode) {
      handleJoinCourse(pendingInviteCode);
      pendingInviteCode = null;
    }
  }

  function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('horizon_user');
    localStorage.removeItem('horizon_token');
    updateAuthUI();
    closeAllModals();
  }

  if (btnUserLogout) {
    btnUserLogout.addEventListener('click', logout);
  }

  if (btnOpenDashboard) {
    btnOpenDashboard.addEventListener('click', () => {
      if (!currentUser) {
        openAuthModal('login');
        return;
      }
      if (currentUser.role === 'teacher') {
        openTeacherStudio();
      } else {
        openStudentHub();
      }
    });
  }

  // ==========================================
  // 2. MODAL CONTROLS
  // ==========================================

  function closeAllModals() {
    [authModal, teacherModal, studentModal, addMaterialModal].forEach(m => {
      if (m) m.classList.remove('active');
    });
  }

  function openAuthModal(tab = 'login', defaultRole = 'student') {
    closeAllModals();
    if (authModal) {
      authModal.classList.add('active');
      switchAuthTab(tab);
      if (defaultRole === 'teacher') {
        selectRole('teacher');
      } else {
        selectRole('student');
      }
    }
  }

  function switchAuthTab(tab) {
    const alertBox = document.getElementById('auth-alert-box');
    if (alertBox) alertBox.style.display = 'none';

    if (tab === 'login') {
      if (tabBtnLogin) tabBtnLogin.className = 'btn btn-cyber-primary btn-sm active';
      if (tabBtnRegister) tabBtnRegister.className = 'btn btn-cyber-outline btn-sm';
      if (formLogin) formLogin.style.display = 'flex';
      if (formRegister) formRegister.style.display = 'none';
      if (authTitle) authTitle.textContent = 'Вхід на платформу';
    } else {
      if (tabBtnLogin) tabBtnLogin.className = 'btn btn-cyber-outline btn-sm';
      if (tabBtnRegister) tabBtnRegister.className = 'btn btn-cyber-primary btn-sm active';
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) formRegister.style.display = 'flex';
      if (authTitle) authTitle.textContent = 'Створити акаунт (Викладач / Учень)';
    }
  }

  function selectRole(role) {
    const radioStudent = roleLabelStudent ? roleLabelStudent.querySelector('input') : null;
    const radioTeacher = roleLabelTeacher ? roleLabelTeacher.querySelector('input') : null;

    if (role === 'teacher') {
      if (roleLabelTeacher) roleLabelTeacher.classList.add('selected');
      if (roleLabelStudent) roleLabelStudent.classList.remove('selected');
      if (radioTeacher) radioTeacher.checked = true;
      if (teacherExtraFields) teacherExtraFields.style.display = 'block';
    } else {
      if (roleLabelStudent) roleLabelStudent.classList.add('selected');
      if (roleLabelTeacher) roleLabelTeacher.classList.remove('selected');
      if (radioStudent) radioStudent.checked = true;
      if (teacherExtraFields) teacherExtraFields.style.display = 'none';
    }
  }

  if (roleLabelStudent) {
    roleLabelStudent.addEventListener('click', () => selectRole('student'));
  }
  if (roleLabelTeacher) {
    roleLabelTeacher.addEventListener('click', () => selectRole('teacher'));
  }

  if (tabBtnLogin) tabBtnLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabBtnRegister) tabBtnRegister.addEventListener('click', () => switchAuthTab('register'));

  // Close buttons
  ['auth-modal-close', 'teacher-modal-close', 'student-modal-close', 'material-modal-close'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', closeAllModals);
  });

  // Open auth from links
  document.querySelectorAll('.btn-open-auth').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-auth-tab') || 'login';
      const role = btn.getAttribute('data-role') || 'student';
      openAuthModal(tab, role);
    });
  });

  // Google triggers
  document.querySelectorAll('.btn-google-login-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleGoogleAuthPrompt();
    });
  });

  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener('click', handleGoogleAuthPrompt);
  }

  // ==========================================
  // 3. GOOGLE & EMAIL AUTH HANDLERS
  // ==========================================

  async function handleGoogleAuthPrompt() {
    // Interactive Google prompt asking user to confirm name and email
    const suggestedEmail = currentUser ? currentUser.email : 'ostap.yunak@gmail.com';
    const emailPrompt = prompt('Вхід через Google: вкажіть ваш Google Email', suggestedEmail);
    if (!emailPrompt) return;

    const namePrompt = prompt('Вкажіть ваше ім\'я або назву викладача', 'Остап Юнак');
    const roleChoice = confirm('Бажаєте зареєструватися як ВИКЛАДАЧ (для створення курсів)? Натисніть ОК для Викладача, або СКАСУВАТИ для Студента/Учня.') ? 'teacher' : 'student';

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailPrompt.trim(),
          fullName: namePrompt ? namePrompt.trim() : emailPrompt.split('@')[0],
          role: roleChoice,
          googleId: 'g_' + Math.floor(Math.random() * 1000000000)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSession(data.user, data.token);
        closeAllModals();
        alert(`Вітаємо, ${data.user.fullName}! Успішний вхід через Google як ${data.user.role === 'teacher' ? 'Викладач' : 'Студент'}.`);
        if (data.user.role === 'teacher') openTeacherStudio();
      } else {
        alert(data.error || 'Помилка авторизації Google');
      }
    } catch (err) {
      alert('Помилка сервера: ' + err.message);
    }
  }

  // Form: Login submit
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('auth-alert-box');
      const formData = new FormData(formLogin);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setSession(data.user, data.token);
          closeAllModals();
          formLogin.reset();
          if (data.user.role === 'teacher') {
            openTeacherStudio();
          } else {
            openStudentHub();
          }
        } else {
          showAuthAlert(alertBox, data.error || 'Помилка входу', 'error');
        }
      } catch (err) {
        showAuthAlert(alertBox, 'Помилка сервера: ' + err.message, 'error');
      }
    });
  }

  // Form: Register submit
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('auth-alert-box');
      const formData = new FormData(formRegister);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setSession(data.user, data.token);
          closeAllModals();
          formRegister.reset();
          alert(`Реєстрація успішна! Ласкаво просимо на платформу Освітній горизонт, ${data.user.fullName}!`);
          if (data.user.role === 'teacher') {
            openTeacherStudio();
          } else {
            openStudentHub();
          }
        } else {
          showAuthAlert(alertBox, data.error || 'Помилка реєстрації', 'error');
        }
      } catch (err) {
        showAuthAlert(alertBox, 'Помилка сервера: ' + err.message, 'error');
      }
    });
  }

  function showAuthAlert(box, text, type) {
    if (!box) return;
    box.textContent = text;
    box.className = `form-alert ${type}`;
    box.style.display = 'block';
  }

  // ==========================================
  // 4. TEACHER STUDIO LOGIC
  // ==========================================

  function openTeacherStudio() {
    closeAllModals();
    if (teacherModal) {
      teacherModal.classList.add('active');
      loadTeacherCourses();
    }
  }

  const tabBtnTeacherCourses = document.getElementById('tab-btn-teacher-mycourses');
  const tabBtnTeacherCreate = document.getElementById('tab-btn-teacher-create');
  const secTeacherCourses = document.getElementById('teacher-section-mycourses');
  const secTeacherCreate = document.getElementById('teacher-section-create');

  if (tabBtnTeacherCourses && tabBtnTeacherCreate) {
    tabBtnTeacherCourses.addEventListener('click', () => {
      tabBtnTeacherCourses.classList.add('active');
      tabBtnTeacherCreate.classList.remove('active');
      secTeacherCourses.style.display = 'block';
      secTeacherCreate.style.display = 'none';
      loadTeacherCourses();
    });

    tabBtnTeacherCreate.addEventListener('click', () => {
      tabBtnTeacherCreate.classList.add('active');
      tabBtnTeacherCourses.classList.remove('active');
      secTeacherCourses.style.display = 'none';
      secTeacherCreate.style.display = 'block';
    });
  }

  async function loadTeacherCourses() {
    const listEl = document.getElementById('teacher-courses-list');
    if (!listEl) return;
    listEl.innerHTML = '<p class="text-muted">Завантаження ваших курсів...</p>';

    try {
      const res = await fetch('/api/teacher/my-courses', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();

      if (data.success && data.courses.length > 0) {
        listEl.innerHTML = '';
        data.courses.forEach(course => {
          const item = document.createElement('div');
          item.className = 'teacher-course-item';

          const materialsHtml = course.materials && course.materials.length > 0
            ? course.materials.map(m => `
                <div class="material-item-card">
                  <div>
                    <span class="material-type-badge ${m.type}">${m.type}</span>
                    <strong style="margin-left: 8px; color: #fff;">${m.title}</strong>
                    ${m.link ? `<div style="font-size: 0.8rem; margin-top: 4px;"><a href="${m.link}" target="_blank" style="color: var(--neon-cyan);">🔗 Відкрити посилання / вебінар</a></div>` : ''}
                    ${m.content ? `<div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">${m.content}</div>` : ''}
                  </div>
                </div>
              `).join('')
            : '<p style="font-size: 0.85rem; color: var(--text-dim); margin-top: 8px;">Ще немає опублікованих матеріалів або вебінарів.</p>';

          const studentsCount = course.students ? course.students.length : 0;
          const shareUrl = `${window.location.origin}?join=${course.inviteCode}`;

          item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
              <div>
                <span class="discipline-badge">${course.discipline || course.categoryName}</span>
                <h3 style="font-size: 1.3rem; font-weight: 700; color: #fff;">${course.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 620px;">${course.description}</p>
                <div class="invite-pill">
                  <span>🔑 Код для учнів: <strong>${course.inviteCode}</strong></span>
                  <button class="copy-invite-btn" onclick="navigator.clipboard.writeText('${course.inviteCode}'); alert('Код ${course.inviteCode} скопійовано!');">Скопіювати код</button>
                  <button class="copy-invite-btn" onclick="navigator.clipboard.writeText('${shareUrl}'); alert('Посилання для приєднання скопійовано: ${shareUrl}');">Скопіювати посилання</button>
                </div>
              </div>
              <div style="text-align: right;">
                <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--neon-green);">👥 Записано учнів: ${studentsCount}</span>
                <div style="margin-top: 10px;">
                  <button class="btn btn-cyber-solid btn-sm btn-add-mat" data-course-id="${course._id}" data-course-title="${course.title}">
                    📢 Додати лекцію / вебінар
                  </button>
                  <button class="btn btn-cyber-outline btn-sm btn-invite-student" data-course-id="${course._id}">
                    ✉️ Запросити учня
                  </button>
                </div>
              </div>
            </div>

            <div style="margin-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 14px;">
              <h4 style="font-size: 0.95rem; color: var(--neon-cyan); margin-bottom: 8px;">Опубліковані матеріали та вебінари (${course.materials ? course.materials.length : 0}):</h4>
              <div class="materials-list">
                ${materialsHtml}
              </div>
            </div>
          `;

          listEl.appendChild(item);
        });

        // Attach listeners to "Add material"
        document.querySelectorAll('.btn-add-mat').forEach(b => {
          b.addEventListener('click', () => {
            const cId = b.getAttribute('data-course-id');
            const cTitle = b.getAttribute('data-course-title');
            openAddMaterialModal(cId, cTitle);
          });
        });

        // Attach listeners to "Invite student"
        document.querySelectorAll('.btn-invite-student').forEach(b => {
          b.addEventListener('click', async () => {
            const cId = b.getAttribute('data-course-id');
            const email = prompt('Вкажіть email учня або студента для запрошення:');
            if (!email) return;
            const name = prompt('Вкажіть ім\'я учня (опціонально):', '');

            try {
              const invRes = await fetch(`/api/courses/${cId}/invite`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ studentEmail: email, studentName: name })
              });
              const invData = await invRes.json();
              if (invRes.ok) {
                alert(`Успіх! ${invData.message}\nПосилання для учня: ${invData.inviteLink}`);
                loadTeacherCourses();
              } else {
                alert(invData.error || 'Помилка запрошення');
              }
            } catch (err) {
              alert('Помилка: ' + err.message);
            }
          });
        });

      } else {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 40px; background: rgba(13, 20, 44, 0.4); border-radius: 12px;">
            <p style="color: var(--text-muted); font-size: 1.05rem; margin-bottom: 16px;">
              У вас ще немає створених курсів. Створіть свій перший авторський курс з будь-якого предмету!
            </p>
            <button class="btn btn-cyber-solid" onclick="document.getElementById('tab-btn-teacher-create').click();">
              ➕ Створити перший курс зараз
            </button>
          </div>
        `;
      }
    } catch (e) {
      listEl.innerHTML = `<p class="term-warn">Помилка завантаження: ${e.message}</p>`;
    }
  }

  // Create course form handler
  const formCreateCourse = document.getElementById('form-create-course');
  if (formCreateCourse) {
    formCreateCourse.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('teacher-alert-box');
      const formData = new FormData(formCreateCourse);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          formCreateCourse.reset();
          alert(`Курс "${data.course.title}" успішно створено у MongoDB Atlas!\nКод для учнів: ${data.inviteCode}`);
          if (tabBtnTeacherCourses) tabBtnTeacherCourses.click();
          loadCourses('all'); // Refresh public catalog
        } else {
          showAuthAlert(alertBox, data.error || 'Помилка створення курсу', 'error');
        }
      } catch (err) {
        showAuthAlert(alertBox, 'Помилка сервера: ' + err.message, 'error');
      }
    });
  }

  function openAddMaterialModal(courseId, courseTitle) {
    if (addMaterialModal) {
      addMaterialModal.classList.add('active');
      document.getElementById('material-course-id').value = courseId;
      document.getElementById('add-material-course-title').textContent = `Курс: ${courseTitle}`;
    }
  }

  const formAddMaterial = document.getElementById('form-add-material');
  if (formAddMaterial) {
    formAddMaterial.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('material-alert-box');
      const formData = new FormData(formAddMaterial);
      const payload = Object.fromEntries(formData.entries());
      const courseId = payload.courseId;

      try {
        const res = await fetch(`/api/courses/${courseId}/materials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert(`Матеріал "${payload.title}" успішно опубліковано для студентів!`);
          formAddMaterial.reset();
          if (addMaterialModal) addMaterialModal.classList.remove('active');
          loadTeacherCourses();
          loadCourses('all');
        } else {
          showAuthAlert(alertBox, data.error || 'Помилка публікації', 'error');
        }
      } catch (err) {
        showAuthAlert(alertBox, 'Помилка сервера: ' + err.message, 'error');
      }
    });
  }

  // ==========================================
  // 5. STUDENT LEARNING HUB LOGIC
  // ==========================================

  function openStudentHub() {
    closeAllModals();
    if (studentModal) {
      studentModal.classList.add('active');
      loadStudentCourses();
    }
  }

  async function loadStudentCourses() {
    const listEl = document.getElementById('student-enrolled-courses');
    if (!listEl) return;
    listEl.innerHTML = '<p class="text-muted">Завантаження ваших курсів...</p>';

    try {
      const res = await fetch('/api/student/my-courses', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();

      if (data.success && data.courses.length > 0) {
        listEl.innerHTML = '';
        data.courses.forEach(course => {
          const item = document.createElement('div');
          item.className = 'teacher-course-item';

          const materialsHtml = course.materials && course.materials.length > 0
            ? course.materials.map(m => `
                <div class="material-item-card">
                  <div>
                    <span class="material-type-badge ${m.type}">${m.type}</span>
                    <strong style="margin-left: 8px; color: #fff;">${m.title}</strong>
                    ${m.link ? `<div style="font-size: 0.85rem; margin-top: 5px;"><a href="${m.link}" target="_blank" style="color: var(--neon-cyan); font-weight: 600;">🔗 Відкрити вебінар / файл</a></div>` : ''}
                    ${m.content ? `<div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">${m.content}</div>` : ''}
                  </div>
                </div>
              `).join('')
            : '<p style="font-size: 0.85rem; color: var(--text-dim); margin-top: 8px;">Викладач ще готує матеріали для цього курсу.</p>';

          item.innerHTML = `
            <div>
              <span class="discipline-badge">${course.discipline || course.categoryName}</span>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff;">${course.title}</h3>
              <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px;">
                👨‍🏫 Викладач: <strong>${course.instructorName || 'Освітній горизонт'}</strong> | 🏫 ${course.institution || 'Кампус'}
              </p>
              <div style="margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                <h4 style="font-size: 0.92rem; color: var(--neon-cyan); margin-bottom: 8px;">Лекції, завдання та вебінари:</h4>
                <div class="materials-list">
                  ${materialsHtml}
                </div>
              </div>
            </div>
          `;
          listEl.appendChild(item);
        });
      } else {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 30px; background: rgba(13, 20, 44, 0.4); border-radius: 12px;">
            <p style="color: var(--text-muted); margin-bottom: 14px;">
              Ви ще не приєднані до жодного курсу. Введіть код запрошення від вчителя вище або оберіть курс у каталозі!
            </p>
          </div>
        `;
      }
    } catch (e) {
      listEl.innerHTML = `<p class="term-warn">Помилка: ${e.message}</p>`;
    }
  }

  // Join course helper
  async function handleJoinCourse(code) {
    if (!currentUser || !authToken) {
      pendingInviteCode = code;
      openAuthModal('login');
      alert(`Щоб приєднатися до курсу за кодом "${code}", увійдіть у свій акаунт або зареєструйтесь через Google / Email.`);
      return;
    }

    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ inviteCode: code })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        openStudentHub();
      } else {
        alert(data.error || 'Не вдалося приєднатися до курсу');
      }
    } catch (err) {
      alert('Помилка: ' + err.message);
    }
  }

  // Student Hub join form
  const studentJoinForm = document.getElementById('student-join-form');
  if (studentJoinForm) {
    studentJoinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('student-invite-code').value.trim();
      if (code) handleJoinCourse(code);
    });
  }

  // Homepage Quick Join Form
  if (quickJoinForm) {
    quickJoinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = quickJoinInput.value.trim();
      if (code) handleJoinCourse(code);
    });
  }

  // ==========================================
  // 6. PUBLIC COURSES CATALOG LOADING
  // ==========================================

  async function loadCourses(category = 'all') {
    if (!coursesContainer) return;

    try {
      const url = category === 'all' ? '/api/courses' : `/api/courses?category=${category}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        renderCourseCards(data.courses);
      }
    } catch (e) {
      console.error('Помилка завантаження курсів:', e);
      coursesContainer.innerHTML = '<div class="term-warn">Помилка завантаження каталогу курсів.</div>';
    }
  }

  function renderCourseCards(courses) {
    coursesContainer.innerHTML = '';

    if (courses.length === 0) {
      coursesContainer.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1; text-align: center;">За обраним фільтром курсів не знайдено.</p>';
      return;
    }

    courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';

      const techBadges = (course.techStack || [])
        .map(t => `<span class="tech-pill">${t}</span>`)
        .join('');

      const highlightsList = (course.highlights || [])
        .map(h => `<li><span class="term-cyan">▹</span> ${h}</li>`)
        .join('');

      const inviteCode = course.inviteCode || 'HORIZON';

      card.innerHTML = `
        <div class="course-card-header">
          <span class="course-badge">${course.badge || 'PRO'}</span>
          <span class="discipline-badge">${course.discipline || course.categoryName}</span>
        </div>
        <h3 class="course-title">${course.title}</h3>
        <p style="font-size: 0.85rem; color: var(--neon-cyan); margin-bottom: 8px;">
          👨‍🏫 Викладач: <strong>${course.instructorName || 'Освітній горизонт'}</strong> (${course.institution || 'Кампус'})
        </p>
        <p class="course-description">${course.description}</p>
        <div class="course-meta">
          <span>⏱️ ${course.duration || '3 місяці'}</span>
          <span>⚡ ${course.level || 'Всі рівні'}</span>
        </div>
        <div class="invite-pill" style="margin-bottom: 14px;">
          <span>Код курсу: <strong>${inviteCode}</strong></span>
          <button class="copy-invite-btn" onclick="navigator.clipboard.writeText('${inviteCode}'); alert('Код ${inviteCode} скопійовано! Вставте його у полі швидкого входу.');">Копіювати</button>
        </div>
        <ul style="list-style: none; margin-bottom: 16px; font-size: 0.84rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 5px;">
          ${highlightsList}
        </ul>
        <div class="course-tech-stack">
          ${techBadges}
        </div>
        <div class="course-card-footer">
          <span class="spots-counter">🟢 Місць: ${course.spotsLeft || 20}</span>
          <button class="btn btn-cyber-primary btn-sm btn-join-direct" data-code="${inviteCode}">
            Приєднатися
          </button>
        </div>
      `;

      coursesContainer.appendChild(card);
    });

    document.querySelectorAll('.btn-join-direct').forEach(b => {
      b.addEventListener('click', () => {
        const code = b.getAttribute('data-code');
        handleJoinCourse(code);
      });
    });
  }

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-category');
      loadCourses(category);
    });
  });

  // System Status Check
  async function checkSystemStatus() {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        if (dbStatusText) {
          dbStatusText.textContent = `MongoDB Atlas: ${data.database.connected ? '🟢 Підключено' : '🍃 Готово'}`;
        }
        if (renderStatusText) {
          renderStatusText.textContent = `Render.com: 🟢 Онлайн (${data.deployment.environment})`;
        }
      }
    } catch (e) {}
  }

  // Initialize
  updateAuthUI();
  checkSystemStatus();
  loadCourses('all');
});
