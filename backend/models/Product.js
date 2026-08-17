const mongoose = require('mongoose');

// Esquema para las variantes individuales (Talle + Color + Stock)
const variantSchema = new mongoose.Schema({
  size: { type: String, required: true, uppercase: true, trim: true }, // Ej: "S", "M", "L", "42"
  color: { type: String, required: true, trim: true },                 // Ej: "Negro", "Rosa Pastelería"
  stock: { type: Number, required: true, min: 0, default: 0 },         // Cantidad exacta para este talle/color
  sku: { type: String, default: '' }                                   // Opcional: código interno
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  priceRetail: { type: Number, required: true, default: 0 },
  priceWholesale: { type: Number, default: 0 },
  minWholesaleQty: { type: Number, default: 6 },
  isWholesale: { type: Boolean, default: false },
  image: { type: String, default: '' },
  detailImage: { type: String, default: '' },
  category: { type: String, required: true },
  
  // 🌟 MATRIZ DE VARIANTES (Talles + Colores + Stock)
  variants: [variantSchema],

  // 🌟 STOCK TOTAL (Calculado automáticamente antes de guardar)
  stockTotal: { type: Number, default: 0 },

  salesCount: { type: Number, default: 0 },
  destacado: { type: Boolean, default: false }
}, { timestamps: true });

// 🔄 Middleware de Mongoose: Recalcula stockTotal automáticamente antes de guardar
productSchema.pre('save', function () {
  if (this.variants && this.variants.length > 0) {
    this.stockTotal = this.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  } else {
    this.stockTotal = 0;
  }
});

module.exports = mongoose.model('Product', productSchema);