import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem, BulkDiscount } from "@shared/schema";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  getShippingForCity: (city: string) => number;
  deliveryCharges: { delhi: number; other: number };
  bulkDiscount: { name: string; percent: number; amount: number } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "lumiere-cart";

// Default delivery charges (will be overridden by server settings)
const DEFAULT_DELHI_SHIPPING = 0;
const DEFAULT_OTHER_SHIPPING = 45;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryCharges, setDeliveryCharges] = useState({
    delhi: DEFAULT_DELHI_SHIPPING,
    other: DEFAULT_OTHER_SHIPPING
  });
  const [bulkDiscounts, setBulkDiscounts] = useState<BulkDiscount[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Fetch delivery charges and bulk discounts from server
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [delhiRes, otherRes, bulkRes] = await Promise.all([
          fetch('/api/settings/delivery_charge_delhi'),
          fetch('/api/settings/delivery_charge_other'),
          fetch('/api/bulk-discounts/active')
        ]);
        
        if (delhiRes.ok) {
          const data = await delhiRes.json();
          setDeliveryCharges(prev => ({ ...prev, delhi: parseInt(data.value) || 0 }));
        }
        if (otherRes.ok) {
          const data = await otherRes.json();
          setDeliveryCharges(prev => ({ ...prev, other: parseInt(data.value) || DEFAULT_OTHER_SHIPPING }));
        }
        if (bulkRes.ok) {
          const data = await bulkRes.json();
          setBulkDiscounts(data || []);
        }
      } catch {
        // Use defaults if fetch fails
      }
    };
    fetchSettings();
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate bulk discount based on total quantity
  const bulkDiscount = (() => {
    if (bulkDiscounts.length === 0 || itemCount === 0) return null;
    
    // Sort by minQuantity descending to get the best applicable discount
    const sortedDiscounts = [...bulkDiscounts].sort((a, b) => b.minQuantity - a.minQuantity);
    const applicableDiscount = sortedDiscounts.find(d => itemCount >= d.minQuantity);
    
    if (!applicableDiscount) return null;
    
    const discountAmount = (subtotal * applicableDiscount.discountPercent) / 100;
    return {
      name: applicableDiscount.name,
      percent: applicableDiscount.discountPercent,
      amount: discountAmount
    };
  })();
  
  // Calculate shipping based on city - uses dynamic charges from settings
  const getShippingForCity = useCallback((city: string): number => {
    const cityLower = city.toLowerCase().trim();
    if (cityLower === 'delhi' || cityLower === 'new delhi' || cityLower.includes('delhi')) {
      return deliveryCharges.delhi;
    }
    return deliveryCharges.other;
  }, [deliveryCharges]);
  
  // Default shipping shown before city is entered (show Delhi rate as default)
  const shipping = deliveryCharges.delhi;
  const total = subtotal - (bulkDiscount?.amount || 0) + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        shipping,
        total,
        getShippingForCity,
        deliveryCharges,
        bulkDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
