import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'sunnybite_cart_v1';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', undoAction: null });
  const [flyingItems, setFlyingItems] = useState([]);
  const cartButtonRef = useRef(null);
  const lastStateRef = useRef(null);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const showToast = useCallback((message, undoAction = null) => {
    setToast({ visible: true, message, undoAction });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const addToCart = useCallback((dish, qty = 1, startElement = null) => {
    lastStateRef.current = cartItems;

    setCartItems(prev => {
      const existing = prev.find(i => i.id === dish.id);
      if (existing) {
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...dish, qty }];
    });

    // Fly animation to cart button if element provided and not in reduced-motion
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (startElement && cartButtonRef.current && !prefersReduced) {
      const startRect = startElement.getBoundingClientRect();
      const targetRect = cartButtonRef.current.getBoundingClientRect();

      const newFly = {
        id: Date.now() + Math.random(),
        image: dish.image,
        startX: startRect.left + startRect.width / 2 - 20,
        startY: startRect.top + startRect.height / 2 - 20,
        targetX: targetRect.left + targetRect.width / 2 - 20,
        targetY: targetRect.top + targetRect.height / 2 - 20,
      };

      setFlyingItems(f => [...f, newFly]);
      setTimeout(() => {
        setFlyingItems(f => f.filter(item => item.id !== newFly.id));
      }, 750);
    }

    showToast(
      `${dish.name} added to your order (Rs. ${dish.price * qty})`,
      () => {
        // Undo callback
        setCartItems(lastStateRef.current || []);
      }
    );
  }, [cartItems, showToast]);

  const updateQty = useCallback((dishId, newQty) => {
    lastStateRef.current = cartItems;
    if (newQty <= 0) {
      setCartItems(prev => prev.filter(i => i.id !== dishId));
    } else {
      setCartItems(prev => prev.map(i => i.id === dishId ? { ...i, qty: newQty } : i));
    }
  }, [cartItems]);

  const removeFromCart = useCallback((dishId) => {
    lastStateRef.current = cartItems;
    const item = cartItems.find(i => i.id === dishId);
    setCartItems(prev => prev.filter(i => i.id !== dishId));
    if (item) {
      showToast(`Removed ${item.name} from order`, () => {
        setCartItems(lastStateRef.current || []);
      });
    }
  }, [cartItems, showToast]);

  const clearCart = useCallback(() => {
    lastStateRef.current = cartItems;
    setCartItems([]);
  }, [cartItems]);

  const getItemQty = useCallback((dishId) => {
    const item = cartItems.find(i => i.id === dishId);
    return item ? item.qty : 0;
  }, [cartItems]);

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.qty, 0);
  const cartSubtotal = cartItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartSubtotal,
        isDrawerOpen,
        setIsDrawerOpen,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        getItemQty,
        toast,
        showToast,
        hideToast,
        cartButtonRef,
        flyingItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
