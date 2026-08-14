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

// Crear producto (Admin / Dueña) - Soporta Minorista + Mayorista + Foto Detalle
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
      image, 
      detailImage, // 👈 Capturamos la foto ampliada
      destacado 
    } = req.body;

    const finalRetailPrice = Number(priceRetail || price || 0);
    const finalWholesalePrice = Number(priceWholesale || 0);

    const productData = {
      name,
      category,
      description: description || '',
      price: finalRetailPrice,
      priceRetail: finalRetailPrice,
      priceWholesale: finalWholesalePrice,
      minWholesaleQty: Number(minWholesaleQty || 1),
      isWholesale: isWholesale !== undefined ? Boolean(isWholesale) : finalWholesalePrice > 0,
      stock: Number(stock || 0),
      image: image || '',
      detailImage: detailImage || '', // 👈 Se guarda en MongoDB al crear
      destacado: Boolean(destacado),
      salesCount: 0
    };

    const product = new Product(productData);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("❌ Error interno al crear producto:", error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

// Actualizar producto (Admin / Dueña) - Preserva lógica Mayorista y Foto Detalle
exports.updateProduct = async (req, res) => {
  try {
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

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
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