import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GarmentMock from "../components/GarmentMock";
import DesignFlow, { type CustomPosition } from "../components/DesignFlow";
import SizeGuideModal from "../components/SizeGuideModal";
import AppHeader from "../components/AppHeader";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { useFavorites } from "../lib/favorites";
import { useGarment, useGarmentColors, useGarmentSizes, useEstampados, useGarmentEstampadoSizes } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { setMeta, setCanonical, setJsonLd, clearJsonLd } from "../lib/seo";
import type { EstampadoRow, DisenoTipoRow, EstampadoSizeRow, EstampadoLocationRow } from "../lib/supabase";

interface PlacedEstampado {
  estampado: EstampadoRow;
  tipo: DisenoTipoRow;
  size: EstampadoSizeRow;
  locations: EstampadoLocationRow[];
  customPosition?: { x: number; y: number } | null;
  side?: "front" | "back";
}

export default function ProductPage() {
  const { garmentId } = useParams<{ garmentId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
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
  const [previewStamp, setPreviewStamp] = useState<{ svgContent: string; locations: EstampadoLocationRow[]; name: string; imageUrl?: string; customPosition?: { x: number; y: number } | null; widthPercent?: number; side?: "front" | "back" } | null>(null);

  const [customMode, setCustomMode] = useState(false);
  const [customPos, setCustomPos] = useState<CustomPosition | null>(null);
  const [customSide, setCustomSide] = useState<"front" | "back">("front");
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [designFlowOpen, setDesignFlowOpen] = useState(false);

  // When the design flow opens, bring the garment mock back into view (it can
  // be scrolled off since the page now scrolls as a whole) and keep it pinned
  // at the top so the drag-to-place surface stays visible above the sheet.
  useEffect(() => {
    if (designFlowOpen) {
      document.querySelector(".product-sheet__mock")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [designFlowOpen]);

  // Unified free-placement drag over the whole mock frame. On each move,
  // finds which garment mock (front or back) is under the pointer and updates
  // customPos + customSide accordingly, so the design can be placed on either
  // image from a single drag surface.
  const handleFramePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!customMode) return;
    e.preventDefault();
    const el = frameRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const update = (clientX: number, clientY: number) => {
      const mocks = Array.from(el.querySelectorAll("[data-side]"));
      const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
      for (const mock of mocks) {
        const rect = (mock as HTMLElement).getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
          const side = (mock as HTMLElement).dataset.side === "back" ? "back" : "front";
          const x = clamp(((clientX - rect.left) / rect.width) * 100, 5, 95);
          const y = clamp(((clientY - rect.top) / rect.height) * 100, 5, 95);
          setCustomSide(side);
          setCustomPos({ x, y });
          break;
        }
      }
    };
    update(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => update(ev.clientX, ev.clientY);
    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  };

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

  // Design that is being dragged/previewed directly on the garment mock while
  // the user is in the free placement ("location") step.
  const dragDesign = customMode && previewStamp
    ? {
        imageUrl: previewStamp.imageUrl,
        svgContent: previewStamp.svgContent,
        widthPercent: previewStamp.widthPercent ?? 40,
        position: customPos ?? { x: 50, y: 50 },
      }
    : null;

  const allMockDesigns = placedDesigns;

  return (
    <div className="product-page">
      <AppHeader settings={null} showBack title={garment.name} />

      <div className="product-sheet">
        <div className={`product-sheet__mock${designFlowOpen ? " product-sheet__mock--sticky" : ""}`}>
          <div
            className={`mock-frame${customMode ? " mock-frame--drag" : ""}`}
            ref={frameRef}
            onPointerDown={customMode ? handleFramePointerDown : undefined}
          >
            <div className="mock-duo">
              <GarmentMock
                garmentId={garmentId as string}
                color={selectedColor}
                svgMock={garment.svg_mock}
                svgMockBack={garment.svg_mock_back}
                placedDesigns={allMockDesigns}
                side={customMode ? "front" : undefined}
                hideFlip={customMode}
                dragDesign={customMode && customSide === "front" ? dragDesign : null}
              />
              {(customMode || garment.svg_mock_back) && (
                <GarmentMock
                  garmentId={garmentId as string}
                  color={selectedColor}
                  svgMock={garment.svg_mock}
                  svgMockBack={garment.svg_mock_back}
                  placedDesigns={allMockDesigns}
                  side="back"
                  hideFlip
                  dragDesign={customMode && customSide === "back" ? dragDesign : null}
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
              >
                <svg viewBox="0 0 24 24" fill={isFavorite(garment.id, selectedColor, selectedSize) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {typeof navigator.share === "function" && (
                <button className="btn-icon" onClick={handleShare} aria-label="Compartir">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <h1 className="product-sheet__name">{garment.name}</h1>
          <p className="product-sheet__desc">{garment.description}</p>

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

          <button className="btn-elegir-diseno" onClick={() => setDesignFlowOpen(true)} type="button">
            CREA TU DISEÑO
          </button>
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
              onSelectClase={handleSelectClase}
              onPreviewChange={setPreviewStamp}
              customMode={customMode}
              customPos={customPos}
              customSide={customSide}
              onCustomModeChange={setCustomMode}
              onCustomPosChange={setCustomPos}
              onCustomSideChange={setCustomSide}
              onClose={() => setDesignFlowOpen(false)}
              onAdd={(item) => {
                const isDuplicate = placedEstampados.some((p) =>
                  p.estampado.id === item.estampado.id &&
                  p.tipo.id === item.tipo.id &&
                  JSON.stringify(p.locations.map(l => l.id).sort()) === JSON.stringify(item.locations.map(l => l.id).sort()) &&
                  JSON.stringify(p.customPosition ?? null) === JSON.stringify(item.customPosition ?? null) &&
                  (p.side ?? "front") === (item.side ?? "front")
                );
                if (isDuplicate) {
                  toast.warning("Este diseño ya está agregado en esa ubicación");
                  return;
                }
                setPlacedEstampados([...placedEstampados, item]);
                setDesignFlowOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="product-footer">
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleAddToCart}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 10a4 4 0 010 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}