// Main Application Logic for 'Освітній горизонт'

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const coursesContainer = document.getElementById('courses-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const modalOverlay = document.getElementById('registration-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCourseSelect = document.getElementById('modal-course-select');
  const modalForm = document.getElementById('modal-registration-form');
  const bannerForm = document.getElementById('banner-registration-form');
  const bannerCourseSelect = document.getElementById('banner-course-select');
  const dbStatusText = document.getElementById('live-db-status');
  const renderStatusText = document.getElementById('live-render-status');

  let allCourses = [];

  // 1. Fetch System Status
  async function checkSystemStatus() {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        if (dbStatusText) {
          dbStatusText.textContent = `MongoDB Atlas: ${data.database.connected ? '🟢 Активно' : '🍃 Готово до зв\'язку'}`;
        }
        if (renderStatusText) {
          renderStatusText.textContent = `Render.com: 🟢 Онлайн (${data.deployment.environment})`;
        }
      }
    } catch (e) {
      console.log('Status check offline or fallback mode');
    }
  }

  // 2. Fetch and Render Courses
  async function loadCourses(category = 'all') {
    if (!coursesContainer) return;

    try {
      const url = category === 'all' ? '/api/courses' : `/api/courses?category=${category}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        allCourses = data.courses;
        renderCourseCards(data.courses);
        populateCourseSelects(data.courses);
      }
    } catch (e) {
      console.error('Помилка завантаження курсів:', e);
      coursesContainer.innerHTML = '<div class="term-warn">Помилка завантаження каталогу курсів. Спробуйте пізніше.</div>';
    }
  }

  function renderCourseCards(courses) {
    coursesContainer.innerHTML = '';

    if (courses.length === 0) {
      coursesContainer.innerHTML = '<p class="text-muted">За обраним фільтром курсів не знайдено.</p>';
      return;
    }

    courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';

      const techBadges = course.techStack
        .map(t => `<span class="tech-pill">${t}</span>`)
        .join('');

      const highlightsList = course.highlights
        .map(h => `<li><span class="term-cyan">▹</span> ${h}</li>`)
        .join('');

      card.innerHTML = `
        <div class="course-card-header">
          <span class="course-badge">${course.badge || 'PRO'}</span>
          <span class="course-category-tag">${course.categoryName}</span>
        </div>
        <h3 class="course-title">${course.title}</h3>
        <p class="course-description">${course.description}</p>
        <div class="course-meta">
          <span>⏱️ ${course.duration}</span>
          <span>⚡ ${course.level}</span>
        </div>
        <ul style="list-style: none; margin-bottom: 18px; font-size: 0.86rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px;">
          ${highlightsList}
        </ul>
        <div class="course-tech-stack">
          ${techBadges}
        </div>
        <div class="course-card-footer">
          <span class="spots-counter">🟢 Вільних місць: ${course.spotsLeft}</span>
          <button class="btn btn-cyber-primary btn-sm btn-enroll-card" data-course-id="${course.id}" data-course-title="${course.title}">
            Записатися
          </button>
        </div>
      `;

      coursesContainer.appendChild(card);
    });

    // Attach click listeners to cards
    document.querySelectorAll('.btn-enroll-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const courseId = e.currentTarget.getAttribute('data-course-id');
        openModalWithCourse(courseId);
      });
    });
  }

  function populateCourseSelects(courses) {
    const selects = [modalCourseSelect, bannerCourseSelect].filter(Boolean);
    selects.forEach(select => {
      // Keep only first disabled option
      select.innerHTML = '<option value="" disabled selected>Оберіть напрямок або курс...</option>';
      courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `[${c.categoryName}] ${c.title}`;
        select.appendChild(opt);
      });
    });
  }

  // 3. Filter Buttons Handler
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-category');
      loadCourses(category);
    });
  });

  // 4. Modal Functions
  function openModalWithCourse(courseId = null) {
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      if (courseId && modalCourseSelect) {
        modalCourseSelect.value = courseId;
      }
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      const alertBox = document.getElementById('modal-alert-box');
      if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.className = 'form-alert';
      }
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.querySelectorAll('.btn-open-modal').forEach(btn => {
    btn.addEventListener('click', () => openModalWithCourse());
  });

  // 5. Submit Form Helper (MongoDB Atlas Integration)
  async function handleRegistrationSubmit(formElement, alertBoxId) {
    const alertBox = document.getElementById(alertBoxId);
    const submitBtn = formElement.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Надіслати';

    const formData = new FormData(formElement);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.fullName || !payload.email || !payload.phone || !payload.courseId) {
      showAlert(alertBox, 'Будь ласка, заповніть всі обов\'язкові поля.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⚡ Відправка в базу даних...';
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        const storageNote = resData.storage === 'MongoDB Atlas' 
          ? '🍃 Збережено в базі даних MongoDB Atlas!' 
          : '⚡ Заявку прийнято сервером!';
        showAlert(alertBox, `Вітаємо, ${payload.fullName}! ${resData.message} (${storageNote})`, 'success');
        formElement.reset();
      } else {
        showAlert(alertBox, resData.error || 'Виникла помилка під час збереження.', 'error');
      }
    } catch (err) {
      showAlert(alertBox, 'Помилка з\'єднання з сервером: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  }

  function showAlert(box, message, type) {
    if (!box) return;
    box.textContent = message;
    box.className = `form-alert ${type}`;
    box.style.display = 'block';
  }

  // 6. Form Listeners
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleRegistrationSubmit(modalForm, 'modal-alert-box');
    });
  }

  if (bannerForm) {
    bannerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleRegistrationSubmit(bannerForm, 'banner-alert-box');
    });
  }

  // 7. Initialize
  checkSystemStatus();
  loadCourses('all');
});
