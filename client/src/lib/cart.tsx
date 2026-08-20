import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { EstampadoRow, EstampadoSizeRow, EstampadoLocationRow, DisenoTipoRow } from "./supabase";

export interface CartItem {
  garmentId: number;
  garmentName: string;
  garmentSlug: string;
  garmentBasePrice: number;
  garmentSvgMock?: string;
  garmentSvgMockBack?: string;
  colorHex: string;
  colorName: string;
  size: string;
  quantity?: number;
  estampados: Array<{
    estampado: EstampadoRow;
    tipo: DisenoTipoRow;
    size: EstampadoSizeRow;
    locations: EstampadoLocationRow[];
    customPosition?: { x: number; y: number } | null;
    side?: "front" | "back";
  }>;
}

export interface Order {
  items: CartItem[];
  total: number;
  date: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  upsertItem: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  orders: Order[];
  reorder: (order: Order) => void;
  placeOrder: (order: Order) => void;
}

const CartContext = createContext<CartContextType>(null!);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    if (raw) {
      const parsed: CartItem[] = JSON.parse(raw);
      return parsed.map((item) => ({ ...item, quantity: item.quantity ?? 1 }));
    }
  } catch { /* ignore */ }
  return [];
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

function normalizeEstampados(estampados: CartItem["estampados"]) {
  return estampados.map((e) => ({ ...e, customPosition: e.customPosition ?? null, side: e.side ?? "front" }));
}

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem("orders");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveOrder(order: Order) {
  try {
    const orders = loadOrders();
    orders.unshift(order);
    if (orders.length > 10) orders.length = 10;
    localStorage.setItem("orders", JSON.stringify(orders));
  } catch { /* ignore */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [orders, setOrders] = useState<Order[]>(loadOrders);

  useEffect(() => { saveCart(items); }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.garmentId === item.garmentId &&
          i.colorHex === item.colorHex &&
          i.size === item.size &&
          JSON.stringify(normalizeEstampados(i.estampados)) === JSON.stringify(normalizeEstampados(item.estampados))
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const currentQty = updated[existingIdx].quantity ?? 1;
        updated[existingIdx] = { ...updated[existingIdx], quantity: currentQty + (item.quantity ?? 1) };
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  // One cart item per garment configuration: if a garment with the same
  // color + size already exists, replace its confirmed designs with the
  // current working set instead of duplicating the item.
  const upsertItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.garmentId === item.garmentId && i.colorHex === item.colorHex && i.size === item.size
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const qty = updated[existingIdx].quantity ?? 1;
        updated[existingIdx] = { ...updated[existingIdx], ...item, quantity: qty };
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity };
        return updated;
      });
    }
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const reorder = useCallback((order: Order) => {
    setItems((prev) => {
      const next = [...prev];
      order.items.forEach((item) => {
        const existingIdx = next.findIndex(
          (i) =>
            i.garmentId === item.garmentId &&
            i.colorHex === item.colorHex &&
            i.size === item.size &&
            JSON.stringify(normalizeEstampados(i.estampados)) === JSON.stringify(normalizeEstampados(item.estampados))
        );
        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: (next[existingIdx].quantity ?? 1) + (item.quantity ?? 1),
          };
        } else {
          next.push({ ...item });
        }
      });
      return next;
    });
  }, []);

  const placeOrder = useCallback((order: Order) => {
    saveOrder(order);
    setOrders(loadOrders());
  }, []);

  const totalItems = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  const totalPrice = items.reduce((sum, item) => {
    const qty = item.quantity ?? 1;
    const base = item.garmentBasePrice;
    const addons = item.estampados.reduce((s, p) => {
      const sizeInc = p.size.price_increment;
      const locInc = p.locations.reduce((a, l) => a + l.price_increment, 0);
      return s + sizeInc + locInc;
    }, 0);
    return sum + (base + addons) * qty;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, upsertItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice, orders, reorder, placeOrder }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}