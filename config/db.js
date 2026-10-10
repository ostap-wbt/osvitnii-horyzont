const mongoose = require('mongoose');

let isConnected = false;
const inMemoryData = {
  registrations: [],
  inquiries: []
};

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<PASSWORD>')) {
    console.warn('\n⚠️ [MongoDB Atlas]: MONGODB_URI не налаштовано або містить плейсхолдер <PASSWORD>.');
    console.warn('ℹ️ [Підказка]: Додайте валідний рядок підключення MongoDB Atlas у змінні середовища або файл .env:');
    console.warn('   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/osvitnii_horyzont?retryWrites=true&w=majority"');
    console.warn('⚡ [Fallback]: Сервер працюватиме в режимі локальної безпечної пам\'яті (In-Memory Fallback), зберігаючи заявки тимчасово.\n');
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 8000,
    });

    isConnected = true;
    console.log(`\n✅ [MongoDB Atlas]: Успішно підключено до кластера бази даних: ${mongoose.connection.host}`);
    console.log(`📦 База даних: ${mongoose.connection.name}\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ [MongoDB Atlas Помилка підключення]: ${error.message}`);
    console.warn('⚡ [Fallback]: Сервер продовжує роботу в режимі локальної пам\'яті для заявок студентів.\n');
    isConnected = false;
    return false;
  }
}

function getDbStatus() {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'Відключено (In-Memory Fallback)',
    1: 'Підключено (MongoDB Atlas 🍃)',
    2: 'Підключення...',
    3: 'Відключення...'
  };

  return {
    connected: readyState === 1,
    statusText: states[readyState] || 'Невідомо',
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    account: 'ostap.yunak@gmail.com'
  };
}

module.exports = {
  connectDB,
  getDbStatus,
  inMemoryData
};
