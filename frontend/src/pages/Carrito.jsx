import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const WHATSAPP_NUMBER = '5493482202857';

const reviewModules = import.meta.glob('../assets/reseñas/*.{png,jpg,jpeg,webp,PNG,JPG,WEBP}', {
  eager: true,
  import: 'default'
});
const reviewImages = Object.values(reviewModules);

const getCleanApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://luisinnaindumentaria-api.onrender.com/api';
  if ((url.match(/https?:\/\//g) || []).length > 1) {
    const parts = url.split(/(?=https?:\/\/)/);
    url = parts[parts.length - 1];
  }
  return url.replace(/[\[\]\(\)'"]/g, '').trim().replace(/\/+$/, '').concat(url.endsWith('/api') ? '' : '/api');
};

const API_URL = getCleanApiUrl();

export default function Carrito() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useContext(CartContext);

  const navigate = useNavigate();

  const [step, setStep] = useState('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showReviews, setShowReviews] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dni: '',
    taxType: 'Consumidor Final',
    address: '',
    city: '',
    notes: ''
  });

  useEffect(() => {
    document.title = "Carrito - Luisinna Indumentaria";
  }, []);

  useEffect(() => {
    if (reviewImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviewImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextReview = () => {
    if (reviewImages.length > 0) {
      setCurrentReviewIndex((prev) => (prev + 1) % reviewImages.length);
    }
  };

  const handlePrevReview = () => {
    if (reviewImages.length > 0) {
      setCurrentReviewIndex((prev) => (prev - 1 + reviewImages.length) % reviewImages.length);
    }
  };

  const getItemUnitPrice = (item) => {
    const qty = Number(item.qty || 1);
    const wholesalePrice = Number(item.priceWholesale || 0);
    const retailPrice = Number(item.priceRetail || item.price || 0);
    const minQty = Number(item.minWholesaleQty) > 0 ? Number(item.minWholesaleQty) : 1;

    if (wholesalePrice > 0 && qty >= minQty) {
      return wholesalePrice;
    }
    return retailPrice;
  };

  // Cálculo directo del subtotal y total final sin descuentos automáticos
  const computedSubtotal = cartItems.reduce((acc, item) => {
    return acc + (getItemUnitPrice(item) * item.qty);
  }, 0);

  const computedTotal = computedSubtotal;

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const orderPayload = {
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dni: formData.dni,
        taxType: formData.taxType,
        city: formData.city,
        address: formData.address,
        notes: formData.notes
      },
      items: cartItems.map((item) => {
        const unitPrice = getItemUnitPrice(item);
        return {
          product: item._id,
          _id: item._id,
          name: item.name,
          qty: Number(item.qty),
          price: unitPrice
        };
      }),
      subtotal: computedSubtotal,
      discount: 0,
      total: computedTotal,
      status: 'pendiente_pago'
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error devuelto por la API:", response.status, errorText);
      } else {
        const dataCreated = await response.json();
        console.log("✅ Pedido guardado en BD con éxito:", dataCreated);
      }
    } catch (error) {
      console.error("❌ Error de red/conexión al guardar el pedido:", error);
    } finally {
      let message = `*✨ NUEVO PEDIDO - LUISINNA INDUMENTARIA ✨*\n\n`;
      message += `*👤 Cliente:* ${formData.fullName}\n`;
      message += `*📱 Teléfono:* ${formData.phone}\n`;
      message += `*📧 Email:* ${formData.email}\n`;
      message += `*📄 DNI/CUIT:* ${formData.dni} (${formData.taxType})\n`;
      message += `*🏙️ Localidad:* ${formData.city}\n`;
      message += `*📍 Dirección:* ${formData.address}\n`;
      if (formData.notes) message += `*📝 Notas:* ${formData.notes}\n`;
      
      message += `\n*🛍️ DETALLE DE PRENDAS:*\n`;
      cartItems.forEach((item) => {
        const unitPrice = getItemUnitPrice(item);
        const itemTotal = unitPrice * item.qty;
        const minQty = Number(item.minWholesaleQty) > 0 ? Number(item.minWholesaleQty) : 1;
        const isWholesale = Number(item.priceWholesale) > 0 && item.qty >= minQty;
        
        message += `• ${item.name} x${item.qty} - $${itemTotal.toLocaleString('es-AR')}${isWholesale ? ' *(Precio Mayorista)*' : ''}\n`;
      });

      message += `\n*💰 TOTAL ESTIMADO:* $${computedTotal.toLocaleString('es-AR')}\n\n`;
      message += `_¡Hola! Quisiera coordinar el pago, confirmar el total y coordinar el envío. ¡Muchas gracias!_`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      clearCart();
      setIsProcessing(false);
      window.open(whatsappUrl, '_blank');
      navigate('/');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rose-100 mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-light uppercase tracking-wide text-stone-900 flex items-center gap-2">
            <span>🛍️</span> {step === 'cart' ? 'Tu Carrito de Compras' : 'Finalizar Pedido'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {step === 'cart' ? 'Revisá tus prendas antes de confirmar el pedido' : 'Ingresá tus datos para coordinar el envío'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {step === 'checkout' && (
            <button
              onClick={() => setStep('cart')}
              className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xs transition flex items-center gap-1 cursor-pointer"
            >
              ← Volver al Carrito
            </button>
          )}
          <button
            onClick={() => navigate('/catalogo')}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition flex items-center gap-1 cursor-pointer"
          >
            Ver más prendas
          </button>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xs border border-rose-200 shadow-2xs space-y-4">
          <span className="text-5xl">👗</span>
          <h3 className="text-base font-semibold text-stone-800 uppercase tracking-wide">El carrito está vacío</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto font-light">
            Explorá nuestro catálogo y elegí tus prendas favoritas de Luisinna Indumentaria.
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            className="inline-block bg-stone-900 text-white text-xs font-medium uppercase tracking-widest px-6 py-3 rounded-xs hover:bg-stone-800 transition cursor-pointer"
          >
            Ver Catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            
            {step === 'cart' ? (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const unitPrice = getItemUnitPrice(item);
                  const minQty = Number(item.minWholesaleQty) > 0 ? Number(item.minWholesaleQty) : 1;
                  const isWholesale = Number(item.priceWholesale) > 0 && item.qty >= minQty;

                  return (
                    <div
                      key={item._id}
                      className="bg-white p-4 rounded-xs border border-rose-100 shadow-2xs flex gap-4 items-center"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover bg-stone-50 rounded-xs border border-stone-100 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-medium text-xs text-stone-800 uppercase truncate">{item.name}</h4>
                          {isWholesale && (
                            <span className="bg-stone-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                              🔥 Precio Mayorista
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5 font-light">
                          ${unitPrice.toLocaleString('es-AR')} c/u
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-stone-300 rounded-xs overflow-hidden bg-stone-50">
                            <button
                              onClick={() => updateQuantity(item._id, -1)}
                              className="px-2.5 py-0.5 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 text-xs font-bold text-stone-800">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, 1)}
                              className="px-2.5 py-0.5 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-[11px] text-rose-800 hover:text-rose-950 transition font-medium cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-stone-900">
                          ${(unitPrice * item.qty).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-stone-500 hover:text-rose-800 transition cursor-pointer"
                  >
                    🗑️ Vaciar todo el carrito
                  </button>
                </div>
              </div>
            ) : (
              <form id="checkout-form" onSubmit={handlePaymentSubmit} className="bg-white p-6 rounded-xs border border-rose-200 shadow-2xs space-y-4 text-xs">
                <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-stone-800 text-sm uppercase tracking-wide flex items-center gap-2">
                    📋 Datos de Facturación y Envío
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-xs">
                    Directo a WhatsApp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-stone-700 mb-1">Nombre y Apellido Completo *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Ej: María Laura Giménez"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="ejemplo@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="Ej: 3482202857"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">DNI / CUIT *</label>
                    <input
                      type="text"
                      name="dni"
                      required
                      placeholder="12345678"
                      value={formData.dni}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Condición Fiscal *</label>
                    <select
                      name="taxType"
                      value={formData.taxType}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    >
                      <option value="Consumidor Final">Consumidor Final</option>
                      <option value="Monotributo">Monotributo</option>
                      <option value="Responsable Inscripto">Responsable Inscripto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Localidad / Ciudad *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="Ej: Reconquista, Avellaneda..."
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Dirección *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="Calle 12 N° 345"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-stone-700 mb-1">Aclaraciones o Notas para el pedido</label>
                    <textarea
                      name="notes"
                      rows="2"
                      placeholder="Talles de preferencia, aclaraciones de envío, etc."
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* RESEÑAS DE CLIENTAS */}
            <div className="bg-stone-900 text-white rounded-xs shadow-2xs border border-stone-800 overflow-hidden text-xs">
              <div 
                onClick={() => setShowReviews(!showReviews)}
                className="flex justify-between items-center p-3 cursor-pointer select-none hover:bg-stone-800 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-rose-300 text-xs">⭐ Reseñas</span>
                  <span className="font-light text-stone-200 text-[11px] uppercase tracking-wider">Opiniones de Clientas</span>
                </div>
                <button type="button" className="text-stone-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                  {showReviews ? 'Ocultar ▲' : 'Ver Reseñas ▼'}
                </button>
              </div>

              {showReviews && (
                <div className="p-3 border-t border-stone-800 bg-stone-950/40 space-y-2">
                  {reviewImages.length > 0 ? (
                    <div className="relative group flex items-center justify-center bg-black/40 rounded-xs p-1.5 border border-stone-800">
                      <img
                        src={reviewImages[currentReviewIndex]}
                        alt={`Reseña ${currentReviewIndex + 1}`}
                        className="max-h-36 sm:max-h-48 object-contain rounded-xs transition-all duration-300"
                      />

                      {reviewImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevReview}
                            className="absolute left-1 bg-stone-900/80 hover:bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-xs transition cursor-pointer"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={handleNextReview}
                            className="absolute right-1 bg-stone-900/80 hover:bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-xs transition cursor-pointer"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 text-center text-[11px] text-stone-400 italic">
                      💬 "Hermosa calidad de tela y calce perfecto."
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-1 pt-0.5">
                    {reviewImages.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1 rounded-full transition-all ${
                          idx === currentReviewIndex ? 'w-3 bg-rose-400' : 'w-1 bg-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RESUMEN DE COMPRA */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-xs border border-rose-200 shadow-2xs sticky top-6 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-800 border-b border-rose-100 pb-3 flex items-center justify-between">
                <span>Resumen de Compra</span>
                <span className="text-[10px] text-stone-400 font-normal">({cartItems.length} prendas)</span>
              </h3>

              <div className="space-y-2.5 text-xs text-stone-600">
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-1">
                  <span>Total Estimado:</span>
                  <span className="text-base text-stone-900">${computedTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-3 text-xs uppercase tracking-[0.2em] rounded-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Cargar Datos de Envío</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className={`w-full py-3.5 text-white font-semibold text-xs uppercase tracking-[0.2em] rounded-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    isProcessing
                      ? 'bg-stone-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Registrando Pedido...</span>
                    </>
                  ) : (
                    <>
                      <span>📱 Enviar Pedido por WhatsApp</span>
                    </>
                  )}
                </button>
              )}

              <div className="pt-2 border-t border-rose-100 space-y-2 text-center">
                <div className="flex items-center justify-center gap-3 text-stone-400 text-lg">
                  <span title="WhatsApp Directo">📱</span>
                  <span title="Múltiples Formas de Pago">💳</span>
                  <span title="Atención Personalizada">🛍️</span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">
                  Al hacer clic se enviará el pedido directamente al WhatsApp de Luisinna Indumentaria.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}