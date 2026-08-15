import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const ProductContext = createContext();

// Limpieza profunda de la URL de la API y anti-duplicación
const getCleanApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://luisinnapilcheria-api.onrender.com/api';

  // Si la URL viene repetida por error de entorno
  if ((url.match(/https?:\/\//g) || []).length > 1) {
    const parts = url.split(/(?=https?:\/\/)/);
    url = parts[parts.length - 1]; // Toma únicamente la última URL válida
  }

  // Sanitizado básico
  url = url.replace(/[\[\]\(\)'"]/g, '').trim().replace(/\/+$/, '');

  // Asegura la terminación en /api
  if (!url.endsWith('/api')) {
    url += '/api';
  }

  return url;
};

const API_URL = getCleanApiUrl();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Cargar productos desde MongoDB al iniciar
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/products`);
      
      if (!res.ok) {
        console.warn(`Aviso al cargar productos: El servidor respondió con estado ${res.status}`);
        return;
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error al obtener prendas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Agregar nueva prenda (Requiere Token de administración)
  const addProduct = async (newProduct) => {
    if (!user || !user.token) return { success: false, message: 'No estás autenticada' };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...newProduct,
          priceRetail: Number(newProduct.priceRetail || newProduct.price),
          stock: Number(newProduct.stock)
        })
      });

      const contentType = res.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok) {
        setProducts((prev) => [data, ...prev]);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Error al guardar la prenda' };
      }
    } catch (error) {
      return { success: false, message: 'Error al conectar con el servidor' };
    }
  };

  // Actualizar stock directamente en vivo en MongoDB
  const updateStock = async (id, newStock) => {
    if (!user || !user.token) return;

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ stock: Math.max(0, Number(newStock)) })
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      }
    } catch (error) {
      console.error('Error al actualizar stock:', error);
    }
  };

  // Eliminar prenda del catálogo en MongoDB
  const deleteProduct = async (id) => {
    if (!user || !user.token) return;

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar prenda:', error);
    }
  };

  // Descontar stock al realizar una compra
  const reduceStockOnSale = async (id, qty = 1) => {
    const target = products.find((p) => p._id === id);
    if (!target) return;
    const newStock = Math.max(0, target.stock - qty);
    await updateStock(id, newStock);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        fetchProducts,
        addProduct,
        updateStock,
        deleteProduct,
        reduceStockOnSale
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}