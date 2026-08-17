import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const ProductContext = createContext();

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

  // Agregar nueva prenda (Soporta Variantes de Talles y Colores)
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
          variants: newProduct.variants || []
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

  // Actualizar producto completo o stock
  const updateProductData = async (id, updatedFields) => {
    if (!user || !user.token) return;

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(updatedFields)
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
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

  // Descontar stock de una variante específica tras la compra
  const reduceStockOnSale = async (productId, variantId, qty = 1) => {
    const target = products.find((p) => p._id === productId);
    if (!target) return;

    const updatedVariants = target.variants.map((v) => {
      if (v._id === variantId) {
        return { ...v, stock: Math.max(0, v.stock - qty) };
      }
      return v;
    });

    await updateProductData(productId, { variants: updatedVariants });
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        fetchProducts,
        addProduct,
        updateProductData,
        deleteProduct,
        reduceStockOnSale
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}