"use client";

import React, { createContext } from "react";
import type { ProductMatch } from "@/lib/product-types";
import type { CartItem } from "@/lib/cart-types";
import { cartTotal } from "@/lib/cart-types";

type CartContextValue = {
  items: CartItem[];
  addItem: (product: ProductMatch, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  isInCart: (productId: string) => boolean;
  total: number;
  itemCount: number;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  const addItem = React.useCallback((product: ProductMatch, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const isInCart = React.useCallback(
    (productId: string) => items.some((i) => i.product.id === productId),
    [items]
  );

  const value: CartContextValue = React.useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      isInCart,
      total: cartTotal(items),
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      clear,
    }),
    [items, addItem, removeItem, updateQuantity, isInCart, clear]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
