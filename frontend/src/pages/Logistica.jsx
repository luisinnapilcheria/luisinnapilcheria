import React, { useState, useEffect } from 'react';

const getCleanApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://luisinnapilcheria-api.onrender.com/api';

  if ((url.match(/https?:\/\//g) || []).length > 1) {
    const parts = url.split(/(?=https?:\/\/)/);
    url = parts[parts.length - 1];
  }

  url = url.replace(/[\[\]\(\)'"]/g, '').trim().replace(/\/+$/, '');

  if (!url.endsWith('/api')) {
    url += '/api';
  }

  return url;
};

const API_URL = getCleanApiUrl();

export default function Logistica() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para el formulario de alta de prenda
  const [newProduct, setNewProduct] = useState({
    name: '',
    priceRetail: '',
    category: '',
    image: '',
    variants: [{ size: '', color: '', stock: 0 }]
  });

  // CARGAR PRODUCTOS DESDE LA API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al cargar productos:', err);
        setLoading(false);
      });
  };

  const handlePriceChange = (id, value) => {
    setProducts(products.map(p => 
      p._id === id ? { ...p, priceRetail: Number(value) } : p
    ));
  };

  const handleSavePrice = (product) => {
    fetch(`${API_URL}/products/${product._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceRetail: product.priceRetail })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al actualizar precio');
        alert('✅ Precio actualizado correctamente');
      })
      .catch((err) => alert('❌ Error: ' + err.message));
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  // Manejo de variantes en el alta
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === 'stock' ? Number(value) : value
    };
    setNewProduct({ ...newProduct, variants: updatedVariants });
  };

  const addVariantRow = () => {
    setNewProduct({
      ...newProduct,
      variants: [...newProduct.variants, { size: '', color: '', stock: 0 }]
    });
  };

  const removeVariantRow = (index) => {
    if (newProduct.variants.length === 1) return;
    const updated = newProduct.variants.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, variants: updated });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.priceRetail) return;

    const payload = {
      ...newProduct,
      priceRetail: Number(newProduct.priceRetail),
      variants: newProduct.variants.filter(v => v.size || v.color)
    };

    fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al crear producto');
        return res.json();
      })
      .then((savedProduct) => {
        setProducts([savedProduct, ...products]);
        setNewProduct({
          name: '',
          priceRetail: '',
          category: '',
          image: '',
          variants: [{ size: '', color: '', stock: 0 }]
        });
        alert('🎉 Prenda registrada exitosamente');
      })
      .catch((err) => alert('❌ Error: ' + err.message));
  };

  const handleDeleteProduct = (id) => {
    if (confirm('¿Seguro que querés dar de baja esta prenda?')) {
      fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
        .then((res) => {
          if (!res.ok) throw new Error('Error al eliminar');
          setProducts(products.filter(p => p._id !== id));
        })
        .catch((err) => alert('❌ Error: ' + err.message));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-light uppercase tracking-wide text-stone-900">
          Panel de Logística e Indumentaria
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Gestión de stock, precios y altas de prendas para Luisinna Pilcheria.
        </p>
      </div>
      
      {/* Formulario rápido de Alta */}
      <div className="bg-white p-6 rounded-xs shadow-2xs border border-rose-100 mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800 mb-4 flex items-center gap-2">
          <span>👗</span> Agregar Nueva Prenda
        </h3>
        <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <input 
              type="text" 
              name="name"
              value={newProduct.name}
              onChange={handleNewProductChange}
              placeholder="Nombre de la prenda *" 
              required
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900" 
            />
            <input 
              type="number" 
              name="priceRetail"
              value={newProduct.priceRetail}
              onChange={handleNewProductChange}
              placeholder="Precio ($) *" 
              required
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900" 
            />
            <input 
              type="text" 
              name="category"
              value={newProduct.category}
              onChange={handleNewProductChange}
              placeholder="Categoría (Ej: Remeras)" 
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900" 
            />
          </div>

          {/* Sección de Variantes (Talles y Colores) */}
          <div className="border-t border-stone-200 pt-3">
            <label className="font-semibold text-stone-700 block mb-2 uppercase text-[10px] tracking-wider">
              Variantes (Talle, Color y Stock)
            </label>
            {newProduct.variants.map((v, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input 
                  type="text" 
                  placeholder="Talle (ej: S, M, 38)" 
                  value={v.size} 
                  onChange={(e) => handleVariantChange(i, 'size', e.target.value)}
                  className="w-1/3 px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xs"
                />
                <input 
                  type="text" 
                  placeholder="Color (ej: Negro, Blanco)" 
                  value={v.color} 
                  onChange={(e) => handleVariantChange(i, 'color', e.target.value)}
                  className="w-1/3 px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xs"
                />
                <input 
                  type="number" 
                  placeholder="Stock" 
                  value={v.stock} 
                  onChange={(e) => handleVariantChange(i, 'stock', e.target.value)}
                  className="w-1/4 px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xs"
                />
                {newProduct.variants.length > 1 && (
                  <button type="button" onClick={() => removeVariantRow(i)} className="text-rose-600 font-bold px-1">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addVariantRow}
              className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider hover:text-stone-900 transition mt-1"
            >
              + Agregar otra variante
            </button>
          </div>

          <button 
            type="submit"
            className="w-full bg-stone-900 text-white font-medium uppercase tracking-widest py-2 rounded-xs hover:bg-stone-800 transition cursor-pointer"
          >
            Dar de Alta Prenda
          </button>
        </form>
      </div>

      {/* Tabla de Modificaciones */}
      <div className="bg-white rounded-xs shadow-2xs overflow-x-auto border border-rose-100">
        {loading ? (
          <div className="p-6 text-center text-xs text-stone-400 uppercase tracking-widest">Cargando inventario...</div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-900 text-white font-light uppercase tracking-wider text-[11px] border-b border-stone-800">
                <th className="p-3">Prenda</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Variantes / Stock</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {products.map(p => {
                const totalStock = p.variants && p.variants.length > 0 
                  ? p.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0)
                  : p.stock || 0;

                return (
                  <tr key={p._id} className="hover:bg-stone-50 transition">
                    <td className="p-3 font-semibold text-stone-900 uppercase">{p.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="text-stone-400">$</span>
                        <input 
                          type="number" 
                          value={p.priceRetail || 0} 
                          onChange={(e) => handlePriceChange(p._id, e.target.value)}
                          className="w-24 px-2 py-1 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none"
                        />
                        <button 
                          onClick={() => handleSavePrice(p)}
                          className="text-[9px] bg-stone-200 px-2 py-1 rounded-xs hover:bg-stone-300 text-stone-800 font-bold uppercase"
                        >
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-stone-800">
                      {p.variants && p.variants.length > 0 ? (
                        <div className="space-y-0.5 text-[10px]">
                          {p.variants.map((v, idx) => (
                            <div key={idx} className="flex gap-2 text-stone-600">
                              <span className="font-semibold">{v.size || 'Único'} - {v.color || 'Estándar'}:</span>
                              <span>{v.stock} un.</span>
                            </div>
                          ))}
                          <div className="font-bold text-stone-900 pt-1 border-t border-stone-100">Total: {totalStock} un.</div>
                        </div>
                      ) : (
                        <span className="font-medium">{totalStock} un.</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleDeleteProduct(p._id)}
                        className="text-rose-800 hover:text-rose-950 font-medium transition cursor-pointer"
                      >
                        Dar de Baja
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}