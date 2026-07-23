import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type GarmentRow, type DesignRow } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import ConfirmModal from "../../components/ConfirmModal";
import { getSettings, saveSettings, getSlides, saveSlide, uploadImage, applyColors, type SiteSettings, type CarouselSlide } from "../../lib/settings";

type Tab = "products" | "store" | "carousel" | "colors";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<{ type: "garment" | "design"; id: number } | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading garments:", error);
      if (data) setGarments(data);
    });
    supabase.from("designs").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading designs:", error);
      if (data) setDesigns(data);
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
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) { console.error("Error deleting design:", error); return; }
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    setConfirmTarget(null);
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {garments.map((g) => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{g.slug}</td>
                    <td>${Number(g.base_price).toLocaleString("es-AR")}</td>
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
                  <th>Vista previa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {designs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td style={{ width: 60 }}>
                      <div
                        className="design-card__svg"
                        style={{ width: 50, height: 55 }}
                        dangerouslySetInnerHTML={{ __html: d.svg_content.slice(0, 200) }}
                      />
                    </td>
                    <td className="admin-actions">
                      <button className="btn-small" onClick={() => navigate(`/admin/designs/${d.id}/edit`)}>Editar</button>
                      <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "design", id: d.id })}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
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
