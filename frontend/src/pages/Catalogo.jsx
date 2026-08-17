import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const getCleanApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://luisinnapilcheria-api.onrender.com/api';
  if ((url.match(/https?:\/\//g) || []).length > 1) {
    const parts = url.split(/(?=https?:\/\/)/);
    url = parts[parts.length - 1];
  }
  url = url.replace(/[\[\]\(\)'"]/g, '').trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) url += '/api';
  return url;
};

const API_URL = getCleanApiUrl();

const SafeImage = ({ src, alt, className = "", fit = "contain" }) => {
  const [error, setError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  if (error || !src) {
    return (
      <div className={`bg-rose-50/50 flex flex-col items-center justify-center text-stone-400 text-[10px] sm:text-xs select-none rounded-xs border border-rose-100 ${className}`}>
        <span className="text-2xl sm:text-3xl mb-1">👗</span>
        <span>Sin foto</span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden relative w-full h-full flex items-center justify-center bg-stone-50/30 ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        onLoad={(e) => {
          if (e.target.naturalHeight > e.target.naturalWidth) {
            setIsPortrait(true);
          }
        }}
        className={`w-full h-full ${
          isPortrait || fit === "contain" ? 'object-contain p-1' : 'object-cover'
        } object-center transition-transform duration-300 group-hover:scale-105`}
        loading="lazy"
      />
    </div>
  );
};

export default function Catalogo() {
  const { addToCart } = useContext(CartContext);
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProduct, setModalProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // EFECTO PARA TÍTULO DE PESTAÑA
  useEffect(() => {
    document.title = "Catálogo - Luisinna Pilcheria";
  }, []);

  // CARGAR PRODUCTOS Y ATENDER PARÁMETROS DE LA URL
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);

          const prodId = searchParams.get('producto');
          if (prodId) {
            const found = data.find((p) => p._id === prodId);
            if (found) {
              setModalProduct(found);
              if (found.variants && found.variants.length > 0) {
                setSelectedVariant(found.variants[0]);
              }
            }
          }

          const busquedaParam = searchParams.get('busqueda');
          if (busquedaParam) setSearchTerm(busquedaParam);

          const catParam = searchParams.get('categoria');
          if (catParam) setCategoryFilter(catParam);
        }
      } catch (error) {
        console.error("Error al cargar productos del catálogo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  // Al abrir modal, autoseleccionar primera variante si existe
  const handleOpenModal = (product) => {
    setModalProduct(product);
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const categories = [
    'Todas',
    ...Array.from(
      new Set(
        products
          .map((p) => p.category?.trim())
          .filter((cat) => Boolean(cat))
      )
    )
  ];

  const showToast = (name, qty) => {
    setToastMessage({ name, qty });
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleAddToCart = (product, variant, e) => {
    if (e) e.stopPropagation();
    const currentPrice = Number(product.priceRetail || product.price || 0);

    const availableStock = variant ? variant.stock : product.stock;

    if (availableStock < 1) {
      showToast(`⚠️ Sin stock disponible`, 0);
      return;
    }

    const productToCart = {
      ...product,
      price: currentPrice
    };

    addToCart(productToCart, 1, variant);
    showToast(product.name, 1);
  };

  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      categoryFilter === 'Todas' ||
      (item.category && item.category.toLowerCase() === categoryFilter.toLowerCase());

    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 font-sans relative">
      
      {/* TOAST DE NOTIFICACIÓN */}
      {toastMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/20 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
          <div className="bg-stone-900 text-white px-5 py-3 sm:px-6 sm:py-4 rounded-xs shadow-2xl border border-stone-700 flex items-center gap-3 max-w-xs w-full text-center justify-center pointer-events-auto">
            <span className="text-lg sm:text-xl">✨</span>
            <div>
              <p className="font-bold text-[11px] sm:text-xs text-rose-100 uppercase truncate">{toastMessage.name}</p>
              <p className="text-[10px] sm:text-[11px] text-stone-300">
                {toastMessage.qty > 0 ? `¡Agregado al carrito!` : 'Stock insuficiente'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-1.5">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-rose-800">
          Colección Exclusiva
        </span>
        <h1 className="text-xl sm:text-3xl font-light text-stone-900 uppercase tracking-wide">
          Catálogo de Indumentaria
        </h1>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between mb-6 sm:mb-8 bg-white p-3.5 rounded-xs border border-rose-200/80 shadow-2xs">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Buscar por prenda, tela o diseño..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-rose-200 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-stone-400">🔍</span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xs text-[11px] font-medium uppercase tracking-wider transition ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? 'bg-stone-900 text-white' 
                  : 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      {loading ? (
        <div className="text-center py-20 text-stone-400 text-xs italic space-y-2 uppercase tracking-widest">
          <span className="text-2xl block animate-spin">✨</span>
          <p>Estoy revisando el stock, esperame un segundito ...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xs border border-rose-200 shadow-2xs">
          <span className="text-4xl">👗</span>
          <p className="text-xs text-stone-500 mt-2 uppercase tracking-wider">No encontramos prendas que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((item) => {
            const price = item.priceRetail || item.price || 0;
            const inStock = item.variants && item.variants.length > 0
              ? item.variants.some((v) => v.stock > 0)
              : item.stock > 0;

            return (
              <div
                key={item._id}
                onClick={() => handleOpenModal(item)}
                className="bg-white rounded-xs border border-rose-100 shadow-2xs hover:border-rose-300 transition duration-300 flex flex-col overflow-hidden group cursor-pointer"
              >
                <div className="relative h-64 sm:h-72 w-full bg-stone-50/50 p-2 border-b border-stone-100 overflow-hidden flex items-center justify-center">
                  <SafeImage src={item.image} alt={item.name} fit="contain" />
                  
                  {item.destacado && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-xs uppercase tracking-wider z-10">
                      Destacado
                    </span>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-rose-800 tracking-wider block">
                      {item.category || 'Indumentaria'}
                    </span>
                    <h3 className="font-medium text-[11px] sm:text-xs text-stone-800 uppercase truncate mt-0.5" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-stone-500 line-clamp-2 mt-1 leading-snug font-light">
                      {item.description || 'Sin descripción disponible.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-rose-50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-stone-900">
                        ${Number(price).toLocaleString('es-AR')}
                      </p>
                      <span className={`text-[8px] font-bold uppercase ${inStock ? 'text-emerald-700' : 'text-rose-500'}`}>
                        {inStock ? 'Disponible' : 'Sin Stock'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(item);
                      }}
                      className="w-full py-2 text-[9px] font-medium uppercase tracking-[0.15em] transition bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
                    >
                      Ver Opciones / Elegir Talle
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALLE DE PRENDA */}
      {modalProduct && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setModalProduct(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-xs shadow-2xl overflow-hidden border border-rose-200 relative animate-in fade-in duration-200 my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            <button
              onClick={() => setModalProduct(null)}
              className="absolute top-3 right-3 z-30 bg-stone-900 hover:bg-stone-800 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg font-bold text-xs transition cursor-pointer"
              title="Cerrar"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
              
              <div className="md:col-span-6 bg-stone-50 p-4 flex items-center justify-center h-80 sm:h-[450px]">
                <SafeImage
                  src={modalProduct.detailImage || modalProduct.image}
                  alt={modalProduct.name}
                  fit="contain"
                  className="w-full h-full"
                />
              </div>

              <div className="md:col-span-6 p-6 flex flex-col justify-between space-y-6 bg-white border-t md:border-t-0 md:border-l border-rose-100">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold tracking-[0.25em] text-rose-800 uppercase">
                    {modalProduct.category || 'Indumentaria Femenina'}
                  </span>
                  <h2 className="text-lg sm:text-2xl font-light text-stone-900 uppercase tracking-wide">
                    {modalProduct.name}
                  </h2>
                  <div className="w-10 h-0.5 bg-rose-300 rounded-full my-2"></div>
                  <p className="text-xs text-stone-600 leading-relaxed max-h-36 overflow-y-auto pr-1 font-light">
                    {modalProduct.description || 'Sin descripción detallada disponible para esta prenda.'}
                  </p>

                  {/* SELECCIÓN DE TALLES Y COLORES */}
                  {modalProduct.variants && modalProduct.variants.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <label className="text-[10px] font-bold uppercase text-stone-700 tracking-wider block">
                        Elegí Talle y Color:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {modalProduct.variants.map((v, idx) => (
                          <button
                            key={v._id || idx}
                            onClick={() => setSelectedVariant(v)}
                            className={`px-2.5 py-1.5 text-[11px] rounded-xs border transition cursor-pointer ${
                              selectedVariant && (selectedVariant._id === v._id || (selectedVariant.size === v.size && selectedVariant.color === v.color))
                                ? 'bg-stone-900 text-white border-stone-900 font-bold'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {v.size} - {v.color} ({v.stock > 0 ? `Stock: ${v.stock}` : 'Agotado'})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-rose-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold block">Precio</span>
                      <span className="text-xl sm:text-2xl font-semibold text-stone-900">
                        ${Number(modalProduct.priceRetail || modalProduct.price || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-xs uppercase tracking-wider ${
                      (selectedVariant ? selectedVariant.stock : modalProduct.stock) > 0 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {(selectedVariant ? selectedVariant.stock : modalProduct.stock) > 0 ? `Stock: ${selectedVariant ? selectedVariant.stock : modalProduct.stock}` : 'Agotado'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(modalProduct, selectedVariant);
                      setModalProduct(null);
                    }}
                    disabled={(selectedVariant ? selectedVariant.stock : modalProduct.stock) <= 0}
                    className={`w-full py-3 text-xs font-semibold uppercase tracking-[0.2em] transition shadow-xs cursor-pointer ${
                      (selectedVariant ? selectedVariant.stock : modalProduct.stock) > 0
                        ? 'bg-stone-900 hover:bg-stone-800 text-white'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    {(selectedVariant ? selectedVariant.stock : modalProduct.stock) > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}