import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  variantId: string;
  name: string;
  variantLabel: string;
  price: number;
  imageUrl?: string;
  qty: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  addToCart: (item: Omit<CartItem, 'qty'>, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('oaksol_cart');
    if (cached) {
      try {
        setCartItems(JSON.parse(cached));
      } catch (err) {
        console.error('Failed to parse cached cart:', err);
      }
    }
  }, []);

  // Save cart changes to localStorage
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('oaksol_cart', JSON.stringify(items));
  };

  const addToCart = (newItem: Omit<CartItem, 'qty'>, qty: number) => {
    const existingIndex = cartItems.findIndex((i) => i.variantId === newItem.variantId);
    let updated: CartItem[];
    
    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex].qty += qty;
    } else {
      updated = [...cartItems, { ...newItem, qty }];
    }
    
    saveCart(updated);
    setCartOpen(true); // Open cart drawer on add
  };

  const removeFromCart = (variantId: string) => {
    const updated = cartItems.filter((item) => item.variantId !== variantId);
    saveCart(updated);
  };

  const updateQty = (variantId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    const updated = cartItems.map((item) =>
      item.variantId === variantId ? { ...item, qty } : item
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
};
