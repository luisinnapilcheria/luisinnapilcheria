const Product = require('../models/Product');

// Obtener todos los productos (con opción de búsqueda y filtro por categoría)
exports.getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    let filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'Todas') {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

// Obtener los productos más vendidos / destacados
exports.getTopProducts = async (req, res) => {
  try {
    const topProducts = await Product.find({})
      .sort({ salesCount: -1 })
      .limit(6);
    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos destacados', error: error.message });
  }
};

// Crear producto (Admin / Dueña) - Soporta Variantes (Talle/Color), Minorista, Mayorista y Fotos
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, 
      category, 
      description, 
      priceRetail, 
      price, 
      priceWholesale, 
      minWholesaleQty,
      isWholesale,
      stock, 
      variants, // 👈 Matriz de variantes [ { size, color, stock }, ... ]
      image, 
      detailImage,
      destacado 
    } = req.body;

    const finalRetailPrice = Number(priceRetail || price || 0);
    const finalWholesalePrice = Number(priceWholesale || 0);

    // Procesamiento de variantes: si no se envían variantes, se genera una por defecto basada en "stock"
    let finalVariants = Array.isArray(variants) ? variants : [];
    if (finalVariants.length === 0 && stock !== undefined) {
      finalVariants.push({
        size: 'Único',
        color: 'Surtido',
        stock: Number(stock || 0)
      });
    }

    const productData = {
      name,
      category,
      description: description || '',
      price: finalRetailPrice,
      priceRetail: finalRetailPrice,
      priceWholesale: finalWholesalePrice,
      minWholesaleQty: Number(minWholesaleQty || 1),
      isWholesale: isWholesale !== undefined ? Boolean(isWholesale) : finalWholesalePrice > 0,
      variants: finalVariants, // 👈 Se guardan las variantes
      image: image || '',
      detailImage: detailImage || '',
      destacado: Boolean(destacado),
      salesCount: 0
    };

    const product = new Product(productData);
    const createdProduct = await product.save(); // 🔄 El pre('save') calculará el stockTotal
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("❌ Error interno al crear producto:", error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

// Actualizar producto (Admin / Dueña) - Preserva variantes y recalcula stockTotal
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const updateData = { ...req.body };
    
    if (updateData.priceRetail || updateData.price) {
      const finalPrice = Number(updateData.priceRetail || updateData.price);
      updateData.price = finalPrice;
      updateData.priceRetail = finalPrice;
    }

    if (updateData.priceWholesale !== undefined) {
      updateData.priceWholesale = Number(updateData.priceWholesale || 0);
    }

    if (updateData.minWholesaleQty !== undefined) {
      updateData.minWholesaleQty = Number(updateData.minWholesaleQty || 1);
    }

    // Si viene actualización de stock directo (sin variantes en el body), actualiza o genera una variante por defecto
    if (updateData.stock !== undefined && (!updateData.variants || updateData.variants.length === 0)) {
      if (product.variants && product.variants.length > 0) {
        product.variants[0].stock = Number(updateData.stock);
      } else {
        product.variants = [{ size: 'Único', color: 'Surtido', stock: Number(updateData.stock) }];
      }
      delete updateData.stock;
    }

    // Asignar los campos actualizados al documento existente
    Object.assign(product, updateData);

    // Guardar mediante .save() para disparar el hook pre('save') que recalcula stockTotal
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
};

// Dar de baja / Eliminar producto (Admin / Dueña)
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
};