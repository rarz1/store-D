import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { EstampadoRow, EstampadoSizeRow, EstampadoLocationRow, DisenoTipoRow } from "./supabase";

const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";

export interface CartItem {
  garmentId: number;
  garmentName: string;
  garmentSlug: string;
  garmentBasePrice: number;
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
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
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
  const [isOpen, setIsOpen] = useState(false);
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

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

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
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice, isOpen, openCart, closeCart, orders, reorder, placeOrder }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

function CartDrawer() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalItems, isOpen, closeCart, orders, reorder, placeOrder } = useCart();
  const [showOrders, setShowOrders] = useState(false);

  const buildWhatsAppCartMessage = () => {
    const lines = ["Hola! Quiero realizar la compra/consulta del siguiente carrito:"];
    items.forEach((item, idx) => {
      const qty = item.quantity ?? 1;
      const unitAddons = item.estampados.reduce((s, p) => s + p.size.price_increment + p.locations.reduce((a, l) => a + l.price_increment, 0), 0);
      const unitTotal = item.garmentBasePrice + unitAddons;
      lines.push(`\n${idx + 1}. x${qty} ${item.garmentName} (${item.colorName}, Talla ${item.size}) - $${(unitTotal * qty).toLocaleString("es-AR")}`);
      item.estampados.forEach((p) => {
        const locText = p.customPosition
          ? (p.side === "back" ? "Ubicación libre (posterior)" : "Ubicación libre (frente)")
          : p.locations.map((l) => l.name).join(", ");
        lines.push(`   • Estampado: ${p.estampado.name} · ${p.tipo.name} (${p.size.name}) [${locText}]`);
      });
    });
    lines.push(`\nTotal general (${totalItems} ítems): $${totalPrice.toLocaleString("es-AR")}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const handleWhatsApp = () => {
    if (ADMIN_PHONE && items.length > 0) {
      placeOrder({ items: [...items], total: totalPrice, date: new Date().toISOString() });
    }
  };

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={closeCart} />}
      <div className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`} role="dialog" aria-label="Carrito">
        <div className="cart-drawer__header">
          <h2>Carrito ({totalItems})</h2>
          <button className="btn-icon" onClick={closeCart} aria-label="Cerrar carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🛒</span>
            <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "var(--text)" }}>Tu carrito está vacío</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Explorá la colección y agregá tu primera prenda</p>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item, i) => {
                const qty = item.quantity ?? 1;
                const unitAddons = item.estampados.reduce((s, p) => s + p.size.price_increment + p.locations.reduce((a, l) => a + l.price_increment, 0), 0);
                const itemTotal = (item.garmentBasePrice + unitAddons) * qty;

                return (
                  <div key={i} className="cart-drawer__item">
                    <div className="cart-drawer__item-info">
                      <strong>{item.garmentName}</strong>
                      <span className="cart-drawer__item-meta">
                        {item.colorName} · Talla {item.size}
                      </span>
                      {item.estampados.length > 0 && (
                        <span className="cart-drawer__item-estampados">
                          {item.estampados.map((p) => `${p.estampado.name} · ${p.tipo.name} (${p.size.name})`).join(", ")}
                        </span>
                      )}

                      {/* Quantity Controls */}
                      <div className="cart-drawer__qty-controls" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.4rem" }}>
                        <button
                          className="btn-small"
                          style={{ padding: "0.15rem 0.5rem", minWidth: "24px" }}
                          onClick={() => updateQuantity(i, qty - 1)}
                          aria-label="Disminuir cantidad"
                          type="button"
                        >
                          −
                        </button>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, minWidth: "16px", textAlign: "center" }}>{qty}</span>
                        <button
                          className="btn-small"
                          style={{ padding: "0.15rem 0.5rem", minWidth: "24px" }}
                          onClick={() => updateQuantity(i, qty + 1)}
                          aria-label="Aumentar cantidad"
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cart-drawer__item-right">
                      <span className="cart-drawer__item-price">
                        ${itemTotal.toLocaleString("es-AR")}
                      </span>
                      <button className="btn-small btn-small--danger" onClick={() => removeItem(i)} aria-label="Quitar">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total ({totalItems} {totalItems === 1 ? "ítem" : "ítems"})</span>
                <strong>${totalPrice.toLocaleString("es-AR")}</strong>
              </div>
              {ADMIN_PHONE ? (
                <a
                  href={`https://wa.me/${ADMIN_PHONE}?text=${buildWhatsAppCartMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  style={{ width: "100%", textDecoration: "none" }}
                  onClick={handleWhatsApp}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Consultar carrito por WhatsApp
                </a>
              ) : (
                <button className="btn-primary" onClick={closeCart} style={{ width: "100%" }}>
                  Continuar comprando
                </button>
              )}
              <button className="btn-danger" onClick={clearCart} style={{ width: "100%" }}>
                Vaciar carrito
              </button>
            </div>
          </>
        )}

        {orders.length > 0 && (
          <div className="cart-drawer__orders">
            <button
              className="cart-drawer__orders-toggle"
              onClick={() => setShowOrders((s) => !s)}
              aria-expanded={showOrders}
              type="button"
            >
              <span>Pedidos recientes</span>
              <span className="cart-drawer__orders-count">{orders.length}</span>
            </button>
            {showOrders && (
              <div className="cart-drawer__orders-list">
                {orders.map((order, idx) => (
                  <div key={idx} className="cart-order">
                    <div className="cart-order__meta">
                      <strong className="cart-order__total">${order.total.toLocaleString("es-AR")}</strong>
                      <span className="cart-order__date">
                        {new Date(order.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span className="cart-order__items">
                      {order.items.map((it) => `${it.quantity ?? 1}× ${it.garmentName}`).join(", ")}
                    </span>
                    <button className="btn-small" onClick={() => reorder(order)} type="button">
                      Repetir pedido
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
