import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      // Sanitizamos para ignorar elementos nulos o sin _id
      return Array.isArray(parsed) 
        ? parsed.filter(item => item && item._id) 
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Agregar al carrito
  const addToCart = (product, quantityToAdd = 1) => {
    if (!product || !product._id) return;

    setCartItems((prevItems) => {
      const exists = prevItems.find((x) => x._id === product._id);
      
      // Normalizar precio para minorista
      const actualPrice = Number(product.priceRetail || product.price || 0);

      if (exists) {
        const currentQty = exists.qty || exists.quantity || 0;
        const newQty = currentQty + quantityToAdd;

        return prevItems.map((x) =>
          x._id === product._id 
            ? { 
                ...x, 
                qty: newQty, 
                quantity: newQty // Sincronizamos ambas props
              } 
            : x
        );
      }

      // Si es un producto nuevo
      const newProduct = { 
        ...product, 
        price: actualPrice,
        priceRetail: actualPrice,
        qty: quantityToAdd,
        quantity: quantityToAdd // Sincronizamos ambas props
      };

      return [...prevItems, newProduct];
    });
  };

  // Actualizar cantidad específica (+1 / -1)
  const updateQuantity = (id, delta) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item._id === id) {
            const currentQty = item.qty || item.quantity || 1;
            const newQty = currentQty + delta;
            return newQty > 0 
              ? { ...item, qty: newQty, quantity: newQty } 
              : null;
          }
          return item;
        })
        .filter(Boolean) // Elimina los items que dieron null (cantidad <= 0)
    );
  };

  // Eliminar producto
  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((x) => x && x._id !== id));
  };

  // Vaciar carrito
  const clearCart = () => setCartItems([]);

  // CÁLCULOS DE MONTO SEGUROS
  const cartTotal = cartItems.reduce((acc, item) => {
    if (!item) return acc;
    const price = Number(item.priceRetail || item.price || 0);
    const quantity = Number(item.qty || item.quantity || 0);
    return acc + (price * quantity);
  }, 0);

  // Contador total de prendas para el badge del Navbar
  const totalCount = cartItems.reduce((acc, item) => {
    if (!item) return acc;
    return acc + Number(item.qty || item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        totalCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};