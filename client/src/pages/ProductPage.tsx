import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GarmentMock from "../components/GarmentMock";
import DesignFlow from "../components/DesignFlow";
import HelpModal from "../components/HelpModal";
import SizeGuideModal from "../components/SizeGuideModal";
import AppHeader from "../components/AppHeader";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { useFavorites } from "../lib/favorites";
import { useGarment, useGarmentColors, useGarmentSizes, useEstampados, useGarmentEstampadoSizes, useGarmentEstampadoLocations } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { setMeta, setCanonical, setJsonLd, clearJsonLd } from "../lib/seo";
import type { EstampadoRow, DisenoTipoRow, EstampadoSizeRow, EstampadoLocationRow, GarmentRow } from "../lib/supabase";

const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";

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
  const { addItem, openCart } = useCart();
  const toast = useToast();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const { data: garment, isLoading: garmentLoading } = useGarment(garmentId ?? "");
  const { data: colors = [] } = useGarmentColors(garment?.id ?? 0);
  const { data: sizes = [] } = useGarmentSizes(garment?.id ?? 0);
  const { data: estampados = [] } = useEstampados();
  const { data: stampSizes = [] } = useGarmentEstampadoSizes(garment?.id ?? 0);
  const { data: stampLocations = [] } = useGarmentEstampadoLocations(garment?.id ?? 0);
  const [tiposByClase, setTiposByClase] = useState<Record<number, DisenoTipoRow[]>>({});

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [placedEstampados, setPlacedEstampados] = useState<PlacedEstampado[]>([]);
  const [previewStamp, setPreviewStamp] = useState<{ svgContent: string; locations: EstampadoLocationRow[]; name: string; imageUrl?: string; customPosition?: { x: number; y: number } | null; widthPercent?: number; side?: "front" | "back" } | null>(null);

  const handleSelectClase = async (claseId: number) => {
    if (tiposByClase[claseId]) return;
    const { data } = await supabase.from("diseno_tipos").select("*").eq("estampado_id", claseId).order("sort_order");
    if (data) setTiposByClase((prev) => ({ ...prev, [claseId]: data as DisenoTipoRow[] }));
  };

  const [showColorModal, setShowColorModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);

  const [recommendations, setRecommendations] = useState<GarmentRow[]>([]);

  useEffect(() => {
    if (!garment) return;
    let cancelled = false;
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (cancelled || error || !data) return;
      const rows = data as GarmentRow[];
      const others = rows.filter((g) => g.id !== garment.id);
      const currentTags = new Set(garment.tags ?? []);
      const ranked = [...others].sort((a, b) => {
        const scoreA = (a.tags ?? []).filter((t) => currentTags.has(t)).length;
        const scoreB = (b.tags ?? []).filter((t) => currentTags.has(t)).length;
        return scoreB - scoreA;
      });
      setRecommendations(ranked.slice(0, 3));
    });
    return () => { cancelled = true; };
  }, [garment]);

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
      const locText = p.customPosition ? (p.side === "back" ? "Ubicación libre (posterior)" : "Ubicación libre (frente)") : p.locations.map((l) => l.name).join(", ");
      lines.push(`• ${p.estampado.name} · ${p.tipo.name} (${p.size.name}) - ${locText}: +$${(sizeInc + locInc).toLocaleString("es-AR")}`);
    });
    lines.push(`• Total: $${totalPrice.toLocaleString("es-AR")}`);
    return encodeURIComponent(lines.join("\n"));
  };

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
      toast.warning("Elegí un talle antes de agregar al carrito");
      setShowSizeModal(true);
      return;
    }
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
        <button className="btn-back" onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  const whatsappMessage = buildWhatsAppMessage();

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

  const previewDesigns = previewStamp
    ? (previewStamp.customPosition
        ? [{
            variantId: 999999,
            svgContent: previewStamp.svgContent,
            imageUrl: previewStamp.imageUrl,
            position: "large_front" as const,
            customPosition: previewStamp.customPosition,
            widthPercent: previewStamp.widthPercent ?? 40,
            side: previewStamp.side ?? "front",
            name: previewStamp.name,
            isPreview: true,
          }]
        : previewStamp.locations.map((loc) => ({
            variantId: 999999,
            svgContent: previewStamp.svgContent,
            imageUrl: previewStamp.imageUrl,
            position: loc.position_key as "small_front" | "small_front_right" | "large_front" | "small_back" | "large_back" | "sleeve",
            name: previewStamp.name,
            isPreview: true,
          })))
    : [];

  const allMockDesigns = [...placedDesigns, ...previewDesigns];

  return (
    <div className="product-page">
      <div className="breadcrumb">
        <a onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Inicio</a>
        <span className="breadcrumb__separator">›</span>
        <span className="breadcrumb__current">{garment.name}</span>
      </div>

      <AppHeader settings={null} showBack title={garment.name} />

      <div className="product-info-bar">
        <div className="product-info-bar__choices">
          {colorName && <span><span className="product-info-bar__label">Color</span> {colorName}</span>}
          {selectedSize && <span><span className="product-info-bar__label">Talle</span> {selectedSize}</span>}
        </div>
        <div className="product-info-bar__price">
          {placedEstampados.length > 0 && (
            <span className="product-info-bar__base">${Number(garment.base_price).toLocaleString("es-AR")}</span>
          )}
          {placedEstampados.map((p, i) => {
            const inc = p.size.price_increment + p.locations.reduce((s, l) => s + l.price_increment, 0);
            return <span key={i} className="product-info-bar__addon">+${inc.toLocaleString("es-AR")}</span>;
          })}
          <strong className="product-info-bar__total">${totalPrice.toLocaleString("es-AR")}</strong>
          <button
            className="btn-icon"
            onClick={handleToggleFavorite}
            aria-label={isFavorite(garment.id, selectedColor, selectedSize) ? "Quitar de favoritos" : "Agregar a favoritos"}
            style={{ marginLeft: "0.25rem" }}
          >
            <svg viewBox="0 0 24 24" fill={isFavorite(garment.id, selectedColor, selectedSize) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {typeof navigator.share === "function" && (
            <button className="btn-icon" onClick={handleShare} aria-label="Compartir" style={{ marginLeft: "0.25rem" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="product-content">
        <div className="mock-section">
          <div className="mock-duo">
            <GarmentMock
              garmentId={garmentId as string}
              color={selectedColor}
              svgMock={garment.svg_mock}
              svgMockBack={garment.svg_mock_back}
              placedDesigns={allMockDesigns}
            />
            {garment.svg_mock_back && (
              <GarmentMock
                garmentId={garmentId as string}
                color={selectedColor}
                svgMock={garment.svg_mock}
                svgMockBack={garment.svg_mock_back}
                placedDesigns={allMockDesigns}
                side="back"
                hideFlip
              />
            )}
          </div>
        </div>

        <div className="controls-section">
          {/* M6: Inline Color Swatches */}
          {colors.length > 0 && (
            <div className="control-group">
              <span className="control-label">
                COLOR: <strong style={{ color: "var(--text)" }}>{colorName}</strong>
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

          {/* M6: Inline Size Chips */}
          {sizes.length > 0 && (
            <div className="control-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="control-label">
                  TALLE: <strong style={{ color: "var(--text)" }}>{selectedSize || "SELECCIONAR"}</strong>
                </span>
                <button
                  className="control-clear"
                  onClick={() => setShowSizeGuideModal(true)}
                  type="button"
                >
                  Guía de talles
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

          <div className="control-group">
            {placedEstampados.length > 0 && (
              <div className="placed-estampados">
                {placedEstampados.map((p, i) => (
                  <div key={i} className="placed-estampado-row">
                    <div className="placed-estampado-row__info">
                      <span className="placed-estampado-row__name">{p.estampado.name} · {p.tipo.name} · {p.size.name}</span>
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
              tiposByClase={tiposByClase}
              stampSizes={stampSizes}
              stampLocations={stampLocations}
              garmentId={garmentId as string}
              color={selectedColor}
              svgMock={garment.svg_mock}
              svgMockBack={garment.svg_mock_back}
              onOpenHelp={() => setShowHelpModal(true)}
              onSelectClase={handleSelectClase}
              onPreviewChange={setPreviewStamp}
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
              }}
            />
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="recommendations">
          <h3 className="recommendations__title">QUIZÁS TAMBIÉN TE GUSTE</h3>
          <div className="recommendations__row">
            {recommendations.map((r) => {
              const mock = r.svg_mock
                ? r.svg_mock
                    .replace(/\s(width|height)="[^"]*"/g, "")
                    .replace(/currentColor/gi, "var(--accent)")
                : null;
              return (
                <button
                  key={r.id}
                  className="recommendation-card"
                  onClick={() => navigate(`/producto/${r.slug}`)}
                >
                  {mock ? (
                    <div className="recommendation-card__mock" dangerouslySetInnerHTML={{ __html: mock }} />
                  ) : (
                    <span className="recommendation-card__fallback">{r.name[0]}</span>
                  )}
                  <strong className="recommendation-card__name">{r.name}</strong>
                  <span className="recommendation-card__price">Desde ${Number(r.base_price).toLocaleString("es-AR")}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

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
      <SizeGuideModal
        open={showSizeGuideModal}
        onClose={() => setShowSizeGuideModal(false)}
        garmentSlug={garment?.slug}
      />

      <div className="product-footer">
        <button className="btn-primary" style={{ width: "100%", marginBottom: "0.5rem" }} onClick={handleAddToCart}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 10a4 4 0 010 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Agregar al carrito
        </button>
        {ADMIN_PHONE ? (
          <a href={`https://wa.me/${ADMIN_PHONE}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Consultar por WhatsApp
          </a>
        ) : (
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Configurá VITE_WHATSAPP_PHONE en .env para habilitar WhatsApp
          </p>
        )}
      </div>
    </div>
  );
}
