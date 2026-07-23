import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GarmentMock from "../components/GarmentMock";
import { supabase, type GarmentRow, type GarmentColorRow, type GarmentSizeRow, type DesignOptionRow, type DesignVariantRow } from "../lib/supabase";
import { setMeta } from "../lib/seo";

const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";
type Position = "small_front" | "large_front" | "small_back" | "large_back";

interface PlacedDesign {
  variant: DesignVariantRow;
  option: DesignOptionRow;
  position: Position;
}

const positionLabels: Record<Position, string> = {
  small_front: "Pequeño - Frente",
  large_front: "Grande - Frente",
  small_back: "Pequeño - Posterior",
  large_back: "Grande - Posterior",
};

export default function ProductPage() {
  const { garmentId } = useParams<{ garmentId: string }>();
  const navigate = useNavigate();

  const [garment, setGarment] = useState<GarmentRow | null>(null);
  const [colors, setColors] = useState<GarmentColorRow[]>([]);
  const [sizes, setSizes] = useState<GarmentSizeRow[]>([]);
  const [designOptions, setDesignOptions] = useState<(DesignOptionRow & { variants: DesignVariantRow[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  type OptionWithVariants = DesignOptionRow & { variants: DesignVariantRow[] };
  const [selectedOption, setSelectedOption] = useState<OptionWithVariants | null>(null);
  const [placedDesigns, setPlacedDesigns] = useState<PlacedDesign[]>([]);
  const [addingPlacement, setAddingPlacement] = useState(false);
  const [newVariantId, setNewVariantId] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<Position>("small_front");

  useEffect(() => {
    if (!garmentId) return;

    const fetchData = async () => {
      try {
        const { data: g } = await supabase.from("garments").select("*").eq("slug", garmentId).single();
        if (!g) { setLoading(false); return; }
        setGarment(g);

        const [cRes, sRes, doRes] = await Promise.all([
          supabase.from("garment_colors").select("*").eq("garment_id", g.id),
          supabase.from("garment_sizes").select("*").eq("garment_id", g.id),
          supabase.from("design_options").select("*").order("id"),
        ]);

        if (cRes.data) { setColors(cRes.data); setSelectedColor(cRes.data[0]?.hex ?? ""); }
        if (sRes.data) { setSizes(sRes.data); setSelectedSize(sRes.data[0]?.name ?? ""); }

        if (doRes.data) {
          const withVariants: OptionWithVariants[] = await Promise.all(
            doRes.data.map(async (opt) => {
              const { data: variants } = await supabase
                .from("design_variants").select("*")
                .eq("design_option_id", opt.id).order("sort_order");
              return { ...opt, variants: variants ?? [] };
            })
          );
          setDesignOptions(withVariants);
        }

        setMeta({
          title: `${g.name} · STORE`,
          description: `${g.name} · ${g.description} · Desde $${Number(g.base_price).toLocaleString("es-AR")}`,
        });
      } catch (err) {
        console.error("Error loading product:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [garmentId]);

  const totalPrice = (garment?.base_price ?? 0) + placedDesigns.reduce((sum, p) =>
    sum + (p.option.base_price ?? 0) + (p.variant.additional_price ?? 0), 0
  );

  const addPlacement = () => {
    if (!newVariantId || !selectedOption) return;
    const variant = selectedOption.variants.find((v) => v.id === newVariantId);
    if (!variant) return;
    setPlacedDesigns([...placedDesigns, { variant, option: selectedOption, position: newPosition }]);
    setAddingPlacement(false);
    setNewVariantId(null);
  };

  const removePlacement = (i: number) => {
    setPlacedDesigns(placedDesigns.filter((_, j) => j !== i));
  };

  const colorName = colors.find((c) => c.hex === selectedColor)?.name ?? "";
  const whatsappMessage = encodeURIComponent(
    `Hola! Quiero consultar por:\n` +
    `• Prenda: ${garment?.name ?? ""}\n` +
    `• Color: ${colorName}\n` +
    `• Talle: ${selectedSize}\n` +
    placedDesigns.map((p) => `• ${p.option.name} (${p.variant.name}) - ${positionLabels[p.position]}: +$${Number(p.variant.additional_price + p.option.base_price).toLocaleString("es-AR")}`).join("\n") +
    `\n• Total: $${totalPrice.toLocaleString("es-AR")}`
  );

  const handleShare = async () => {
    try { await navigator.share({ title: `${garment?.name} · STORE`, text: `Mirá esta prenda: ${garment?.name}`, url: window.location.href }); }
    catch { /* fallback */ }
  };

  if (loading) {
    return (
      <div className="product-page">
        <div className="product-content">
          <div className="mock-section"><div className="skeleton skeleton--mock" /></div>
          <div className="controls-section">
            <div className="skeleton skeleton--text" style={{ width: "4rem" }} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton skeleton--avatar" />)}
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
          <div className="product-header__price">
            <span>$${Number(garment.base_price).toLocaleString("es-AR")}</span>
            {placedDesigns.map((p, i) => (
              <span key={i} className="product-header__addon">+ ${Number(p.variant.additional_price + p.option.base_price).toLocaleString("es-AR")}</span>
            ))}
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
          <GarmentMock
            garmentId={garmentId as string}
            color={selectedColor}
            svgMock={garment.svg_mock}
            svgMockBack={garment.svg_mock_back}
            placedDesigns={placedDesigns.map((p) => ({
              variantId: p.variant.id,
              svgContent: p.variant.svg_content,
              position: p.position,
              name: p.variant.name,
            }))}
          />
        </div>

        <div className="controls-section">
          <div className="control-group">
            <label className="control-label">COLOR</label>
            <div className="color-selector">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch${selectedColor === c.hex ? " color-swatch--active" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setSelectedColor(c.hex)}
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

          <div className="control-group">
            <label className="control-label">TALLE</label>
            <div className="size-selector">
              {sizes.map((s) => (
                <button
                  key={s.name}
                  className={`size-chip${selectedSize === s.name ? " size-chip--active" : ""}`}
                  onClick={() => setSelectedSize(s.name)}
                >{s.name}</button>
              ))}
            </div>
          </div>

          {designOptions.length > 0 && (
            <div className="control-group">
              <label className="control-label">LÍNEA DE DISEÑO</label>
              <div className="design-option-selector">
                {designOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={`design-option-card${selectedOption?.id === opt.id ? " design-option-card--active" : ""}`}
                    onClick={() => { setSelectedOption(opt); setAddingPlacement(false); }}
                  >
                    <span className="design-option-card__name">{opt.name}</span>
                    {opt.base_price > 0 && (
                      <span className="design-option-card__price">+${Number(opt.base_price).toLocaleString("es-AR")}</span>
                    )}
                    <span className="design-option-card__count">{opt.variants.length} variantes</span>
                  </button>
                ))}
                {!selectedOption && (
                  <button className="btn-small" onClick={() => setSelectedOption(designOptions[0])}>
                    Sin diseño
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedOption && selectedOption.variants.length > 0 && (
            <div className="control-group">
              <label className="control-label">DISEÑOS COLOCADOS</label>

              {placedDesigns.map((p, i) => (
                <div key={i} className="placed-design-row">
                  <div className="placed-design-row__info">
                    <span className="placed-design-row__name">{p.variant.name}</span>
                    <span className="placed-design-row__pos">{positionLabels[p.position]}</span>
                    <span className="placed-design-row__price">+${Number(p.variant.additional_price).toLocaleString("es-AR")}</span>
                  </div>
                  <button className="btn-small btn-small--danger" onClick={() => removePlacement(i)}>X</button>
                </div>
              ))}

              {addingPlacement ? (
                <div className="placement-form">
                  <select className="admin-input" value={newVariantId ?? ""} onChange={(e) => setNewVariantId(Number(e.target.value))}>
                    <option value="">Seleccionar variante</option>
                    {selectedOption.variants.filter((v) => v.svg_content).map((v) => (
                      <option key={v.id} value={v.id}>{v.name} (+${Number(v.additional_price).toLocaleString("es-AR")})</option>
                    ))}
                  </select>
                  <select className="admin-input" value={newPosition} onChange={(e) => setNewPosition(e.target.value as Position)}>
                    {(newVariantId ? selectedOption.variants.find((v) => v.id === newVariantId)?.positions ?? [] : []).map((pos) => (
                      <option key={pos} value={pos}>{positionLabels[pos as Position] ?? pos}</option>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn-small" onClick={addPlacement} disabled={!newVariantId}>Agregar</button>
                    <button className="btn-small" onClick={() => setAddingPlacement(false)}>Cancelar</button>
                  </div>
                  {newVariantId && selectedOption.variants.find((v) => v.id === newVariantId) && (
                    <div className="admin-preview" style={{ marginTop: 8 }}>
                      <div className="design-card__svg" style={{ width: 60, height: 66 }}
                        dangerouslySetInnerHTML={{
                          __html: selectedOption.variants.find((v) => v.id === newVariantId)!.svg_content.replace(/currentColor/gi, "var(--accent)"),
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <button className="btn-small" onClick={() => { setAddingPlacement(true); setNewVariantId(null); }}>
                  + Agregar diseño
                </button>
              )}
            </div>
          )}

          {selectedOption && selectedOption.variants.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Esta línea no tiene variantes aún
            </p>
          )}
        </div>
      </div>

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
