import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type GarmentRow, type EstampadoSizeRow, type EstampadoLocationRow } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import ConfirmModal from "../../components/ConfirmModal";
import AdminDesignsTab from "./AdminDesignsTab";
import { getSettings, saveSettings, getSlides, saveSlide, uploadImage, applyColors, type SiteSettings, type CarouselSlide } from "../../lib/settings";

type Tab = "products" | "disenos" | "store" | "carousel" | "colors";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("products");
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<{ type: "garment" | "bulk-garments"; id?: number; ids?: number[] } | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedGarments, setSelectedGarments] = useState<Set<number>>(new Set());
  const [draggedSizeId, setDraggedSizeId] = useState<number | null>(null);
  const [draggedLocationId, setDraggedLocationId] = useState<number | null>(null);

  const [disenosCount, setDisenosCount] = useState(0);

  const [estampadoSizes, setEstampadoSizes] = useState<EstampadoSizeRow[]>([]);
  const [estampadoLocations, setEstampadoLocations] = useState<EstampadoLocationRow[]>([]);

  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  const [editingSizeData, setEditingSizeData] = useState<Partial<EstampadoSizeRow> | null>(null);

  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [editingLocationData, setEditingLocationData] = useState<Partial<EstampadoLocationRow> | null>(null);

  const [newLocationForm, setNewLocationForm] = useState<Partial<EstampadoLocationRow> | null>(null);

  const [newSizeForm, setNewSizeForm] = useState<Partial<EstampadoSizeRow> | null>(null);

  useEffect(() => {
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading garments:", error);
      if (data) setGarments(data);
    });
    getSettings().then(setSettings);
    getSlides().then(setSlides);
    supabase.from("estampados").select("id").then(({ data, error }) => {
      if (error) console.error("Error loading estampados:", error);
      if (data) setDisenosCount(data.length);
    });
    supabase.from("estampado_sizes").select("*").order("sort_order").then(({ data, error }) => {
      if (error) console.error("Error loading sizes:", error);
      if (data) setEstampadoSizes(data);
    });
    supabase.from("estampado_locations").select("*").order("sort_order").then(({ data, error }) => {
      if (error) console.error("Error loading locations:", error);
      if (data) setEstampadoLocations(data);
    });
  }, []);

  const deleteGarment = async (id: number) => {
    const { error } = await supabase.from("garments").delete().eq("id", id);
    if (error) { console.error("Error deleting garment:", error); return; }
    setGarments((prev) => prev.filter((g) => g.id !== id));
    setConfirmTarget(null);
  };

  const toggleGarmentSelection = (id: number) => {
    setSelectedGarments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteBulkGarments = async () => {
    const ids = [...selectedGarments];
    if (ids.length === 0) return;
    const { error } = await supabase.from("garments").delete().in("id", ids);
    if (error) { console.error("Error deleting garments:", error); return; }
    setGarments((prev) => prev.filter((g) => !ids.includes(g.id)));
    setSelectedGarments(new Set());
    setConfirmTarget(null);
  };

  const startEditSize = (s: EstampadoSizeRow) => {
    setEditingSizeId(s.id);
    setEditingSizeData({ name: s.name, width_percent: s.width_percent, price_increment: s.price_increment, sort_order: s.sort_order });
  };

  const saveSizeEdit = async () => {
    if (editingSizeId === null || !editingSizeData) return;
    const { error } = await supabase.from("estampado_sizes").update(editingSizeData).eq("id", editingSizeId);
    if (error) { console.error("Error saving size:", error); return; }
    setEstampadoSizes((prev) => prev.map((s) => s.id === editingSizeId ? { ...s, ...editingSizeData } as EstampadoSizeRow : s));
    setEditingSizeId(null);
    setEditingSizeData(null);
  };

  const startEditLocation = (l: EstampadoLocationRow) => {
    setEditingLocationId(l.id);
    setEditingLocationData({ name: l.name, price_increment: l.price_increment, sort_order: l.sort_order, position_key: l.position_key });
  };

  const saveLocationEdit = async () => {
    if (editingLocationId === null || !editingLocationData) return;
    const { error } = await supabase.from("estampado_locations").update(editingLocationData).eq("id", editingLocationId);
    if (error) { console.error("Error saving location:", error); return; }
    setEstampadoLocations((prev) => prev.map((l) => l.id === editingLocationId ? { ...l, ...editingLocationData } as EstampadoLocationRow : l));
    setEditingLocationId(null);
    setEditingLocationData(null);
  };

  const addLocation = async () => {
    if (!newLocationForm?.name) return;
    const p = { name: newLocationForm.name, slug: newLocationForm.slug ?? newLocationForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"), description: newLocationForm.description ?? "", position_key: newLocationForm.position_key ?? newLocationForm.slug ?? "", price_increment: newLocationForm.price_increment ?? 0, sort_order: newLocationForm.sort_order ?? estampadoLocations.length };
    const { data, error } = await supabase.from("estampado_locations").insert(p).select();
    if (error) { console.error("Error adding location:", error); return; }
    if (data) setEstampadoLocations((prev) => [...prev, data[0] as EstampadoLocationRow]);
    setNewLocationForm(null);
  };

  const addSize = async () => {
    if (!newSizeForm?.name) return;
    const p = { name: newSizeForm.name, slug: newSizeForm.slug ?? newSizeForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"), description: "", width_percent: newSizeForm.width_percent ?? 50, price_increment: newSizeForm.price_increment ?? 0, sort_order: newSizeForm.sort_order ?? estampadoSizes.length };
    const { data, error } = await supabase.from("estampado_sizes").insert(p).select();
    if (error) { console.error("Error adding size:", error); return; }
    if (data) setEstampadoSizes((prev) => [...prev, data[0] as EstampadoSizeRow]);
    setNewSizeForm(null);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    applyColors(settings);
    setSaving(false);
  };

  const reorderList = <T extends { id: number; sort_order: number }>(list: T[], fromId: number, toId: number): T[] => {
    const from = list.findIndex((x) => x.id === fromId);
    const to = list.findIndex((x) => x.id === toId);
    if (from < 0 || to < 0 || from === to) return list;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next.map((x, i) => ({ ...x, sort_order: i }));
  };

  const handleSizeDrop = async (toId: number) => {
    if (draggedSizeId === null || draggedSizeId === toId) return;
    const next = reorderList(estampadoSizes, draggedSizeId, toId);
    setDraggedSizeId(null);
    setEstampadoSizes(next);
    for (const s of next) {
      await supabase.from("estampado_sizes").update({ sort_order: s.sort_order }).eq("id", s.id);
    }
  };

  const handleLocationDrop = async (toId: number) => {
    if (draggedLocationId === null || draggedLocationId === toId) return;
    const next = reorderList(estampadoLocations, draggedLocationId, toId);
    setDraggedLocationId(null);
    setEstampadoLocations(next);
    for (const l of next) {
      await supabase.from("estampado_locations").update({ sort_order: l.sort_order }).eq("id", l.id);
    }
  };

  return (
    <div className="admin-page">
       <ConfirmModal
         open={confirmTarget !== null}
         title={confirmTarget?.type === "garment" ? "Eliminar prenda" : "Eliminar prendas"}
         message={confirmTarget?.type === "garment" ? "¿Eliminar esta prenda? Esta acción no se puede deshacer." : `¿Eliminar ${confirmTarget?.ids?.length ?? 0} prendas seleccionadas? Esta acción no se puede deshacer.`}
         onConfirm={() => {
           if (!confirmTarget) return;
           if (confirmTarget.type === "garment") deleteGarment(confirmTarget.id!);
           else if (confirmTarget.type === "bulk-garments") deleteBulkGarments();
         }}
         onCancel={() => setConfirmTarget(null)}
       />

       {/* Metrics Overview */}
       <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
         <div style={{ flex: 1, minWidth: 120, padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)" }}>
           <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Productos</span>
           <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--accent)", margin: "0.25rem 0 0", letterSpacing: "0.04em" }}>{garments.length}</p>
         </div>
         <div style={{ flex: 1, minWidth: 120, padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)" }}>
           <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Diseños</span>
           <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--accent)", margin: "0.25rem 0 0", letterSpacing: "0.04em" }}>{disenosCount}</p>
         </div>
         <div style={{ flex: 1, minWidth: 120, padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)" }}>
           <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Tallas</span>
           <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--accent)", margin: "0.25rem 0 0", letterSpacing: "0.04em" }}>{estampadoSizes.length}</p>
         </div>
         <div style={{ flex: 1, minWidth: 120, padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)" }}>
           <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ubicaciones</span>
           <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--accent)", margin: "0.25rem 0 0", letterSpacing: "0.04em" }}>{estampadoLocations.length}</p>
         </div>
       </div>

       <div className="admin-topbar">
        <h1>Admin</h1>
        <nav className="admin-nav">
          {(["products", "disenos", "store", "carousel", "colors"] as const).map((t) => (
            <button
              key={t}
              className={`admin-nav__tab${tab === t ? " admin-nav__tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "products" ? "Productos" : t === "disenos" ? "Diseños" : t === "store" ? "Tienda" : t === "carousel" ? "Carrusel" : "Colores"}
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
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todas las prendas"
                      checked={garments.length > 0 && selectedGarments.size === garments.length}
                      onChange={(e) => setSelectedGarments(e.target.checked ? new Set(garments.map((g) => g.id)) : new Set())}
                    />
                  </th>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Precio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {garments.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${g.name}`}
                        checked={selectedGarments.has(g.id)}
                        onChange={() => toggleGarmentSelection(g.id)}
                      />
                    </td>
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
            {selectedGarments.size > 0 && (
              <div className="admin-bulk-bar">
                <span className="admin-bulk-bar__count">{selectedGarments.size} seleccionadas</span>
                <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "bulk-garments", ids: [...selectedGarments] })}>
                  Eliminar seleccionadas
                </button>
              </div>
            )}
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Tamaños de estampado</h2>
              <button className="btn-back" onClick={() => setNewSizeForm({ name: "", slug: "", width_percent: 50, price_increment: 0, sort_order: estampadoSizes.length })}>
                + Agregar
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr><th style={{ width: 32 }}></th><th>Nombre</th><th>Tamaño %</th><th>Incremento $</th><th>Orden</th><th></th></tr>
              </thead>
              <tbody>
                {estampadoSizes.map((s) => (
                  <tr
                    key={s.id}
                    draggable={editingSizeId !== s.id}
                    className={draggedSizeId === s.id ? "admin-row--dragging" : ""}
                    onDragStart={() => setDraggedSizeId(s.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleSizeDrop(s.id)}
                    onDragEnd={() => setDraggedSizeId(null)}
                  >
                    <td className="admin-row__handle" aria-hidden="true">⋮⋮</td>
                    {editingSizeId === s.id && editingSizeData ? (
                      <>
                        <td><input className="admin-input" value={editingSizeData.name ?? ""} onChange={(e) => setEditingSizeData({ ...editingSizeData, name: e.target.value })} /></td>
                        <td><input className="admin-input admin-input--sm" type="number" value={editingSizeData.width_percent ?? 0} onChange={(e) => setEditingSizeData({ ...editingSizeData, width_percent: parseInt(e.target.value) || 0 })} /></td>
                        <td><input className="admin-input admin-input--sm" type="number" value={editingSizeData.price_increment ?? 0} onChange={(e) => setEditingSizeData({ ...editingSizeData, price_increment: parseInt(e.target.value) || 0 })} /></td>
                        <td><input className="admin-input admin-input--sm" type="number" value={editingSizeData.sort_order ?? 0} onChange={(e) => setEditingSizeData({ ...editingSizeData, sort_order: parseInt(e.target.value) || 0 })} /></td>
                        <td className="admin-actions">
                          <button className="btn-small" onClick={saveSizeEdit}>Guardar</button>
                          <button className="btn-small btn-small--danger" onClick={() => { setEditingSizeId(null); setEditingSizeData(null); }}>X</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{s.name}</td>
                        <td>{s.width_percent}%</td>
                        <td>+${Number(s.price_increment).toLocaleString("es-AR")}</td>
                        <td>{s.sort_order}</td>
                        <td className="admin-actions">
                          <button className="btn-small" onClick={() => startEditSize(s)}>Editar</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {newSizeForm && (
              <div className="admin-form" style={{ marginTop: "0.75rem" }}>
                <label className="admin-label">Nombre</label>
                <input className="admin-input" value={newSizeForm.name ?? ""} onChange={(e) => setNewSizeForm({ ...newSizeForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") })} />
                <label className="admin-label">Tamaño %</label>
                <input className="admin-input admin-input--sm" type="number" value={newSizeForm.width_percent ?? 50} onChange={(e) => setNewSizeForm({ ...newSizeForm, width_percent: parseInt(e.target.value) || 0 })} />
                <label className="admin-label">Incremento $</label>
                <input className="admin-input admin-input--sm" type="number" value={newSizeForm.price_increment ?? 0} onChange={(e) => setNewSizeForm({ ...newSizeForm, price_increment: parseInt(e.target.value) || 0 })} />
                <div className="admin-form-actions">
                  <button className="btn-back" onClick={() => setNewSizeForm(null)}>Cancelar</button>
                  <button className="btn-primary" onClick={addSize} disabled={!newSizeForm.name}>Crear</button>
                </div>
              </div>
            )}
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Ubicaciones de estampado</h2>
              <button className="btn-back" onClick={() => setNewLocationForm({ name: "", slug: "", description: "", position_key: "", price_increment: 0, sort_order: estampadoLocations.length })}>
                + Agregar
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr><th style={{ width: 32 }}></th><th>Nombre</th><th>Position key</th><th>Incremento $</th><th>Orden</th><th></th></tr>
              </thead>
              <tbody>
                {estampadoLocations.map((l) => (
                  <tr
                    key={l.id}
                    draggable={editingLocationId !== l.id}
                    className={draggedLocationId === l.id ? "admin-row--dragging" : ""}
                    onDragStart={() => setDraggedLocationId(l.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleLocationDrop(l.id)}
                    onDragEnd={() => setDraggedLocationId(null)}
                  >
                    <td className="admin-row__handle" aria-hidden="true">⋮⋮</td>
                    {editingLocationId === l.id && editingLocationData ? (
                      <>
                        <td><input className="admin-input" value={editingLocationData.name ?? ""} onChange={(e) => setEditingLocationData({ ...editingLocationData, name: e.target.value })} /></td>
                        <td><input className="admin-input admin-input--sm" value={editingLocationData.position_key ?? ""} onChange={(e) => setEditingLocationData({ ...editingLocationData, position_key: e.target.value })} /></td>
                        <td><input className="admin-input admin-input--sm" type="number" value={editingLocationData.price_increment ?? 0} onChange={(e) => setEditingLocationData({ ...editingLocationData, price_increment: parseInt(e.target.value) || 0 })} /></td>
                        <td><input className="admin-input admin-input--sm" type="number" value={editingLocationData.sort_order ?? 0} onChange={(e) => setEditingLocationData({ ...editingLocationData, sort_order: parseInt(e.target.value) || 0 })} /></td>
                        <td className="admin-actions">
                          <button className="btn-small" onClick={saveLocationEdit}>Guardar</button>
                          <button className="btn-small btn-small--danger" onClick={() => { setEditingLocationId(null); setEditingLocationData(null); }}>X</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{l.name}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{l.position_key}</td>
                        <td>+${Number(l.price_increment).toLocaleString("es-AR")}</td>
                        <td>{l.sort_order}</td>
                        <td className="admin-actions">
                          <button className="btn-small" onClick={() => startEditLocation(l)}>Editar</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {newLocationForm && (
              <div className="admin-form" style={{ marginTop: "0.75rem" }}>
                <label className="admin-label">Nombre</label>
                <input className="admin-input" value={newLocationForm.name ?? ""} onChange={(e) => setNewLocationForm({ ...newLocationForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") })} />
                <label className="admin-label">Slug / Position key</label>
                <input className="admin-input" value={newLocationForm.position_key ?? newLocationForm.slug ?? ""} onChange={(e) => setNewLocationForm({ ...newLocationForm, position_key: e.target.value, slug: e.target.value })} />
                <label className="admin-label">Incremento $</label>
                <input className="admin-input admin-input--sm" type="number" value={newLocationForm.price_increment ?? 0} onChange={(e) => setNewLocationForm({ ...newLocationForm, price_increment: parseInt(e.target.value) || 0 })} />
                <div className="admin-form-actions">
                  <button className="btn-back" onClick={() => setNewLocationForm(null)}>Cancelar</button>
                  <button className="btn-primary" onClick={addLocation} disabled={!newLocationForm.name}>Crear</button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
      {tab === "disenos" && <AdminDesignsTab onStatsChange={setDisenosCount} />}
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
            const { url } = await uploadImage(file, `logo/${Date.now()}-${file.name}`);
            if (url) setSettings({ ...settings, logo_url: url });
          }} />
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="admin-preview-img" style={{ width: 120, height: "auto", marginTop: 8 }} />
          )}

          <label className="admin-label">Título de colecciones</label>
          <input className="admin-input" value={settings.collections_title} onChange={(e) => setSettings({ ...settings, collections_title: e.target.value })} />

          <label className="admin-label">Subtítulo de colecciones</label>
          <input className="admin-input" value={settings.collections_subtitle} onChange={(e) => setSettings({ ...settings, collections_subtitle: e.target.value })} />

          <label className="admin-label">Imagen de fondo de colecciones</label>
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const { url } = await uploadImage(file, `collections/banner-${Date.now()}`);
            if (url) setSettings({ ...settings, collections_banner_url: url });
          }} />
          {settings.collections_banner_url && (
            <img src={settings.collections_banner_url} alt="Fondo de colecciones" className="admin-preview-img" style={{ width: 200, height: "auto", marginTop: 8 }} />
          )}

          <label className="admin-label">Imagen de fondo de la página (detrás de las tarjetas)</label>
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const { url } = await uploadImage(file, `collections/page-bg-${Date.now()}`);
            if (url) setSettings({ ...settings, collections_bg_url: url });
          }} />
          {settings.collections_bg_url && (
            <img src={settings.collections_bg_url} alt="Fondo de la página" className="admin-preview-img" style={{ width: 200, height: "auto", marginTop: 8 }} />
          )}

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
                const { url, error } = await uploadImage(file, `carousel/slide-${slide.id}-1-${Date.now()}`);
                if (error) {
                  toast.error("Error al subir la imagen", error);
                  return;
                }
                if (url) {
                  const copy = [...slides];
                  copy[i] = { ...copy[i], image_1_url: url };
                  setSlides(copy);
                  toast.success("Imagen subida");
                }
              }} />
              {slide.image_1_url && <img src={slide.image_1_url} alt="" className="admin-preview-img" style={{ width: 200, height: "auto", marginTop: 8 }} />}

              {slide.layout === "double" && (
                <>
                  <label className="admin-label">Imagen 2</label>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { url, error } = await uploadImage(file, `carousel/slide-${slide.id}-2-${Date.now()}`);
                    if (error) {
                      toast.error("Error al subir la imagen", error);
                      return;
                    }
                    if (url) {
                      const copy = [...slides];
                      copy[i] = { ...copy[i], image_2_url: url };
                      setSlides(copy);
                      toast.success("Imagen subida");
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
            let firstError: string | null = null;
            for (const slide of slides) {
              const { ok, error } = await saveSlide(slide.id, slide);
              if (!ok) {
                firstError = error;
                console.error(`Error guardando slide ${slide.id}:`, error);
              }
            }
            setSaving(false);
            if (firstError) toast.error("No se pudo guardar el carrusel", firstError);
            else toast.success("Carrusel guardado");
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
