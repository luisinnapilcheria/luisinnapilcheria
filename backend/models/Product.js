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
  
  // 📸 Galería principal de imágenes del producto
  images: [{ type: String }],

  // Compatibilidad con tu código actual (se auto-asignan con la primera foto de `images`)
  image: { type: String, default: '' }, 
  detailImage: { type: String, default: '' },

  category: { type: String, required: true },
  variants: [variantSchema],
  stockTotal: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  destacado: { type: Boolean, default: false }
}, { timestamps: true });

// Middleware pre-save para calcular stock y sincronizar la imagen principal
productSchema.pre('save', function (next) {
  // 1. Si enviaron el array 'images', se asegura de completar 'image' y 'detailImage' automáticamente
  if (this.images && this.images.length > 0) {
    if (!this.image) this.image = this.images[0];
    if (!this.detailImage) this.detailImage = this.images[1] || this.images[0];
  } else if (this.image) {
    // Si enviaron solo 'image', poblar el array 'images' para mantener consistencia
    this.images = [this.image];
    if (this.detailImage) this.images.push(this.detailImage);
  }

  // 2. Cálculo del Stock Total
  if (this.variants && this.variants.length > 0) {
    this.stockTotal = this.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  } else {
    this.stockTotal = 0;
  }

  if (typeof next === 'function') next();
});

module.exports = mongoose.model('Product', productSchema);