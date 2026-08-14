import React, { useState } from 'react';

export default function Logistica() {
  // Estado local para simular la lista de prendas
  const [products, setProducts] = useState([
    { 
      _id: '1', 
      name: 'Jean Wide Leg Denim', 
      priceRetail: 28000, 
      stock: 12 
    },
    { 
      _id: '2', 
      name: 'Remera Oversize Algodón', 
      priceRetail: 12500, 
      stock: 24 
    }
  ]);

  // Estado para el formulario de alta de prenda
  const [newProduct, setNewProduct] = useState({
    name: '',
    priceRetail: '',
    category: '',
    stock: ''
  });

  const handlePriceChange = (id, value) => {
    setProducts(products.map(p => 
      p._id === id ? { ...p, priceRetail: Number(value) } : p
    ));
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.priceRetail) return;

    const itemToAdd = {
      _id: Date.now().toString(),
      name: newProduct.name,
      priceRetail: Number(newProduct.priceRetail),
      stock: Number(newProduct.stock || 0)
    };

    setProducts([...products, itemToAdd]);
    setNewProduct({
      name: '',
      priceRetail: '',
      category: '',
      stock: ''
    });
  };

  const handleDeleteProduct = (id) => {
    if (confirm('¿Seguro que querés dar de baja esta prenda?')) {
      setProducts(products.filter(p => p._id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-light uppercase tracking-wide text-stone-900">
          Panel de Logística e Indumentaria
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Gestión de stock, precios y altas de prendas para Luisinna Indumentaria.
        </p>
      </div>
      
      {/* Formulario rápido de Alta */}
      <div className="bg-white p-6 rounded-xs shadow-2xs border border-rose-100 mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800 mb-4 flex items-center gap-2">
          <span>👗</span> Agregar Nueva Prenda
        </h3>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <input 
            type="text" 
            name="name"
            value={newProduct.name}
            onChange={handleNewProductChange}
            placeholder="Nombre de la prenda *" 
            required
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900 sm:col-span-2" 
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
            type="number" 
            name="stock"
            value={newProduct.stock}
            onChange={handleNewProductChange}
            placeholder="Stock Inicial" 
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900" 
          />
          <button 
            type="submit"
            className="bg-stone-900 text-white font-medium uppercase tracking-widest py-2 rounded-xs hover:bg-stone-800 transition cursor-pointer sm:col-span-2 md:col-span-4"
          >
            Dar de Alta
          </button>
        </form>
      </div>

      {/* Tabla de Modificaciones */}
      <div className="bg-white rounded-xs shadow-2xs overflow-x-auto border border-rose-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-900 text-white font-light uppercase tracking-wider text-[11px] border-b border-stone-800">
              <th className="p-3">Prenda</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {products.map(p => (
              <tr key={p._id} className="hover:bg-stone-50 transition">
                <td className="p-3 font-semibold text-stone-900 uppercase">{p.name}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="text-stone-400">$</span>
                    <input 
                      type="number" 
                      value={p.priceRetail} 
                      onChange={(e) => handlePriceChange(p._id, e.target.value)}
                      className="w-28 px-2 py-1 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </td>
                <td className="p-3 font-medium text-stone-800">
                  {p.stock} un.
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}