import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useContext(CartContext);

  const availableVariants = (product.variants || []).filter((v) => v.stock > 0);

  // Inicializar seleccionando la primera variante activa
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    if (availableVariants.length > 0) return availableVariants[0]._id || '0';
    if (product.variants && product.variants.length > 0) return product.variants[0]._id || '0';
    return '';
  });

  // Buscar la variante elegida por _id
  const selectedVariant = product.variants?.find(
    (v, idx) => (v._id ? v._id === selectedVariantId : String(idx) === String(selectedVariantId))
  ) || product.variants?.[0];

  // Determinar la imagen a mostrar con prioridad en la variante elegida
  const currentDisplayImage =
    selectedVariant?.image?.trim() ||
    product.detailImage?.trim() ||
    product.image?.trim() ||
    '';

  const totalStock = selectedVariant ? selectedVariant.stock : product.stock || 0;
  const currentPrice = Number(product.priceRetail || product.price || 0);

  const handleAddToCart = () => {
    if (totalStock <= 0) return;

    const itemToAdd = {
      ...product,
      image: currentDisplayImage,
      price: currentPrice,
      selectedVariant: selectedVariant
        ? {
            _id: selectedVariant._id,
            size: selectedVariant.size,
            color: selectedVariant.color,
            image: currentDisplayImage
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
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition"
        >
          ✕
        </button>

        {/* CONTENEDOR DE LA IMAGEN (Se actualiza con currentDisplayImage) */}
        <div className="w-full md:w-1/2 aspect-square bg-stone-100 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-stone-200">
          {currentDisplayImage ? (
            <img
              src={currentDisplayImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
          ) : (
            <div className="text-stone-400 text-xs flex flex-col items-center">
              <span className="text-3xl">👗</span>
              <span>Sin imagen</span>
            </div>
          )}
        </div>

        {/* DETALLES Y BOTONES DE VARIANTES */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-rose-800 uppercase block">
              {product.category || 'Indumentaria'}
            </span>
            <h2 className="text-xl font-bold text-stone-800 uppercase tracking-wide mt-1">
              {product.name}
            </h2>
            <p className="text-xs text-stone-500 font-light mt-2 leading-relaxed">
              {product.description || 'Sin descripción detallada disponible para esta prenda.'}
            </p>
          </div>

          {/* BOTONES DE TALLE Y COLOR */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                Elegí Talle y Color:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, idx) => {
                  const varId = v._id || String(idx);
                  const isSelected = selectedVariantId === varId;
                  const isOutOfStock = v.stock <= 0;

                  return (
                    <button
                      key={varId}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariantId(varId)}
                      className={`px-3 py-2 text-xs font-semibold rounded border transition cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : isOutOfStock
                          ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed line-through'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-800'
                      }`}
                    >
                      {v.size ? `${v.size} - ` : ''}{v.color || 'Estándar'} (Stock: {v.stock})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PRECIO Y ACCIÓN */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-400 block uppercase">Precio</span>
                <span className="text-xl font-extrabold text-stone-900">
                  ${currentPrice.toLocaleString('es-AR')}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${
                totalStock > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {totalStock > 0 ? `STOCK: ${totalStock}` : 'AGOTADO'}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={totalStock <= 0}
              className={`w-full py-3 text-xs font-bold uppercase tracking-widest rounded transition cursor-pointer ${
                totalStock <= 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm'
              }`}
            >
              {totalStock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}