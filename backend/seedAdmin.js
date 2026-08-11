require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const adminEmail = process.env.ADMIN_EMAIL || 'luisinnaindumentaria@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Luisinna123456';

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('No se encontró MONGO_URI');

    console.log('🍃 Conectando a MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    console.log(`🧹 Limpiando registros previos...`);
    await User.deleteMany({ email: adminEmail });

    // PASAMOS LA CONTRASEÑA EN TEXTO PLANO
    // El hook .pre('save') de User.js la encriptará automáticamente una sola vez
    const newAdmin = await User.create({
      name: 'Dueña Luisinna Indumentaria',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isAdmin: true
    });

    console.log('==================================================');
    console.log('👑 ¡USUARIO ADMIN CREADO Y ENCRIPTADO CORRECTAMENTE!');
    console.log(`📌 ID: ${newAdmin._id}`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Contraseña: ${adminPassword}`);
    console.log('==================================================');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runSeed();