import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type GarmentRow, type DesignOptionRow, type DesignVariantRow } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import ConfirmModal from "../../components/ConfirmModal";
import { getSettings, saveSettings, getSlides, saveSlide, uploadImage, applyColors, type SiteSettings, type CarouselSlide } from "../../lib/settings";

type Tab = "products" | "store" | "carousel" | "colors";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [designOptions, setDesignOptions] = useState<DesignOptionRow[]>([]);
  const [variantCounts, setVariantCounts] = useState<Record<number, number>>({});
  const [confirmTarget, setConfirmTarget] = useState<{ type: "garment" | "design"; id: number } | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const [variantDesign, setVariantDesign] = useState<DesignOptionRow | null>(null);
  const [variants, setVariants] = useState<DesignVariantRow[]>([]);
  const [variantForm, setVariantForm] = useState<Partial<DesignVariantRow> | null>(null);

  useEffect(() => {
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading garments:", error);
      if (data) setGarments(data);
    });
    supabase.from("design_options").select("*").order("id").then(async ({ data, error }) => {
      if (error) console.error("Error loading designs:", error);
      if (data) {
        setDesignOptions(data);
        const counts: Record<number, number> = {};
        for (const d of data) {
          const { count } = await supabase.from("design_variants").select("id", { count: "exact", head: true }).eq("design_option_id", d.id);
          counts[d.id] = count ?? 0;
        }
        setVariantCounts(counts);
      }
    });
    getSettings().then(setSettings);
    getSlides().then(setSlides);
  }, []);

  const deleteGarment = async (id: number) => {
    const { error } = await supabase.from("garments").delete().eq("id", id);
    if (error) { console.error("Error deleting garment:", error); return; }
    setGarments((prev) => prev.filter((g) => g.id !== id));
    setConfirmTarget(null);
  };

  const deleteDesign = async (id: number) => {
    await supabase.from("design_variants").delete().eq("design_option_id", id);
    const { error } = await supabase.from("design_options").delete().eq("id", id);
    if (error) { console.error("Error deleting design:", error); return; }
    setDesignOptions((prev) => prev.filter((d) => d.id !== id));
    setConfirmTarget(null);
  };

  const openVariants = async (d: DesignOptionRow) => {
    setVariantDesign(d);
    const { data } = await supabase.from("design_variants").select("*").eq("design_option_id", d.id).order("sort_order");
    setVariants(data ?? []);
    setVariantForm(null);
  };

  const addVariant = () => {
    setVariantForm({
      design_option_id: variantDesign!.id, name: "", svg_content: "",
      additional_price: 0, positions: ["small_front", "large_front", "small_back", "large_back"],
      sort_order: variants.length,
    });
  };

  const editVariant = (v: DesignVariantRow) => {
    setVariantForm({ ...v });
  };

  const saveVariant = async () => {
    if (!variantForm || !variantForm.name) return;
    const payload = {
      name: variantForm.name, svg_content: variantForm.svg_content ?? "",
      image_url: variantForm.image_url ?? "", additional_price: variantForm.additional_price ?? 0,
      positions: variantForm.positions ?? [], sort_order: variantForm.sort_order ?? 0,
    };
    if (variantForm.id) {
      await supabase.from("design_variants").update(payload).eq("id", variantForm.id);
    } else {
      await supabase.from("design_variants").insert({ ...payload, design_option_id: variantDesign!.id }).select().single();
    }
    const { data } = await supabase.from("design_variants").select("*").eq("design_option_id", variantDesign!.id).order("sort_order");
    setVariants(data ?? []);
    setVariantForm(null);
  };

  const deleteVariant = async (id: number) => {
    await supabase.from("design_variants").delete().eq("id", id);
    setVariants((prev) => prev.filter((v) => v.id !== id));
    setVariantForm(null);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    applyColors(settings);
    setSaving(false);
  };

  return (
    <div className="admin-page">
      <ConfirmModal
        open={confirmTarget !== null}
        title={confirmTarget?.type === "garment" ? "Eliminar prenda" : "Eliminar diseño"}
        message={confirmTarget?.type === "garment" ? "¿Eliminar esta prenda? Esta acción no se puede deshacer." : "¿Eliminar este diseño? Esta acción no se puede deshacer."}
        onConfirm={() => {
          if (!confirmTarget) return;
          if (confirmTarget.type === "garment") deleteGarment(confirmTarget.id);
          else deleteDesign(confirmTarget.id);
        }}
        onCancel={() => setConfirmTarget(null)}
      />

      <div className="admin-topbar">
        <h1>Admin</h1>
        <nav className="admin-nav">
          {(["products", "store", "carousel", "colors"] as const).map((t) => (
            <button
              key={t}
              className={`admin-nav__tab${tab === t ? " admin-nav__tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "products" ? "Productos" : t === "store" ? "Tienda" : t === "carousel" ? "Carrusel" : "Colores"}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={logout}>Cerrar sesión</button>
      </div>

      {tab === "products" && (
        <>
          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Prendas</h2>
              <button className="btn-back" onClick={() => navigate("/admin/garments/new")}>
                + Nueva
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Precio</th>
                  <th>Etiquetas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {garments.map((g) => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{g.slug}</td>
                    <td>${Number(g.base_price).toLocaleString("es-AR")}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {(g.tags ?? []).join(", ")}
                    </td>
                    <td className="admin-actions">
                      <button className="btn-small" onClick={() => navigate(`/admin/garments/${g.id}/edit`)}>Editar</button>
                      <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "garment", id: g.id })}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Diseños</h2>
              <button className="btn-back" onClick={() => navigate("/admin/designs/new")}>
                + Nuevo
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Variantes</th>
                  <th>Precio base</th>
                  <th>Etiquetas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {designOptions.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{variantCounts[d.id] ?? 0}</td>
                    <td>${Number(d.base_price).toLocaleString("es-AR")}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {(d.tags ?? []).join(", ")}
                    </td>
                    <td className="admin-actions">
                      <button className="btn-small" onClick={() => openVariants(d)}>Variantes</button>
                      <button className="btn-small" onClick={() => navigate(`/admin/designs/${d.id}/edit`)}>Editar</button>
                      <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "design", id: d.id })}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        {variantDesign && (
          <div className="modal-overlay" onClick={() => setVariantDesign(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-section-header">
                <h3>Variantes · {variantDesign.name}</h3>
                <button className="btn-back" onClick={() => setVariantDesign(null)}>Cerrar</button>
              </div>

              {variantForm && (
                <div className="admin-variant-form">
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <input className="admin-input" style={{ flex: 1 }} value={variantForm.name ?? ""}
                      onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })} placeholder="Nombre" />
                    <input className="admin-input" type="number" style={{ width: 120 }} value={variantForm.additional_price ?? 0}
                      onChange={(e) => setVariantForm({ ...variantForm, additional_price: parseFloat(e.target.value) || 0 })} placeholder="$" />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
                    <input type="file" accept=".svg" style={{ flex: 1 }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setVariantForm({ ...variantForm, svg_content: await file.text() });
                      }} />
                    {variantForm.svg_content && (
                      <button className="btn-small btn-small--danger" onClick={() => setVariantForm({ ...variantForm, svg_content: "" })}>Quitar</button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={saveVariant}>
                      {variantForm.id ? "Actualizar" : "Agregar"} variante
                    </button>
                    <button className="btn-small" onClick={() => setVariantForm(null)}>Cancelar</button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {variants.map((v) => (
                  <div key={v.id} className="variant-card">
                    {v.svg_content && (
                      <div className="variant-card__svg"
                        dangerouslySetInnerHTML={{ __html: v.svg_content.replace(/currentColor/gi, "var(--accent)") }} />
                    )}
                    <div className="variant-card__info">
                      <strong>{v.name}</strong>
                      <span>+${Number(v.additional_price).toLocaleString("es-AR")}</span>
                      <small>{(v.positions ?? []).join(", ")}</small>
                    </div>
                    <div className="variant-card__actions">
                      <button className="btn-small" onClick={() => editVariant(v)}>Editar</button>
                      <button className="btn-small btn-small--danger" onClick={() => deleteVariant(v.id)}>X</button>
                    </div>
                  </div>
                ))}
                {!variantForm && (
                  <button className="btn-back" onClick={addVariant}>+ Agregar variante</button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
      )}
      {tab === "store" && settings && (
        <div className="admin-form">
          <label className="admin-label">Título de la tienda</label>
          <input className="admin-input" value={settings.store_title} onChange={(e) => setSettings({ ...settings, store_title: e.target.value })} />

          <label className="admin-label">Subtítulo</label>
          <input className="admin-input" value={settings.store_subtitle} onChange={(e) => setSettings({ ...settings, store_subtitle: e.target.value })} />

          <label className="admin-label">Logo</label>
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadImage(file, `logo/${Date.now()}-${file.name}`);
            if (url) setSettings({ ...settings, logo_url: url });
          }} />
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="admin-preview-img" style={{ width: 120, height: "auto", marginTop: 8 }} />
          )}

          <label className="admin-label">Título de colecciones</label>
          <input className="admin-input" value={settings.collections_title} onChange={(e) => setSettings({ ...settings, collections_title: e.target.value })} />

          <label className="admin-label">Subtítulo de colecciones</label>
          <input className="admin-input" value={settings.collections_subtitle} onChange={(e) => setSettings({ ...settings, collections_subtitle: e.target.value })} />

          <button className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}

      {tab === "carousel" && (
        <div className="admin-form">
          {slides.map((slide, i) => (
            <div key={slide.id} className="admin-carousel-slide">
              <h3 className="admin-carousel-slide__title">Slide {i + 1}</h3>

              <label className="admin-label">Layout</label>
              <select className="admin-input" value={slide.layout} onChange={(e) => {
                const copy = [...slides];
                copy[i] = { ...copy[i], layout: e.target.value as "full" | "double" };
                setSlides(copy);
              }}>
                <option value="full">Completa</option>
                <option value="double">Doble</option>
              </select>

              <label className="admin-label">Imagen 1</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file, `carousel/slide-${slide.id}-1-${Date.now()}`);
                if (url) {
                  const copy = [...slides];
                  copy[i] = { ...copy[i], image_1_url: url };
                  setSlides(copy);
                }
              }} />
              {slide.image_1_url && <img src={slide.image_1_url} alt="" className="admin-preview-img" style={{ width: 200, height: "auto", marginTop: 8 }} />}

              {slide.layout === "double" && (
                <>
                  <label className="admin-label">Imagen 2</label>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file, `carousel/slide-${slide.id}-2-${Date.now()}`);
                    if (url) {
                      const copy = [...slides];
                      copy[i] = { ...copy[i], image_2_url: url };
                      setSlides(copy);
                    }
                  }} />
                  {slide.image_2_url && <img src={slide.image_2_url} alt="" className="admin-preview-img" style={{ width: 200, height: "auto", marginTop: 8 }} />}
                </>
              )}

              <label className="admin-label">Texto overlay</label>
              <textarea className="admin-input admin-textarea" value={slide.text_overlay} onChange={(e) => {
                const copy = [...slides];
                copy[i] = { ...copy[i], text_overlay: e.target.value };
                setSlides(copy);
              }} placeholder="NUEVA\nCOLECCIÓN" style={{ fontFamily: "monospace", fontSize: "0.75rem" }} />

              <label className="admin-label">Subtítulo</label>
              <input className="admin-input" value={slide.subtitle} onChange={(e) => {
                const copy = [...slides];
                copy[i] = { ...copy[i], subtitle: e.target.value };
                setSlides(copy);
              }} />
            </div>
          ))}
          <button className="btn-primary" onClick={async () => {
            setSaving(true);
            for (const slide of slides) {
              await saveSlide(slide.id, slide);
            }
            setSaving(false);
          }} disabled={saving}>
            {saving ? "Guardando..." : "Guardar carrusel"}
          </button>
        </div>
      )}

      {tab === "colors" && settings && (
        <div className="admin-form">
          <div className="admin-color-row">
            <label className="admin-label">Fondo</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_bg} onChange={(e) => setSettings({ ...settings, color_bg: e.target.value })} />
            <code className="admin-color-hex">{settings.color_bg}</code>
          </div>
          <div className="admin-color-row">
            <label className="admin-label">Superficie</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_surface} onChange={(e) => setSettings({ ...settings, color_surface: e.target.value })} />
            <code className="admin-color-hex">{settings.color_surface}</code>
          </div>
          <div className="admin-color-row">
            <label className="admin-label">Texto</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_text} onChange={(e) => setSettings({ ...settings, color_text: e.target.value })} />
            <code className="admin-color-hex">{settings.color_text}</code>
          </div>
          <div className="admin-color-row">
            <label className="admin-label">Acento</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_accent} onChange={(e) => setSettings({ ...settings, color_accent: e.target.value })} />
            <code className="admin-color-hex">{settings.color_accent}</code>
          </div>

          <div className="admin-color-preview" style={{
            background: settings.color_bg,
            padding: "1.5rem",
            borderRadius: "var(--radius)",
            marginTop: "1rem",
          }}>
            <div style={{
              background: settings.color_surface,
              padding: "1rem",
              borderRadius: "var(--radius-sm)",
              border: `1px solid rgba(255,255,255,0.08)`,
            }}>
              <p style={{ color: settings.color_accent, fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.04em", margin: "0 0 0.5rem" }}>Preview</p>
              <p style={{ color: settings.color_text, fontSize: "0.875rem", margin: 0 }}>Texto de ejemplo con el color seleccionado</p>
            </div>
          </div>

          <button className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
            {saving ? "Guardando..." : "Guardar colores"}
          </button>
        </div>
      )}
    </div>
  );
}
