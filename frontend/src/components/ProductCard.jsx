import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);

  const totalStock = product.stockTotal !== undefined ? product.stockTotal : (product.stock || 0);
  const isOutOfStock = totalStock <= 0;
  const currentPrice = Number(product.priceRetail || product.price || 0);

  const availableVariants = (product.variants || []).filter((v) => v.stock > 0);
  const [selectedVariantId, setSelectedVariantId] = useState(
    availableVariants.length > 0 ? availableVariants[0]._id : ''
  );

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    if (product.variants && product.variants.length > 0 && !selectedVariantId) {
      alert('⚠️ Por favor elegí un talle y color antes de agregar al carrito.');
      return;
    }

    const selectedVariant = product.variants?.find((v) => v._id === selectedVariantId);

    const productToCart = {
      ...product,
      price: currentPrice,
      selectedVariant: selectedVariant ? {
        _id: selectedVariant._id,
        size: selectedVariant.size,
        color: selectedVariant.color
      } : null
    };

    addToCart(productToCart, 1);
    
    alert(`🛒 ¡Agregado al carrito!${selectedVariant ? ` (${selectedVariant.size} - ${selectedVariant.color})` : ''}`);
  };

  return (
    <div className="bg-white border border-stone-200 p-4 flex flex-col justify-between relative group hover:shadow-md transition duration-300 rounded-xs">
      
      {/* BADGES SUPERIORES */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 items-start">
        {isOutOfStock ? (
          <span className="bg-stone-900 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-xs">
            AGOTADO
          </span>
        ) : (
          <span className="bg-stone-100 text-stone-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border border-stone-200 rounded-xs">
            Stock: {totalStock} u.
          </span>
        )}
      </div>

      {/* CONTENEDOR DE FOTO */}
      <div className="w-full aspect-square bg-stone-50 mb-4 overflow-hidden relative rounded-xs">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 ease-out ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
        />
      </div>

      {/* DETALLES */}
      <div className="space-y-2 flex-grow flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold tracking-[0.2em] text-rose-800 uppercase block">
            {product.category || 'Indumentaria'}
          </span>
          <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mt-0.5 truncate" title={product.name}>
            {product.name}
          </h3>
          <p className="text-[11px] text-stone-500 font-light line-clamp-2 mt-1 leading-relaxed">
            {product.description || 'Sin descripción disponible.'}
          </p>
        </div>

        {/* SELECTOR DE VARIANTE (TALLES Y COLORES) */}
        {!isOutOfStock && product.variants && product.variants.length > 0 && (
          <div className="pt-2">
            <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1">
              Talle y Color:
            </label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full text-xs border border-stone-300 rounded px-2 py-1 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-800"
            >
              {product.variants.map((v) => (
                <option key={v._id} value={v._id} disabled={v.stock <= 0}>
                  {v.size} - {v.color} {v.stock <= 0 ? '(Agotado)' : `(${v.stock} u.)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* VALOR Y BOTÓN */}
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-medium uppercase text-stone-400">
              Precio:
            </span>
            <span className="text-sm font-bold text-stone-900">
              ${currentPrice.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition rounded-xs cursor-pointer ${
              isOutOfStock 
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {isOutOfStock ? 'Sin Stock' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>

    </div>
  );
}