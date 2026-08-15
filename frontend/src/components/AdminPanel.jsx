import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

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

const SafeImage = ({ src, alt, className = "" }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`bg-rose-50/50 flex flex-col items-center justify-center text-stone-400 text-[10px] select-none rounded border border-rose-100 ${className}`}>
        <span>👗</span>
        <span>Sin foto</span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-stone-100 rounded border border-stone-200/80 flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className="w-full h-full object-cover object-center transition-transform hover:scale-105 duration-300"
        loading="lazy"
      />
    </div>
  );
};

export default function AdminPanel() {
  const authContext = useContext(AuthContext);

  // Estados de Autenticación Local
  const [token, setToken] = useState(() => {
    if (authContext?.token) return authContext.token;
    try {
      const rawUserInfo = localStorage.getItem('userInfo');
      if (rawUserInfo) {
        const parsedUser = JSON.parse(rawUserInfo);
        if (parsedUser.token) return parsedUser.token;
      }
    } catch (e) {
      console.error("Error al leer userInfo:", e);
    }
    return localStorage.getItem('token') || localStorage.getItem('userToken') || null;
  });

  const [loginEmail, setLoginEmail] = useState('luisinnapilcheria@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navegación de Pestañas ('products' | 'orders')
  const [activeTab, setActiveTab] = useState('products');

  // Estados de Productos
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState('file');
  const [detailImageMode, setDetailImageMode] = useState('file');

  // Estados de Pedidos
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Remeras',
    description: '',
    priceRetail: '',
    stock: '',
    image: '',
    detailImage: '',
    destacado: false
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data));
        if (authContext?.login) authContext.login(data);
      } else {
        setLoginError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Cargar Productos
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error al cargar productos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar Pedidos (Con cabecera Authorization)
  const loadOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 401 || res.status === 403) {
        setToken(null);
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    if (token) {
      loadOrders();
    }
  }, [token]);

  // Cambiar estado de un pedido
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await loadOrders();
        await loadProducts();
      } else {
        alert("No se pudo actualizar el estado de la orden.");
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      alert("Error de conexión al cambiar el estado.");
    }
  };

  // Copiar etiqueta de envío
  const copyShippingData = (order) => {
    const c = order.customer || {};
    const text = `📦 DATOS DE ENVÍO - LUISINNA PILCHERIA\n----------------------------------\n👤 Destinatario: ${c.fullName}\n📱 WhatsApp: ${c.phone}\n📄 DNI/CUIT: ${c.dni} (${c.taxType})\n🏙️ Localidad: ${c.city || 'No especificada'}\n📍 Dirección: ${c.address}\n📝 Notas: ${c.notes || 'Sin observaciones'}\n💰 Total Pedido: $${order.total?.toLocaleString('es-AR')}`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(order._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e, fieldName = 'image') => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Por favor seleccioná un archivo de menos de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || '',
      category: product.category || 'Remeras',
      description: product.description || '',
      priceRetail: product.priceRetail || product.price || '',
      stock: product.stock ?? '',
      image: product.image || '',
      detailImage: product.detailImage || '',
      destacado: product.destacado || false
    });

    setImageMode(product.image?.startsWith('http') ? 'url' : 'file');
    setDetailImageMode(product.detailImage?.startsWith('http') ? 'url' : 'file');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Remeras',
      description: '',
      priceRetail: '',
      stock: '',
      image: '',
      detailImage: '',
      destacado: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEditing = Boolean(editingId);
    const url = isEditing ? `${API_URL}/products/${editingId}` : `${API_URL}/products`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, {
        method: method,
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        handleCancelEdit();
        await loadProducts();
      } else {
        alert('Hubo un error al guardar el producto. Verificá tus permisos o credenciales.');
      }
    } catch (error) {
      console.error("Error:", error);
      alert('Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar este producto?')) return;

    if (!token) {
      alert("⚠️ No estás logueado o tu sesión expiró. Volvé a iniciar sesión.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        loadProducts();
      } else if (res.status === 401 || res.status === 403) {
        alert('❌ No tenés autorización para eliminar. Volvé a iniciar sesión.');
        setToken(null);
      } else {
        alert('No se pudo eliminar el producto.');
      }
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const priority = {
      'pendiente_pago': 1,
      'pagado': 2,
      'despachado': 3,
      'cancelado': 4
    };

    const pA = priority[a.status] || 99;
    const pB = priority[b.status] || 99;

    if (pA !== pB) return pA - pB;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pendingCount = orders.filter(o => o.status === 'pendiente_pago').length;

  // SI NO HAY TOKEN, SE MUESTRA EL FORMULARIO DE ACCESO AL PANEL
  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full space-y-4 text-xs">
          <div className="text-center space-y-1">
            <span className="text-3xl">🔐</span>
            <h2 className="text-base font-bold text-stone-900 uppercase tracking-wider">Acceso al Panel de Control</h2>
            <p className="text-stone-500">Ingresá tus datos de administradora para continuar.</p>
          </div>

          {loginError && (
            <div className="bg-rose-100 text-rose-800 p-2.5 rounded-lg text-center font-semibold border border-rose-300">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-700">Correo Electrónico</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-700">Contraseña</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-lg font-bold uppercase tracking-wider transition shadow-xs cursor-pointer mt-2"
            >
              {isLoggingIn ? 'Verificando...' : 'Ingresar al Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      
      {/* 🧭 NAVEGACIÓN DE PESTAÑAS Y HEADER DEL PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-rose-100 pb-3 gap-4">
        <div className="flex border-b sm:border-b-0 border-stone-200 gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
              activeTab === 'products'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            📦 Manejo de Stock ({products.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('orders');
              loadOrders();
            }}
            className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <span>🛍️ Control de Pedidos</span>
            {pendingCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'orders' && pendingCount > 0 && (
            <span className="text-xs bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
              ⚠️ Tenés {pendingCount} pedido(s) pendiente(s)
            </span>
          )}

          <button
            onClick={() => {
              setToken(null);
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
            }}
            className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ================= PESTAÑA 1: INVENTARIO DE PRODUCTOS ================= */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          {/* FORMULARIO DE CREACIÓN / EDICIÓN */}
          <div className={`p-6 rounded-xl shadow-xs border transition-colors ${
            editingId ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-rose-100'
          }`}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">{editingId ? '✏️' : '➕'}</span>
                <h2 className="text-base font-bold text-stone-800">
                  {editingId ? 'Editar Prenda' : 'Cargar Nueva Prenda'}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                >
                  ❌ Cancelar Edición
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-700">Nombre de la prenda *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej: Vestido Lino Florencia"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700">Categoría *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                >
                  <option value="Remeras">Remeras</option>
                  <option value="Vestidos">Vestidos</option>
                  <option value="Pantalones">Pantalones</option>
                  <option value="Sweaters">Sweaters</option>
                  <option value="Polleras">Polleras</option>
                  <option value="Camperas">Camperas</option>
                  <option value="Camperas">Jeans</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1 text-stone-700">Descripción detallada</label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Describí telas, talles disponibles, corte..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700">Precio ($) *</label>
                <input
                  type="number"
                  name="priceRetail"
                  required
                  min="0"
                  placeholder="0.00"
                  value={formData.priceRetail}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700">Stock Disponible *</label>
                <input
                  type="number"
                  name="stock"
                  required
                  min="0"
                  placeholder="10"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              {/* IMAGEN MINIATURA */}
              <div className="md:col-span-2 bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
                <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                  <label className="block font-bold text-stone-800 text-xs">
                    📸 Imagen Principal (Catálogo y Home) *
                  </label>
                  
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageMode('file')}
                      className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                        imageMode === 'file'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      📁 Archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                        imageMode === 'url'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      🌐 URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <div className="sm:col-span-3">
                    {imageMode === 'file' ? (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'image')}
                          className="w-full text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-200 file:text-stone-800 hover:file:bg-stone-300 cursor-pointer"
                        />
                        <p className="text-[10px] text-stone-400 mt-1">Soporta JPG, PNG, WEBP.</p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          name="image"
                          placeholder="https://ejemplo.com/foto-prenda.jpg"
                          value={formData.image}
                          onChange={handleChange}
                          className="w-full p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-stone-500 mb-1">Vista Previa</span>
                    <SafeImage
                      src={formData.image}
                      alt="Miniatura"
                      className="w-16 h-16 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* FOTO DETALLE */}
              <div className="md:col-span-2 bg-rose-50/30 p-4 rounded-lg border border-rose-200 space-y-3">
                <div className="flex justify-between items-center border-b border-rose-200 pb-2">
                  <label className="block font-bold text-rose-900 text-xs">
                    🔍 Foto Ampliada (Para el Pop-up / Opcional)
                  </label>
                  
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDetailImageMode('file')}
                      className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                        detailImageMode === 'file'
                          ? 'bg-rose-800 text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      📁 Archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailImageMode('url')}
                      className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                        detailImageMode === 'url'
                          ? 'bg-rose-800 text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      🌐 URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <div className="sm:col-span-3">
                    {detailImageMode === 'file' ? (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'detailImage')}
                          className="w-full text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-200 file:text-rose-900 hover:file:bg-rose-300 cursor-pointer"
                        />
                        <p className="text-[10px] text-rose-700 mt-1">Si la dejás vacía, se usará automáticamente la foto principal.</p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          name="detailImage"
                          placeholder="https://ejemplo.com/foto-hd.jpg"
                          value={formData.detailImage}
                          onChange={handleChange}
                          className="w-full p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-rose-800 mb-1">Vista Previa HD</span>
                    <SafeImage
                      src={formData.detailImage}
                      alt="Detalle"
                      className="w-16 h-16 shadow-xs border-rose-300"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="destacado"
                  name="destacado"
                  checked={formData.destacado}
                  onChange={handleChange}
                  className="w-4 h-4 text-stone-900 rounded cursor-pointer"
                />
                <label htmlFor="destacado" className="font-semibold text-stone-700 cursor-pointer">
                  ¿Mostrar en "Destacados" del Home?
                </label>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 text-white font-bold rounded-lg uppercase tracking-wider text-xs transition shadow-xs cursor-pointer ${
                    isSubmitting
                      ? 'bg-stone-400 cursor-not-allowed'
                      : editingId
                      ? 'bg-rose-800 hover:bg-rose-900'
                      : 'bg-stone-900 hover:bg-stone-800'
                  }`}
                >
                  {isSubmitting ? 'Guardando...' : editingId ? '💾 Guardar Cambios' : '➕ Crear Prenda'}
                </button>
              </div>
            </form>
          </div>

          {/* TABLA DE INVENTARIO DE PRODUCTOS */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-rose-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <span>📦</span> Inventario Actual ({products.length})
              </h2>
              {loading && <span className="text-xs text-stone-400 italic">Cargando datos...</span>}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <th className="p-3">Fotos</th>
                    <th className="p-3">Prenda</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Precio</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.length === 0 && !loading ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-stone-400 italic">
                        No hay prendas registradas todavía.
                      </td>
                    </tr>
                  ) : (
                    products.map((item) => (
                      <tr key={item._id} className="hover:bg-stone-50/80 transition">
                        <td className="p-2.5 flex gap-1 items-center">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10"
                            title="Miniatura"
                          />
                          {item.detailImage && (
                            <SafeImage
                              src={item.detailImage}
                              alt="Detalle"
                              className="w-10 h-10 border-rose-200"
                              title="Foto Detalle (Pop-up)"
                            />
                          )}
                        </td>
                        <td className="p-3 font-bold text-stone-800 max-w-[180px]">
                          <div>{item.name}</div>
                          {item.destacado && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-semibold rounded">
                              ★ Destacado
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-stone-600 font-medium">{item.category}</td>
                        <td className="p-3 font-bold text-stone-900">
                          ${Number(item.priceRetail || item.price || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.stock > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.stock} u.
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-semibold transition cursor-pointer"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md font-semibold transition cursor-pointer"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA 2: GESTIÓN DE PEDIDOS ================= */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-xl shadow-xs border border-stone-200 space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-100 pb-3 gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <span>🛍️</span> Gestión de Pedidos ({orders.length})
              </h2>
              <p className="text-xs text-stone-500">
                Los pedidos están ordenados por urgencia.
              </p>
            </div>
            <button
              onClick={loadOrders}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg font-semibold transition self-start sm:self-auto cursor-pointer"
            >
              🔄 Actualizar Listado
            </button>
          </div>

          {ordersLoading ? (
            <p className="text-xs text-stone-400 py-6 text-center italic">Cargando pedidos...</p>
          ) : sortedOrders.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center italic">Aún no hay pedidos registrados.</p>
          ) : (
            <div className="space-y-4">
              {sortedOrders.map((order) => {
                const c = order.customer || {};
                const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
                const isPending = order.status === 'pendiente_pago';
                const isPaid = order.status === 'pagado';
                const isDispatched = order.status === 'despachado';
                const isCanceled = order.status === 'cancelado';

                return (
                  <div
                    key={order._id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isPending
                        ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
                        : isPaid
                        ? 'bg-blue-50/40 border-blue-200'
                        : isDispatched
                        ? 'bg-stone-50 border-stone-200 opacity-80'
                        : 'bg-stone-100/50 border-stone-200 opacity-60'
                    }`}
                  >
                    
                    {/* ENCABEZADO Y BADGE DE ESTADO */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-stone-200/60 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">
                            Pedido #{order._id.slice(-6)}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            • {new Date(order.createdAt).toLocaleDateString('es-AR')} {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-stone-900 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>👤 {c.fullName || 'Cliente Sin Nombre'}</span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/549${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition inline-flex items-center gap-1"
                            >
                              💬 WhatsApp ({c.phone})
                            </a>
                          )}
                        </h3>
                      </div>

                      {/* BADGES CON COLORES ALUSIVOS */}
                      <div>
                        {isPending && (
                          <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-xs animate-pulse">
                            ⏳ 1. Recibido / Pendiente
                          </span>
                        )}
                        {isPaid && (
                          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-xs">
                            💳 2. Cobrado / Por Enviar
                          </span>
                        )}
                        {isDispatched && (
                          <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                            🚀 3. Despachado
                          </span>
                        )}
                        {isCanceled && (
                          <span className="bg-stone-300 text-stone-700 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                            ❌ Cancelado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DATOS DE ENVÍO Y CLIENTE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                        <p className="font-bold text-[10px] text-stone-400 uppercase tracking-wider">Información de Envío:</p>
                        <p className="text-stone-700">📄 <strong>DNI/CUIT:</strong> {c.dni || 'S/D'} ({c.taxType || 'Consumidor Final'})</p>
                        <p className="text-stone-900 font-semibold">🏙️ <strong>Localidad:</strong> {c.city || 'No especificada'}</p>
                        <p className="text-stone-900 font-semibold">📍 <strong>Dirección:</strong> {c.address || 'Sin dirección'}</p>
                        {c.notes && (
                          <p className="text-stone-500 text-[11px] italic bg-rose-50 p-1.5 rounded border border-rose-200 mt-1">
                            📝 <strong>Notas:</strong> {c.notes}
                          </p>
                        )}
                      </div>

                      {/* DETALLE DE PRODUCTOS Y TOTAL */}
                      <div className="bg-white p-3 rounded-lg border border-stone-200 flex flex-col justify-between space-y-2">
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          <p className="font-bold text-[10px] text-stone-400 uppercase tracking-wider">Prendas Pedidas:</p>
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-stone-700">
                              <span>• {item.name} <strong>x{item.qty}</strong></span>
                              <span className="font-semibold">${((item.price || 0) * item.qty).toLocaleString('es-AR')}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-stone-100 pt-1.5 flex justify-between font-extrabold text-stone-900 text-sm">
                          <span>TOTAL A COBRAR:</span>
                          <span className="text-emerald-700">${order.total?.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/60">
                      
                      <button
                        onClick={() => copyShippingData(order)}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>📋</span>
                        <span>{copiedId === order._id ? '¡Etiqueta Copiada!' : 'Copiar Etiqueta de Envío'}</span>
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-stone-400 uppercase mr-1">Cambiar a:</span>

                        <button
                          onClick={() => handleOrderStatusChange(order._id, 'pendiente_pago')}
                          disabled={isPending}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                            isPending
                              ? 'bg-rose-200 text-rose-900 cursor-default opacity-60'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer'
                          }`}
                        >
                          ⏳ Recibido
                        </button>

                        <button
                          onClick={() => handleOrderStatusChange(order._id, 'pagado')}
                          disabled={isPaid}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                            isPaid
                              ? 'bg-blue-200 text-blue-900 cursor-default opacity-60'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                          }`}
                        >
                          💳 Cobrado
                        </button>

                        <button
                          onClick={() => handleOrderStatusChange(order._id, 'despachado')}
                          disabled={isDispatched}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                            isDispatched
                              ? 'bg-emerald-200 text-emerald-900 cursor-default opacity-60'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                          }`}
                        >
                          🚚 Despachado
                        </button>

                        {!isCanceled && (
                          <button
                            onClick={() => handleOrderStatusChange(order._id, 'cancelado')}
                            className="bg-stone-200 hover:bg-rose-100 hover:text-rose-700 text-stone-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            ❌
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}