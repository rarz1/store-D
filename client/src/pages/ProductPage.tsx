import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GarmentMock from "../components/GarmentMock";
import DesignFlow, { type PlacedEstampado } from "../components/DesignFlow";
import SizeGuideModal from "../components/SizeGuideModal";
import AppHeader from "../components/AppHeader";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { useFavorites } from "../lib/favorites";
import { useGarment, useGarmentColors, useGarmentSizes, useEstampados, useGarmentEstampadoSizes } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { setMeta, setCanonical, setJsonLd, clearJsonLd } from "../lib/seo";
import type { DisenoTipoRow } from "../lib/supabase";

export default function ProductPage() {
  const { garmentId } = useParams<{ garmentId: string }>();
  const navigate = useNavigate();
  const { addItem, upsertItem, totalItems } = useCart();
  const toast = useToast();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const { data: garment, isLoading: garmentLoading } = useGarment(garmentId ?? "");
  const { data: colors = [] } = useGarmentColors(garment?.id ?? 0);
  const { data: sizes = [] } = useGarmentSizes(garment?.id ?? 0);
  const { data: estampados = [] } = useEstampados();
  const { data: stampSizes = [] } = useGarmentEstampadoSizes(garment?.id ?? 0);
  const [tiposByClase, setTiposByClase] = useState<Record<number, DisenoTipoRow[]>>({});

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [placedEstampados, setPlacedEstampados] = useState<PlacedEstampado[]>([]);

  const [designFlowOpen, setDesignFlowOpen] = useState(false);

  const handleSelectClase = async (claseId: number) => {
    if (tiposByClase[claseId]) return;
    const { data } = await supabase.from("diseno_tipos").select("*").eq("estampado_id", claseId).order("sort_order");
    if (data) setTiposByClase((prev) => ({ ...prev, [claseId]: data as DisenoTipoRow[] }));
  };

  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);

  useEffect(() => {
    if (colors.length > 0 && !selectedColor) setSelectedColor(colors[0].hex);
  }, [colors]);

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) setSelectedSize(sizes[0].name);
  }, [sizes]);

  useEffect(() => {
    if (garment) {
      const url = `${window.location.origin}/producto/${garment.slug}`;
      setMeta({
        title: `${garment.name} · STORE`,
        description: `${garment.name} · ${garment.description} · Desde $${Number(garment.base_price).toLocaleString("es-AR")}`,
      });
      setCanonical(url);
      setJsonLd("product-json-ld", {
        "@context": "https://schema.org",
        "@type": "Product",
        name: garment.name,
        description: garment.description,
        url,
        offers: {
          "@type": "Offer",
          price: Number(garment.base_price),
          priceCurrency: "ARS",
          availability: "https://schema.org/InStock",
        },
      });
    }
    return () => clearJsonLd("product-json-ld");
  }, [garment]);

  // Shareable product links: encode configuration as URL params
  useEffect(() => {
    if (!garment) return;
    // Only rewrite the URL while still on this product page — never clobber a
    // navigation that already happened (e.g. opening the cart after confirm).
    if (!window.location.pathname.startsWith(`/producto/${garment.slug}`)) return;
    const params = new URLSearchParams();
    if (selectedColor) params.set("color", selectedColor);
    if (selectedSize) params.set("size", selectedSize);
    placedEstampados.forEach((p, i) => {
      params.set(`design${i}`, `${p.estampado.id}-${p.tipo.id}-${p.size.id}-${p.locations.map((l) => l.id).join(",")}`);
    });
    const newUrl = `/producto/${garment.slug}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [garment, selectedColor, selectedSize, placedEstampados]);

  // Read URL params on load to restore configuration
  useEffect(() => {
    if (!garment) return;
    const params = new URLSearchParams(window.location.search);
    const colorParam = params.get("color");
    if (colorParam && colors.some((c) => c.hex === colorParam)) {
      setSelectedColor(colorParam);
    }
    const sizeParam = params.get("size");
    if (sizeParam && sizes.some((s) => s.name === sizeParam)) {
      setSelectedSize(sizeParam);
    }
    let designIdx = 0;
    while (params.get(`design${designIdx}`)) {
      designIdx++;
    }
    // Note: full design restoration from URL params would require additional logic
    // This provides the URL structure for shareable links
  }, [garment, colors, sizes]);

  const totalPrice = (garment?.base_price ?? 0) + placedEstampados.reduce((sum, p) => {
    const sizeInc = p.size.price_increment;
    const locInc = p.locations.reduce((s, l) => s + l.price_increment, 0);
    return sum + sizeInc + locInc;
  }, 0);

  const colorName = colors.find((c) => c.hex === selectedColor)?.name ?? "";

  const handleShare = async () => {
    try { await navigator.share({ title: `${garment?.name} · STORE`, text: `Mirá esta prenda: ${garment?.name}`, url: window.location.href }); }
    catch { /* fallback */ }
  };

  const handleToggleFavorite = () => {
    if (!garment) return;
    if (isFavorite(garment.id, selectedColor, selectedSize)) {
      removeFavorite(garment.id, selectedColor, selectedSize);
      toast.info("Eliminado de favoritos");
    } else {
      addFavorite({
        garmentId: garment.id,
        garmentName: garment.name,
        garmentSlug: garment.slug,
        basePrice: garment.base_price,
        colorHex: selectedColor,
        colorName: colorName,
        size: selectedSize,
      });
      toast.success("Agregado a favoritos");
    }
  };

  const handleAddToCart = () => {
    if (!garment) return;
    if (!selectedSize) {
      toast.warning("Elegí una talla antes de agregar al carrito");
      setShowSizeModal(true);
      return;
    }
    addItem({
      garmentId: garment.id,
      garmentName: garment.name,
      garmentSlug: garment.slug,
      garmentBasePrice: garment.base_price,
      garmentSvgMock: garment.svg_mock,
      garmentSvgMockBack: garment.svg_mock_back,
      colorHex: selectedColor,
      colorName: colorName,
      size: selectedSize,
      estampados: placedEstampados,
    });
    toast.success("Agregado al carrito");
  };

  const removeEstampado = (index: number) => {
    setPlacedEstampados((prev) => prev.filter((_, i) => i !== index));
  };

  if (garmentLoading) {
    return (
    <div className="product-page page-enter">
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
        <button className="btn-back" onClick={() => navigate("/colecciones")}>Volver a la colección</button>
      </div>
    );
  }

  const placedDesigns = placedEstampados.flatMap((p) => {
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

  const allMockDesigns = placedDesigns;

  return (
    <div className="product-page">
      <AppHeader settings={null} showBack title={garment.name} hideFab />

      <div className="product-sheet">
        <div className="product-sheet__mock">
          <div className="mock-frame">
            <div className="mock-duo">
              <GarmentMock
                garmentId={garmentId as string}
                color={selectedColor}
                svgMock={garment.svg_mock}
                svgMockBack={garment.svg_mock_back}
                placedDesigns={allMockDesigns}
                side="front"
              />
              {garment.svg_mock_back && (
                <GarmentMock
                  garmentId={garmentId as string}
                  color={selectedColor}
                  svgMock={garment.svg_mock}
                  svgMockBack={garment.svg_mock_back}
                  placedDesigns={allMockDesigns}
                  side="back"
                />
              )}
            </div>
          </div>
        </div>

        <div className="product-sheet__body">
          <div className="product-sheet__price-row">
            <div className="product-sheet__price-group">
              <span className="product-sheet__price">${totalPrice.toLocaleString("es-AR")}</span>
              {placedEstampados.length > 0 && (
                <span className="product-sheet__base">Desde ${Number(garment.base_price).toLocaleString("es-AR")}</span>
              )}
            </div>
            <div className="product-sheet__actions">
              <button
                className="btn-icon"
                onClick={handleToggleFavorite}
                aria-label={isFavorite(garment.id, selectedColor, selectedSize) ? "Quitar de favoritos" : "Agregar a favoritos"}
                style={{ color: isFavorite(garment.id, selectedColor, selectedSize) ? "#84cc16" : undefined }}
              >
                <svg viewBox="0 0 24 24" fill={isFavorite(garment.id, selectedColor, selectedSize) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {typeof navigator.share === "function" && (
                <button className="btn-icon" onClick={handleShare} aria-label="Compartir">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <h1 className="product-sheet__name">{garment.name}</h1>
          <p className="product-sheet__desc">{garment.description}</p>

          <div className="product-separator" />

          {colors.length > 0 && (
            <div className="control-group">
              <span className="control-label">
                ELEGÍ COLOR: <strong style={{ color: "var(--text)" }}>{colorName}</strong>
              </span>
              <div className="color-selector">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    className={`color-swatch${selectedColor === c.hex ? " color-swatch--active" : ""}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(c.hex)}
                    aria-label={c.name}
                    title={c.name}
                    type="button"
                  >
                    {selectedColor === c.hex && (
                      <svg viewBox="0 0 12 12" fill="none" width="14" height="14">
                        <path d="M2 6l3 3 5-5" stroke={c.hex === "#f0f0f0" || c.hex === "#ffffff" ? "#1a1a1a" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-separator" />

          {sizes.length > 0 && (
            <div className="control-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="control-label">
                  ELEGÍ TALLA: <strong style={{ color: "var(--text)" }}>{selectedSize || "SELECCIONAR"}</strong>
                </span>
                <button
                  className="control-clear"
                  onClick={() => setShowSizeGuideModal(true)}
                  type="button"
                >
                  Guía de tallas
                </button>
              </div>
              <div className="size-selector">
                {sizes.map((s) => (
                  <button
                    key={s.name}
                    className={`size-chip${selectedSize === s.name ? " size-chip--active" : ""}`}
                    onClick={() => setSelectedSize(s.name)}
                    type="button"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {placedEstampados.length > 0 && (
            <div className="placed-estampados">
              {placedEstampados.map((p, i) => (
                <div key={i} className="placed-estampado-row">
                  <div className="placed-estampado-row__info">
                    <span className="placed-estampado-row__name">{p.estampado.name} · {p.tipo.name} · {p.size.name}</span>
                    <span className="placed-estampado-row__locs">Ubicación libre · {(p.side ?? "front") === "back" ? "Posterior" : "Frente"}</span>
                  </div>
                  <span className="placed-estampado-row__price">
                    +${(p.size.price_increment + p.locations.reduce((s, l) => s + l.price_increment, 0)).toLocaleString("es-AR")}
                  </span>
                  <button className="btn-small btn-small--danger" onClick={() => removeEstampado(i)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {placedEstampados.length > 0 && (
            <button className="btn-seguir-disenando" onClick={() => setDesignFlowOpen(true)} type="button">
              SEGUIR DISEÑANDO
            </button>
          )}

          <div className="product-separator" />

          <button className="btn-elegir-diseno" onClick={() => setDesignFlowOpen(true)} type="button">
            CREA TU DISEÑO
          </button>

          <div className="product-actions-row">
            <button className="btn-add-cart-pill" onClick={handleAddToCart} type="button" aria-label="Agregar al carrito">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.5 3h2l2.4 12.2a1.8 1.8 0 001.8 1.4h8.6a1.8 1.8 0 001.8-1.4L22.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="btn-view-cart-pill" onClick={() => navigate("/carrito")} type="button" aria-label="Ver el carrito">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.5 3h2l2.4 12.2a1.8 1.8 0 001.8 1.4h8.6a1.8 1.8 0 001.8-1.4L22.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {totalItems > 0 && (
                <span className="btn-view-cart-pill__badge">{totalItems > 999 ? "999+" : totalItems}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showSizeModal && (
        <div className="modal-overlay" onClick={() => setShowSizeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Elegí la talla</h3>
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

      <SizeGuideModal
        open={showSizeGuideModal}
        onClose={() => setShowSizeGuideModal(false)}
        garmentSlug={garment?.slug}
      />

      {designFlowOpen && (
        <div className="sheet-overlay" onClick={() => setDesignFlowOpen(false)}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-panel__handle" />
            <DesignFlow
              estampados={estampados}
              tiposByClase={tiposByClase}
              stampSizes={stampSizes}
              garmentId={garmentId as string}
              color={selectedColor}
              svgMock={garment.svg_mock}
              svgMockBack={garment.svg_mock_back}
              initialDesigns={placedEstampados}
              onSelectClase={handleSelectClase}
              onClose={() => setDesignFlowOpen(false)}
              onConfirm={(items) => {
                setPlacedEstampados(items);
                setDesignFlowOpen(false);
                upsertItem({
                  garmentId: garment.id,
                  garmentName: garment.name,
                  garmentSlug: garment.slug,
                  garmentBasePrice: garment.base_price,
                  garmentSvgMock: garment.svg_mock,
                  garmentSvgMockBack: garment.svg_mock_back,
                  colorHex: selectedColor,
                  colorName: colorName,
                  size: selectedSize,
                  estampados: items,
                });
                navigate("/carrito");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}