import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import GarmentMock from "../components/GarmentMock";
import { useCart, type CartItem } from "../lib/cart";
import { useToast } from "../lib/toast";
import { setMeta } from "../lib/seo";

const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";

/* Stamp size shown as initial (S, M, L, XL); FULL keeps the full word. */
function stampSizeLabel(size: { name: string; width_percent: number }): string {
  if (size.width_percent >= 100) return "FULL";
  if (size.width_percent <= 25) return "S";
  if (size.width_percent <= 50) return "M";
  if (size.width_percent <= 75) return "L";
  return "XL";
}

function buildCartMockDesigns(estampados: CartItem["estampados"]) {
  return estampados.flatMap((p) => {
    const base = {
      variantId: p.tipo.id,
      svgContent: p.tipo.svg_content || p.estampado.svg_content,
      imageUrl: p.tipo.image_url || undefined,
      name: `${p.estampado.name} · ${p.tipo.name}`,
    };
    if (p.customPosition) {
      return [{
        ...base,
        position: "large_front" as const,
        customPosition: p.customPosition,
        widthPercent: p.size.width_percent,
        side: p.side ?? "front",
      }];
    }
    return p.locations.map((loc) => ({
      ...base,
      position: loc.position_key as "small_front" | "small_front_right" | "large_front" | "small_back" | "large_back" | "sleeve",
    }));
  });
}

