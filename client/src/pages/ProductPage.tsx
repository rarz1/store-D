import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GarmentMock from "../components/GarmentMock";
import DesignFlow from "../components/DesignFlow";
import HelpModal from "../components/HelpModal";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { useGarment, useGarmentColors, useGarmentSizes, useEstampados, useEstampadoSizes, useEstampadoLocations } from "../lib/hooks";
import { setMeta } from "../lib/seo";
import type { EstampadoRow, EstampadoSizeRow, EstampadoLocationRow } from "../lib/supabase";

const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";

interface PlacedEstampado {
  estampado: EstampadoRow;
  size: EstampadoSizeRow;
  locations: EstampadoLocationRow[];
}

export default function ProductPage() {
  const { garmentId } = useParams<{ garmentId: string }>();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const toast = useToast();

  const { data: garment, isLoading: garmentLoading } = useGarment(garmentId ?? "");
  const { data: colors = [] } = useGarmentColors(garment?.id ?? 0);
  const { data: sizes = [] } = useGarmentSizes(garment?.id ?? 0);
  const { data: estampados = [] } = useEstampados();
  const { data: stampSizes = [] } = useEstampadoSizes();
  const { data: stampLocations = [] } = useEstampadoLocations();

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [placedEstampados, setPlacedEstampados] = useState<PlacedEstampado[]>([]);

  const [showColorModal, setShowColorModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (colors.length > 0 && !selectedColor) setSelectedColor(colors[0].hex);
  }, [colors]);

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) setSelectedSize(sizes[0].name);
  }, [sizes]);

  useEffect(() => {
    if (garment) {
      setMeta({
        title: `${garment.name} · STORE`,
        description: `${garment.name} · ${garment.description} · Desde $${Number(garment.base_price).toLocaleString("es-AR")}`,
      });
    }
  }, [garment]);

  const totalPrice = (garment?.base_price ?? 0) + placedEstampados.reduce((sum, p) => {
    const sizeInc = p.size.price_increment;
    const locInc = p.locations.reduce((s, l) => s + l.price_increment, 0);
    return sum + sizeInc + locInc;
  }, 0);

  const colorName = colors.find((c) => c.hex === selectedColor)?.name ?? "";

  const buildWhatsAppMessage = () => {
    const lines = [
      "Hola! Quiero consultar por:",
      `• Prenda: ${garment?.name ?? ""}`,
      `• Color: ${colorName}`,
      `• Talle: ${selectedSize}`,
    ];
    placedEstampados.forEach((p) => {
      const sizeInc = p.size.price_increment;
      const locInc = p.locations.reduce((s, l) => s + l.price_increment, 0);
      lines.push(`• ${p.estampado.name} (${p.size.name}) - ${p.locations.map(l => l.name).join(", ")}: +$${(sizeInc + locInc).toLocaleString("es-AR")}`);
    });
    lines.push(`• Total: $${totalPrice.toLocaleString("es-AR")}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const handleShare = async () => {
    try { await navigator.share({ title: `${garment?.name} · STORE`, text: `Mirá esta prenda: ${garment?.name}`, url: window.location.href }); }
    catch { /* fallback */ }
  };

  const handleAddToCart = () => {
    if (!garment) return;
    addItem({
      garmentId: garment.id,
      garmentName: garment.name,
      garmentSlug: garment.slug,
      garmentBasePrice: garment.base_price,
      colorHex: selectedColor,
      colorName: colorName,
      size: selectedSize,
      estampados: placedEstampados,
    });
    openCart();
  };

  const removeEstampado = (index: number) => {
    setPlacedEstampados((prev) => prev.filter((_, i) => i !== index));
  };

  if (garmentLoading) {
    return (
      <div className="product-page">
        <div className="product-content">
          <div className="mock-section"><div className="skeleton skeleton--mock" /></div>
          <div className="controls-section">
            <div className="skeleton skeleton--text" style={{ width: "4rem" }} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--avatar" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!garment) {
    return (
      <div className="product-page product-page--empty">
        <p>Prenda no encontrada</p>
        <button className="btn-back" onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  const whatsappMessage = buildWhatsAppMessage();

  const placedDesigns = placedEstampados.flatMap((p) =>
    p.locations.map((loc) => ({
      variantId: p.estampado.id,
      svgContent: p.estampado.svg_content,
      position: loc.position_key as "small_front" | "small_front_right" | "large_front" | "small_back" | "large_back" | "sleeve",
      name: p.estampado.name,
    }))
  );

  return (
    <div className="product-page">
      <header className="product-header">
        <button className="btn-icon" onClick={() => navigate("/")} aria-label="Volver">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="product-header__info">
          <h1 className="product-header__title">{garment.name}</h1>
          <p className="product-header__desc">{garment.description}</p>
          {(colorName || selectedSize) && (
            <div className="product-header__choices">
              {colorName && <span>Color: {colorName}</span>}
              {selectedSize && <span>Talle: {selectedSize}</span>}
            </div>
          )}
          <div className="product-header__price">
            <span>Base: ${Number(garment.base_price).toLocaleString("es-AR")}</span>
            {placedEstampados.map((p, i) => {
              const inc = p.size.price_increment + p.locations.reduce((s, l) => s + l.price_increment, 0);
              return <span key={i} className="product-header__addon">+ ${inc.toLocaleString("es-AR")}</span>;
            })}
            <strong>= ${totalPrice.toLocaleString("es-AR")}</strong>
          </div>
        </div>
        {typeof navigator.share === "function" && (
          <button className="btn-icon" onClick={handleShare} aria-label="Compartir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </header>

      <div className="product-content">
        <div className="mock-section">
          <div className="mock-duo">
            <GarmentMock
              garmentId={garmentId as string}
              color={selectedColor}
              svgMock={garment.svg_mock}
              svgMockBack={garment.svg_mock_back}
              placedDesigns={placedDesigns}
            />
            {garment.svg_mock_back && (
              <GarmentMock
                garmentId={garmentId as string}
                color={selectedColor}
                svgMock={garment.svg_mock}
                svgMockBack={garment.svg_mock_back}
                placedDesigns={placedDesigns}
                side="back"
                hideFlip
              />
            )}
          </div>
        </div>

        <div className="controls-section">
          <div className="control-group">
            <button className="choice-btn" onClick={() => setShowColorModal(true)}>
              <span className="choice-btn__label">Color</span>
              <span className="choice-btn__value">{colorName || "Elegir"}</span>
              <svg className="choice-btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="control-group">
            <button className="choice-btn" onClick={() => setShowSizeModal(true)}>
              <span className="choice-btn__label">Talle</span>
              <span className="choice-btn__value">{selectedSize || "Elegir"}</span>
              <svg className="choice-btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="control-group">
            <div className="control-group__header">
              <span className="control-label">PERSONALIZÁ TU PRENDA</span>
              <button className="btn-small btn-small--help" onClick={() => setShowHelpModal(true)} title="¿Cómo funciona?">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {placedEstampados.length > 0 && (
              <div className="placed-estampados">
                {placedEstampados.map((p, i) => (
                  <div key={i} className="placed-estampado-row">
                    <div className="placed-estampado-row__info">
                      <span className="placed-estampado-row__name">{p.estampado.name} · {p.size.name}</span>
                      <span className="placed-estampado-row__locs">{p.locations.map(l => l.name).join(", ")}</span>
                    </div>
                    <span className="placed-estampado-row__price">
                      +${(p.size.price_increment + p.locations.reduce((s, l) => s + l.price_increment, 0)).toLocaleString("es-AR")}
                    </span>
                    <button className="btn-small btn-small--danger" onClick={() => removeEstampado(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <DesignFlow
              estampados={estampados}
              stampSizes={stampSizes}
              stampLocations={stampLocations}
              onAdd={(item) => {
                const isDuplicate = placedEstampados.some((p) =>
                  p.estampado.id === item.estampado.id &&
                  JSON.stringify(p.locations.map(l => l.id).sort()) === JSON.stringify(item.locations.map(l => l.id).sort())
                );
                if (isDuplicate) {
                  toast.warning("Este diseño ya está agregado en esa ubicación");
                  return;
                }
                setPlacedEstampados([...placedEstampados, item]);
              }}
            />
          </div>

          <button className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} onClick={handleAddToCart}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{marginRight: "0.5rem"}}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 10a4 4 0 010 8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Agregar al carrito
          </button>
        </div>
      </div>

      {showColorModal && (
        <div className="modal-overlay" onClick={() => setShowColorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Elegí el color</h3>
              <button className="btn-icon" onClick={() => setShowColorModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="color-grid">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch${selectedColor === c.hex ? " color-swatch--active" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => { setSelectedColor(c.hex); setShowColorModal(false); }}
                  aria-label={c.name} title={c.name}
                >
                  {selectedColor === c.hex && (
                    <svg viewBox="0 0 12 12" fill="none" width="14" height="14">
                      <path d="M2 6l3 3 5-5" stroke={c.hex === "#f0f0f0" ? "#1a1a1a" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSizeModal && (
        <div className="modal-overlay" onClick={() => setShowSizeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Elegí el talle</h3>
              <button className="btn-icon" onClick={() => setShowSizeModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="size-grid">
              {sizes.map((s) => (
                <button
                  key={s.name}
                  className={`size-chip${selectedSize === s.name ? " size-chip--active" : ""}`}
                  onClick={() => { setSelectedSize(s.name); setShowSizeModal(false); }}
                >{s.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />

      <div className="product-footer">
        {ADMIN_PHONE ? (
          <a href={`https://wa.me/${ADMIN_PHONE}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Consultar por WhatsApp
          </a>
        ) : (
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Configurá VITE_WHATSAPP_PHONE en .env para habilitar WhatsApp
          </p>
        )}
      </div>
    </div>
  );
}
