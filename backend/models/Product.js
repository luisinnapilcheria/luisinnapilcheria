const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },                 // 👈 Agregado para compatibilidad con el controlador
  priceRetail: { type: Number, required: true, default: 0 }, // Precio Minorista
  priceWholesale: { type: Number, default: 0 },       // Precio Mayorista
  minWholesaleQty: { type: Number, default: 6 },      // Mínimo de unidades para precio mayorista
  isWholesale: { type: Boolean, default: false },     // 👈 Agregado para compatibilidad con el controlador
  image: { type: String, default: '' },               // Foto miniatura (Catálogo / Home)
  detailImage: { type: String, default: '' },         // 🌟 Foto grande para el Pop-up / Detalle
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  salesCount: { type: Number, default: 0 },           // Contador de ventas para el ranking
  destacado: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);