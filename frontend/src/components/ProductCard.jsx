import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useContext(CartContext);

  const variants = product?.variants || [];

  // 1. Iniciar con la primera variante disponible (si existe)
  const [selectedVariant, setSelectedVariant] = useState(() => {
    return variants.length > 0 ? variants[0] : null;
  });

  // 2. DETERMINACIÓN DINÁMICA DE LA IMAGEN:
  // Si la variante seleccionada tiene imagen propia (selectedVariant.image), usa esa.
  // Si no, recurre a la imagen principal del producto (product.image).
  const activeImage = 
    selectedVariant?.image?.trim() || 
    product?.image?.trim() || 
    '';

  const currentPrice = Number(product?.priceRetail || product?.price || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);

  const handleAddToCart = () => {
    if (currentStock <= 0) return;

    const itemToAdd = {
      ...product,
      image: activeImage, // Enviamos al carrito la foto de la variante elegida
      price: currentPrice,
      selectedVariant: selectedVariant
        ? {
            _id: selectedVariant._id,
            size: selectedVariant.size,
            color: selectedVariant.color,
            image: activeImage
          }
        : null
    };

    addToCart(itemToAdd, 1);
    alert(`🛒 ¡Agregado al carrito! (${selectedVariant?.size || ''} - ${selectedVariant?.color || ''})`);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-3xl w-full rounded-md shadow-2xl overflow-hidden relative flex flex-col md:flex-row">
        
        {/* BOTÓN CERRAR */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition"
          >
            ✕
          </button>
        )}

        {/* CONTENEDOR DE LA IMAGEN DUAL/DINÁMICA */}
        <div className="w-full md:w-1/2 aspect-square bg-stone-100 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-stone-200">
          {activeImage ? (
            <img
              src={activeImage}
              alt={`${product.name} - ${selectedVariant?.color || ''}`}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
          ) : (
            <div className="text-stone-400 text-xs flex flex-col items-center">
              <span className="text-3xl">👗</span>
              <span>Sin foto disponible</span>
            </div>
          )}
        </div>

        {/* INFORMACIÓN DEL PRODUCTO */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-rose-800 uppercase block">
              {product.category || 'Indumentaria'}
            </span>
            <h2 className="text-xl font-bold text-stone-800 uppercase tracking-wide mt-1">
              {product.name}
            </h2>
            <p className="text-xs text-stone-500 font-light mt-2 leading-relaxed">
              {product.description || 'Sin descripción disponible.'}
            </p>
          </div>

          {/* LISTA DE VARIANTES (TALLE Y COLOR) */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                Elegí Talle y Color:
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, idx) => {
                  const isSelected = selectedVariant && (
                    (v._id && v._id === selectedVariant._id) ||
                    (v.size === selectedVariant.size && v.color === selectedVariant.color)
                  );

                  return (
                    <button
                      key={v._id || idx}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-2 text-xs font-semibold rounded border transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-800'
                      }`}
                    >
                      <span>
                        {v.size ? `${v.size} - ` : ''}{v.color || 'Estándar'} (Stock: {v.stock})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PRECIO Y BOTÓN DE COMPRA */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-400 block uppercase">Precio</span>
                <span className="text-xl font-extrabold text-stone-900">
                  ${currentPrice.toLocaleString('es-AR')}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${
                currentStock > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {currentStock > 0 ? `STOCK: ${currentStock}` : 'AGOTADO'}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={currentStock <= 0}
              className={`w-full py-3 text-xs font-bold uppercase tracking-widest rounded transition cursor-pointer ${
                currentStock <= 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xs'
              }`}
            >
              {currentStock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}