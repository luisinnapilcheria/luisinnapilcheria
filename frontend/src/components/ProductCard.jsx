import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import ProductDetailModal from './ProductDetailModal';

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
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProduct, setModalProduct] = useState(null);

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

  const handleOpenModal = (product) => {
    setModalProduct(product);
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
        <ProductDetailModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
        />
      )}

    </div>
  );
}