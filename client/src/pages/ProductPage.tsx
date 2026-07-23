import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GarmentMock from "../components/GarmentMock";
import { supabase, type GarmentRow, type GarmentColorRow, type GarmentSizeRow, type DesignRow } from "../lib/supabase";
import { setMeta } from "../lib/seo";

const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";

export default function ProductPage() {
  const { garmentId } = useParams<{ garmentId: string }>();
  const navigate = useNavigate();

  const [garment, setGarment] = useState<GarmentRow | null>(null);
  const [colors, setColors] = useState<GarmentColorRow[]>([]);
  const [sizes, setSizes] = useState<GarmentSizeRow[]>([]);
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<DesignRow | null>(null);

  useEffect(() => {
    if (!garmentId) return;

    const fetchData = async () => {
      try {
        const { data: g, error: eg } = await supabase.from("garments").select("*").eq("slug", garmentId).single();
        if (eg || !g) { setLoading(false); return; }
        setGarment(g);
        setSelectedColor("");
        setSelectedSize("");

        const [cRes, sRes, dRes] = await Promise.all([
          supabase.from("garment_colors").select("*").eq("garment_id", g.id),
          supabase.from("garment_sizes").select("*").eq("garment_id", g.id),
          supabase.from("designs").select("*").order("id"),
        ]);

        if (cRes.data) { setColors(cRes.data); setSelectedColor(cRes.data[0]?.hex ?? ""); }
        if (sRes.data) { setSizes(sRes.data); setSelectedSize(sRes.data[0]?.name ?? ""); }
        if (dRes.data) setDesigns(dRes.data);

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

  if (loading) {
    return (
      <div className="product-page">
        <div className="product-content">
          <div className="mock-section">
            <div className="skeleton skeleton--mock" />
          </div>
          <div className="controls-section">
            <div className="control-group">
              <div className="skeleton skeleton--text" style={{ width: "4rem" }} />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton skeleton--avatar" />)}
              </div>
            </div>
            <div className="control-group">
              <div className="skeleton skeleton--text" style={{ width: "3rem" }} />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)" }} />)}
              </div>
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

  const colorName = colors.find((c) => c.hex === selectedColor)?.name ?? "";
  const whatsappMessage = encodeURIComponent(
    `Hola! Quiero consultar por:\n` +
    `• Prenda: ${garment.name}\n` +
    `• Color: ${colorName}\n` +
    `• Talle: ${selectedSize}\n` +
    (selectedDesign ? `• Diseño: ${selectedDesign.name}\n` : "") +
    `• Precio: $${Number(garment.base_price).toLocaleString("es-AR")}`
  );

  const handleShare = async () => {
    try { await navigator.share({ title: `${garment.name} · STORE`, text: `Mirá esta prenda: ${garment.name}`, url: window.location.href }); }
    catch { /* fallback */ }
  };

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
          <span className="product-header__price">${Number(garment.base_price).toLocaleString("es-AR")}</span>
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
            designSvg={selectedDesign?.svg_content ?? null}
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
                  aria-label={c.name}
                  title={c.name}
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
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">
              DISEÑO
              {selectedDesign && (
                <span className="control-clear" onClick={() => setSelectedDesign(null)}>Quitar</span>
              )}
            </label>
            <div className="design-selector">
              {designs.map((d) => (
                <button
                  key={d.id}
                  className={`design-card${selectedDesign?.id === d.id ? " design-card--active" : ""}`}
                  onClick={() => setSelectedDesign(d)}
                >
                  <div className="design-card__preview">
                    <div
                      className="design-card__svg"
                      dangerouslySetInnerHTML={{ __html: d.svg_content }}
                    />
                  </div>
                  <span className="design-card__name">{d.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="product-footer">
        {ADMIN_PHONE ? (
          <a
            href={`https://wa.me/${ADMIN_PHONE}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
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
