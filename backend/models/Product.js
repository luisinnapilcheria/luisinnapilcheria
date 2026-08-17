const mongoose = require('mongoose');

// Esquema para variantes individuales (Talle + Color + Stock + Imagen específica)
const variantSchema = new mongoose.Schema({
  size: { type: String, required: true, uppercase: true, trim: true },
  color: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  image: { type: String, default: '' }, // 📸 Foto opcional específica del color/variante
  sku: { type: String, default: '' }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  priceRetail: { type: Number, required: true, default: 0 },
  priceWholesale: { type: Number, default: 0 },
  minWholesaleQty: { type: Number, default: 6 },
  isWholesale: { type: Boolean, default: false },
  image: { type: String, default: '' }, // Foto principal / por defecto
  detailImage: { type: String, default: '' },
  category: { type: String, required: true },
  variants: [variantSchema],
  stockTotal: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  destacado: { type: Boolean, default: false }
}, { timestamps: true });

// Middleware pre-save corregido para Mongoose
productSchema.pre('save', function () {
  if (this.variants && this.variants.length > 0) {
    this.stockTotal = this.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  } else {
    this.stockTotal = 0;
  }
});

module.exports = mongoose.model('Product', productSchema);