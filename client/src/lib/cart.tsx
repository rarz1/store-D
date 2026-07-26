import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { EstampadoRow, EstampadoSizeRow, EstampadoLocationRow, DisenoTipoRow } from "./supabase";

export interface CartItem {
  garmentId: number;
  garmentName: string;
  garmentSlug: string;
  garmentBasePrice: number;
  colorHex: string;
  colorName: string;
  size: string;
  estampados: Array<{
    estampado: EstampadoRow;
    tipo: DisenoTipoRow;
    size: EstampadoSizeRow;
    locations: EstampadoLocationRow[];
  }>;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType>(null!);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { saveCart(items); }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, item) => {
    const base = item.garmentBasePrice;
    const addons = item.estampados.reduce((s, p) => {
      const sizeInc = p.size.price_increment;
      const locInc = p.locations.reduce((a, l) => a + l.price_increment, 0);
      return s + sizeInc + locInc;
    }, 0);
    return sum + base + addons;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalItems, totalPrice, isOpen, openCart, closeCart }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

function CartDrawer() {
  const { items, removeItem, clearCart, totalPrice, isOpen, closeCart } = useCart();

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={closeCart} />}
      <div className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`} role="dialog" aria-label="Carrito">
        <div className="cart-drawer__header">
          <h2>Carrito ({items.length})</h2>
          <button className="btn-icon" onClick={closeCart} aria-label="Cerrar carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item, i) => (
                <div key={i} className="cart-drawer__item">
                  <div className="cart-drawer__item-info">
                    <strong>{item.garmentName}</strong>
                    <span className="cart-drawer__item-meta">
                      {item.colorName} · {item.size}
                    </span>
                    {item.estampados.length > 0 && (
                      <span className="cart-drawer__item-estampados">
                        {item.estampados.map((p) => `${p.estampado.name} · ${p.tipo.name} (${p.size.name})`).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="cart-drawer__item-right">
                    <span className="cart-drawer__item-price">
                      ${(item.garmentBasePrice + item.estampados.reduce((s, p) => {
                        return s + p.size.price_increment + p.locations.reduce((a, l) => a + l.price_increment, 0);
                      }, 0)).toLocaleString("es-AR")}
                    </span>
                    <button className="btn-small btn-small--danger" onClick={() => removeItem(i)} aria-label="Quitar">✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total</span>
                <strong>${totalPrice.toLocaleString("es-AR")}</strong>
              </div>
              <button className="btn-primary" onClick={clearCart} style={{ width: "100%" }}>
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
