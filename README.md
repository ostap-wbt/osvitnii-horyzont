# 🌐 Освітня платформа "Освітній горизонт"

> **Платформа інноваційної IT-освіти майбутнього**: Кібербезпека, Робототехніка & IoT, Цифрові мережі, Віртуальна та доповнена реальність (VR/AR), Штучний інтелект та Сучасне програмування.

[![Live Website](https://img.shields.io/badge/Live%20Website-osvitnii--horyzont.onrender.com-00f0ff?style=flat&logo=render)](https://osvitnii-horyzont.onrender.com)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/web/srv-db54ppjrjlhs73ce4clg)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js%20v16%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub Repo](https://img.shields.io/badge/Repository-GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/ostap-wbt/osvitnii-horyzont)

🔥 **Онлайн-сайт платформи в реальному часі:** [**https://osvitnii-horyzont.onrender.com**](https://osvitnii-horyzont.onrender.com)

---

## 🚀 Про проект

**"Освітній горизонт"** — це відкритий високотехнологічний освітній простір для **викладачів усіх дисциплін та їхніх учнів і студентів**. Платформа поєднує як інноваційні High-Tech спеціалізації, так і класичні академічні науки:

1. 👨‍🏫 **Для викладачів будь-яких предметів**: Вчителі математики, фізики, мов, історії, біології, кібербезпеки та програмування реєструються, створюють власні авторські курси, публікують лекції, прикріплюють конспекти та проводять вебінари (Google Meet / Zoom).
2. 🎓 **Для учнів та студентів**: Долучення до курсів за кодом запрошення від вчителя (напр. `MATH-4019`), доступ до матеріалів 24/7 та перегляд розкладу занять.
3. 🔑 **Автентифікація**: Реєстрація через **Google** в один клік або за **Email / Паролем** із вибором ролі (*Викладач* чи *Студент*).
4. 🛡️ **Дисципліни**:
   - 📐 **Точні науки**: Вища математика, Алгебра, Геометрія, Прикладна фізика
   - 🌍 **Природничі науки**: Молекулярна біологія, Біоінформатика, Хімія
   - 🇬🇧 **Мови та комунікація**: Academic & Tech English, Українська мова
   - 🛡️ **Кібербезпека**: Етичний хакінг, SOC, PenTest, Постквантова криптографія
   - 🤖 **Робототехніка & IoT**: ROS 2, STM32, Автономні дрони
   - 🥽 **VR / AR**: Spatial Computing для Meta Quest 3 та Apple Vision Pro
   - 💻 **Програмування & ШІ**: Fullstack, Python, Go, Штучний інтелект (AI/ML)

---

## ⚡ Особливості платформи

- **Кабінет викладача (Teacher Studio)**: Створення навчальних програм, генератор кодів запрошення, публікація лекцій та вебінарів, список записаних учнів.
- **Кабінет учня (Student Learning Hub)**: Вхід за кодом курсу, перегляд активних занять, доступ до конспектів та посилань на ефіри.
- **Вхід через Google**: Швидка авторизація через Google-акаунт з автоматичною синхронізацією ролей.
- **Futuristic High-Tech UI**: Неонова кібер-палітра, ефекти скляного морфізму (glassmorphism), квантова сітка та анімований фон на HTML5 Canvas.
- **Інтерактивний Кібер-Термінал**: Онлайн-симулятор із командами (`teacher`, `math`, `scan`, `robot`, `vr`, `net`, `ai`, `courses`, `status`).
- **Сховище у хмарі MongoDB Atlas**: Усі користувачі, авторські курси, лекції та учні зберігаються у реальній базі даних.

---

## 🛠️ Стек технологій

- **Frontend**: HTML5, Modern CSS3, Canvas Particles Engine, Interactive Terminal JS, Адаптивний дизайн.
- **Backend**: Node.js, Express.js REST API.
- **База даних**: **MongoDB Atlas** (Mongoose ODM).
- **Хмарний хостинг**: **Render.com** (автоматичний білд через `render.yaml`).
- **Контроль версій**: **GitHub** (`ostap-wbt/osvitnii-horyzont`).
- **Акаунт власника**: `ostap.yunak@gmail.com`.

---

## 💻 Локальний запуск та тестування

### 1. Клонування репозиторію
```bash
git clone https://github.com/ostap-wbt/osvitnii-horyzont.git
cd osvitnii-horyzont
```

### 2. Встановлення залежностей
```bash
npm install
```

### 3. Налаштування змінних оточення
Створіть файл `.env` на основі `.env.example`:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/osvitnii_horyzont?retryWrites=true&w=majority
NODE_ENV=development
```
*(Примітка: якщо рядок підключення ще не додано, сервер автоматично активує безпечний режим In-Memory Fallback).*

### 4. Запуск сервера
```bash
npm start
```
Відкрийте у браузері: [http://localhost:3000](http://localhost:3000)

---

## 🍃 Налаштування MongoDB Atlas (Виконано для ostap.yunak@gmail.com)

Базу даних успішно створено та налаштовано в хмарі **MongoDB Atlas**:

- **Організація:** `Ostap`
- **Проект:** `osvitnii-horyzont` (ID: `6aca4ade5baf02c7ed8163e9`)
- **Кластер:** `HorizonCluster` (Tier: **M0 Free**, AWS Frankfurt `eu-central-1`)
- **База даних:** `osvitnii_horyzont`
- **Користувач БД:** `ostap_admin`
- **Мережевий доступ:** `0.0.0.0/0` (активовано для Render.com та локальної розробки)
- **Готовий рядок підключення для Render.com:**
  ```text
  mongodb+srv://ostap_admin:HorizonSecurePass2026@horizoncluster.dy1xzc8.mongodb.net/osvitnii_horyzont?retryWrites=true&w=majority
  ```

---

## ☁️ Інструкція з розгортання на Render.com

Репозиторій містить готовий конфігураційний файл `render.yaml` (Render Blueprint), що налаштовує веб-сервіс автоматично.

### Спосіб 1: Через Blueprint (Найпростіший)
1. Увійдіть у [Render Dashboard](https://dashboard.render.com/) за допомогою акаунта `ostap.yunak@gmail.com` або через GitHub (`ostap-wbt`).
2. Натисніть **New +** -> **Blueprint**.
3. Підключіть репозиторій `ostap-wbt/osvitnii-horyzont`.
4. Вкажіть значення для секрету `MONGODB_URI` (ваш рядок з MongoDB Atlas).
5. Натисніть **Apply** — Render збілдить та запустить сервіс за кілька хвилин!

### Спосіб 2: Створення звичайного Web Service
1. У Render Dashboard натисніть **New +** -> **Web Service**.
2. Оберіть репозиторій `ostap-wbt/osvitnii-horyzont`.
3. Заповніть параметри:
   - **Name**: `osvitnii-horyzont`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. У розділі **Environment Variables** додайте:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `<ваш рядок підключення до MongoDB Atlas>`
5. У розділі **Health Check Path** встановіть `/api/health`.
6. Натисніть **Create Web Service**.

Після успішного деплою сайт буде доступний за адресою:
`https://osvitnii-horyzont.onrender.com`

---

## 📡 REST API Ендпоінти

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| `GET` | `/api/health` | Перевірка працездатності для Render.com (health check) |
| `GET` | `/api/system-status` | Статус зв'язку з MongoDB Atlas та стан хмари |
| `GET` | `/api/courses` | Отримання списку навчальних програм (фільтрація за `?category=`) |
| `POST` | `/api/register` | Реєстрація студента на курс зі збереженням у MongoDB Atlas |
| `POST` | `/api/inquiry` | Запит на швидку консультацію технічного ментора |
| `GET` | `/api/stats` | Лічильники студентів, працевлаштування та партнерів |

---

## 👥 Контакти та автор

- **Проект**: "Освітній горизонт"
- **GitHub**: [@ostap-wbt](https://github.com/ostap-wbt)
- **Email**: [ostap.yunak@gmail.com](mailto:ostap.yunak@gmail.com)
- **Ліцензія**: MIT
