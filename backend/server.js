const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const app = express();

// 1. Configuración de CORS corregida (compatible con credentials: true)
const allowedOrigins = [
  'https://luisinnapilcheria.onrender.com', // Reemplaza con la URL exacta de tu Static Site si es diferente
  'http://localhost:5173',                  // Entorno local (Vite)
  'http://localhost:3000'                   // Entorno local (React App)
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como clientes de API, curl, o solicitudes entre servidores)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permite acceso si la URL cambia o no está mapeada exactamente
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middlewares para JSON e imágenes (Ampliamos a 50mb para evitar sorpresas)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));

// Función para crear o actualizar la cuenta de la dueña en la BD al arrancar
const initAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'luisinnapilcheria@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Luisinna123456';

    // Encriptamos la contraseña con bcrypt para evitar fallos en la autenticación
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'Dueña Luisinna Pilcheria',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isAdmin: true
      });
      console.log('👑 ¡Cuenta de la Dueña creada con éxito!');
    } else {
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log('🔄 ¡Cuenta de Admin re-sincronizada con éxito!');
    }
  } catch (error) {
    console.error('Error al inicializar cuenta admin:', error.message);
  }
};

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexión exitosa a MongoDB Atlas 🍃');
    initAdmin();
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.send('El servidor de Luisinna Pilcheria está funcionando correctamente 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});