function CartItemThumb({ item }: { item: CartItem }) {
  const designs = buildCartMockDesigns(item.estampados);
  const hasBack = designs.some((d) => (d as { side?: string }).side === "back" || d.position.includes("back"));
  return (
    <div className="cart-item__thumb">
      <GarmentMock
        garmentId={item.garmentSlug}
        color={item.colorHex}
        svgMock={item.garmentSvgMock}
        svgMockBack={item.garmentSvgMockBack}
        placedDesigns={designs}
        side="front"
        hideFlip
      />
      {hasBack && (
        <GarmentMock
          garmentId={item.garmentSlug}
          color={item.colorHex}
          svgMock={item.garmentSvgMock}
          svgMockBack={item.garmentSvgMockBack}
          placedDesigns={designs}
          side="back"
          hideFlip
        />
      )}
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalItems, orders, reorder, placeOrder } = useCart();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showOrders, setShowOrders] = useState(false);

  useEffect(() => {
    setMeta({ title: "Carrito · STORE", description: "Revisá tu carrito y finalizá tu compra." });
  }, []);

  // Keep selection in sync with the item list
  useEffect(() => {
    setSelected(new Set(items.map((_, i) => i)));
  }, [items.length]);

  const selectedItems = items.filter((_, i) => selected.has(i));
  const selectedTotal = selectedItems.reduce((sum, item) => {
    const qty = item.quantity ?? 1;
    const addons = item.estampados.reduce((s, p) => s + p.size.price_increment + p.locations.reduce((a, l) => a + l.price_increment, 0), 0);
    return sum + (item.garmentBasePrice + addons) * qty;
  }, 0);
  const selectedCount = selectedItems.reduce((s, item) => s + (item.quantity ?? 1), 0);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((_, i) => i))));
  };

  const buildWhatsAppMessage = () => {
    const lines = ["Hola! Quiero realizar la compra/consulta del siguiente carrito:"];
    selectedItems.forEach((item, idx) => {
      const qty = item.quantity ?? 1;
      const unitAddons = item.estampados.reduce((s, p) => s + p.size.price_increment + p.locations.reduce((a, l) => a + l.price_increment, 0), 0);
      const unitTotal = item.garmentBasePrice + unitAddons;
      lines.push(``, `${idx + 1}. x${qty} ${item.garmentName} (${item.colorName}, Talla ${item.size}) - $${(unitTotal * qty).toLocaleString("es-AR")}`);
      item.estampados.forEach((p) => {
        if (p.customPosition) {
          const sideText = p.side === "back" ? "Posterior" : "Frente";
          lines.push(`   • Diseño: ${p.estampado.name} · ${p.tipo.name}`);
          lines.push(`     Tamaño: ${p.size.name} (${p.size.width_percent}% del ancho)`);
          lines.push(`     Posición: ${sideText} — X ${Math.round(p.customPosition.x)}%, Y ${Math.round(p.customPosition.y)}%`);
        } else if (p.locations.length > 0) {
          lines.push(`   • Diseño: ${p.estampado.name} · ${p.tipo.name} (${p.size.name}) — ${p.locations.map((l) => l.name).join(", ")}`);
        } else {
          lines.push(`   • Diseño: ${p.estampado.name} · ${p.tipo.name} (${p.size.name})`);
        }
      });
    });
    lines.push(``, `Total (${selectedCount} ítems): $${selectedTotal.toLocaleString("es-AR")}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const handleWhatsApp = () => {
    if (ADMIN_PHONE && selectedItems.length > 0) {
      placeOrder({ items: selectedItems, total: selectedTotal, date: new Date().toISOString() });
      toast.success("Pedido enviado por WhatsApp");
    }
  };

  return (
    <div className="cart-page page-enter">
      <AppHeader settings={null} storeName="store-d" bigStoreName hideFab />

      <div className="cart-page__body">
        {items.length === 0 ? (
          <div className="cart-empty">
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🛒</span>
            <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "var(--text)" }}>Tu carrito está vacío</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              Explorá la colección y agregá tu primera prenda
            </p>
            <button className="btn-primary" onClick={() => navigate("/colecciones", { replace: true })}>
              Explorar colección
            </button>
          </div>
        ) : (
          <>
            <div className="cart-select-all-row">
              <button className="cart-select-all" onClick={toggleAll} type="button">
                Seleccionar todo
              </button>
              <span className="cart-select-all__count">{totalItems}</span>
              <button
                className={`cart-checkbox${selected.size === items.length ? " cart-checkbox--checked" : ""}`}
                onClick={toggleAll}
                aria-label={selected.size === items.length ? "Deseleccionar todo" : "Seleccionar todo"}
                type="button"
              >
                {selected.size === items.length && (
                  <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>

            <div className="cart-items">
              {items.map((item, i) => {
                const qty = item.quantity ?? 1;
                return (
                  <div key={i} className="cart-item">
                    <div className="cart-item__thumb-col">
                      <CartItemThumb item={item} />
                    </div>
                    <div className="cart-item__info">
                      <strong className="cart-item__name">{item.garmentName}</strong>
                      <span className="cart-item__meta">
                        Color: {item.colorName} – Talla: {item.size}
                      </span>
                      <span className="cart-item__meta">
                        Basica: ${Number(item.garmentBasePrice).toLocaleString("es-AR")}
                      </span>
                      {item.estampados.length > 0 && (
                        <div className="cart-item__designs">
                          {item.estampados.map((p, j) => {
                            const inc = p.size.price_increment + p.locations.reduce((a, l) => a + l.price_increment, 0);
                            return (
                              <div key={j} className="cart-item__design">
                                <span className="cart-item__design-name">
                                  {p.tipo.name}
                                </span>
                                <span className="cart-item__design-price">
                                  {stampSizeLabel(p.size)}: +${inc.toLocaleString("es-AR")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="cart-qty">
                        <button
                          className="cart-qty__btn"
                          onClick={() => updateQuantity(i, qty - 1)}
                          aria-label="Disminuir cantidad"
                          type="button"
                        >
                          −
                        </button>
                        <span className="cart-qty__value">{qty}</span>
                        <button
                          className="cart-qty__btn"
                          onClick={() => updateQuantity(i, qty + 1)}
                          aria-label="Aumentar cantidad"
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cart-item__side">
                      <button
                        className={`cart-checkbox${selected.has(i) ? " cart-checkbox--checked" : ""}`}
                        onClick={() => toggleSelect(i)}
                        aria-label={selected.has(i) ? "Quitar de la selección" : "Seleccionar ítem"}
                        type="button"
                      >
                        {selected.has(i) && (
                          <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <button
                        className="cart-item__remove"
                        onClick={() => removeItem(i)}
                        aria-label="Quitar del carrito"
                        type="button"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="26" height="26">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="cart-summary">
          <div className="cart-summary__row">
            <span>Artículos seleccionados</span>
            <strong>{selectedCount}</strong>
          </div>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <strong>${selectedTotal.toLocaleString("es-AR")}</strong>
          </div>
          <div className="cart-summary__row">
            <span>Descuento</span>
            <strong>$0</strong>
          </div>
          <div className="cart-summary__row cart-summary__row--total">
            <span>Total de esta compra</span>
            <strong>${selectedTotal.toLocaleString("es-AR")}</strong>
          </div>

          {ADMIN_PHONE ? (
            <a
              href={`https://wa.me/${ADMIN_PHONE}?text=${buildWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-checkout"
              onClick={handleWhatsApp}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Checkout por Whatsapp
            </a>
          ) : (
            <button className="btn-checkout" type="button" disabled>
              Checkout
            </button>
          )}

          <div className="cart-page__actions">
            <button
              className="btn-pill-outline"
              onClick={() => {
                const last = selectedItems[0] ?? items[0];
                if (last) navigate(`/producto/${last.garmentSlug}`);
                else navigate(-1);
              }}
              type="button"
            >
              Volver
            </button>
            <button className="btn-pill-dark" onClick={() => navigate("/colecciones", { replace: true })} type="button">
              Seguir comprando
            </button>
            <button
              className="btn-pill-outline"
              onClick={() => {
                clearCart();
                toast.info("Carrito vaciado");
              }}
              type="button"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="cart-orders">
          <button
            className="cart-orders__toggle"
            onClick={() => setShowOrders((s) => !s)}
            aria-expanded={showOrders}
            type="button"
          >
            <span>Pedidos recientes</span>
            <span className="cart-orders__count">{orders.length}</span>
          </button>
          {showOrders && (
            <div className="cart-orders__list">
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
  );
}