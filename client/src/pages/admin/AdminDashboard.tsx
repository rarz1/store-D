import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type GarmentRow, type EstampadoRow, type DisenoTipoRow, type EstampadoSizeRow, type EstampadoLocationRow } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import ConfirmModal from "../../components/ConfirmModal";
import { getSettings, saveSettings, getSlides, saveSlide, uploadImage, applyColors, type SiteSettings, type CarouselSlide } from "../../lib/settings";

type Tab = "products" | "disenos" | "store" | "carousel" | "colors";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [designOptions, setDesignOptions] = useState<DesignOptionRow[]>([]);
  const [variantCounts, setVariantCounts] = useState<Record<number, number>>({});
  const [confirmTarget, setConfirmTarget] = useState<{ type: "garment" | "estampado" | "diseno_tipo"; id: number; parentId?: number } | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [saving, setSaving] = useState(false);

  const [estampados, setEstampados] = useState<EstampadoRow[]>([]);
  const [estampadoForm, setEstampadoForm] = useState<Partial<EstampadoRow> | null>(null);

  const [tiposByClase, setTiposByClase] = useState<Record<number, DisenoTipoRow[]>>({});
  const [expandedClase, setExpandedClase] = useState<number | null>(null);
  const [tipoForm, setTipoForm] = useState<Partial<DisenoTipoRow> | null>(null);

  const [estampadoSizes, setEstampadoSizes] = useState<EstampadoSizeRow[]>([]);
  const [estampadoLocations, setEstampadoLocations] = useState<EstampadoLocationRow[]>([]);

  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  const [editingSizeData, setEditingSizeData] = useState<Partial<EstampadoSizeRow> | null>(null);

  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [editingLocationData, setEditingLocationData] = useState<Partial<EstampadoLocationRow> | null>(null);

  const [newLocationForm, setNewLocationForm] = useState<Partial<EstampadoLocationRow> | null>(null);

  const [newSizeForm, setNewSizeForm] = useState<Partial<EstampadoSizeRow> | null>(null);

  const [tipoError, setTipoError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading garments:", error);
      if (data) setGarments(data);
    });
    getSettings().then(setSettings);
    getSlides().then(setSlides);
    supabase.from("estampados").select("*").order("sort_order").then(({ data, error }) => {
      if (error) console.error("Error loading estampados:", error);
      if (data) setEstampados(data);
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

  const loadTipos = async (claseId: number) => {
    const { data } = await supabase.from("diseno_tipos").select("*").eq("estampado_id", claseId).order("sort_order");
    if (data) setTiposByClase((prev) => ({ ...prev, [claseId]: data }));
  };

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

  const deleteEstampado = async (id: number) => {
    const { error } = await supabase.from("estampados").delete().eq("id", id);
    if (error) { console.error("Error deleting estampado:", error); return; }
    setEstampados((prev) => prev.filter((e) => e.id !== id));
    setConfirmTarget(null);
    setEstampadoForm(null);
    setExpandedClase(null);
  };

  const deleteTipo = async (id: number, claseId: number) => {
    await supabase.from("diseno_tipos").delete().eq("id", id);
    setTiposByClase((prev) => ({
      ...prev,
      [claseId]: (prev[claseId] ?? []).filter((t) => t.id !== id),
    }));
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

  return (
    <div className="admin-page">
      <ConfirmModal
        open={confirmTarget !== null}
        title={confirmTarget?.type === "garment" ? "Eliminar prenda" : confirmTarget?.type === "estampado" ? "Eliminar clase" : "Eliminar tipo"}
        message={confirmTarget?.type === "garment" ? "¿Eliminar esta prenda? Esta acción no se puede deshacer." : confirmTarget?.type === "estampado" ? "¿Eliminar esta clase de diseño? También se eliminarán sus tipos." : "¿Eliminar este tipo de diseño?"}
        onConfirm={() => {
          if (!confirmTarget) return;
          if (confirmTarget.type === "garment") deleteGarment(confirmTarget.id);
          else if (confirmTarget.type === "estampado") deleteEstampado(confirmTarget.id);
          else if (confirmTarget.type === "diseno_tipo") deleteTipo(confirmTarget.id, confirmTarget.parentId!);
        }}
        onCancel={() => setConfirmTarget(null)}
      />

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
              <h2>Tamaños de estampado</h2>
              <button className="btn-back" onClick={() => setNewSizeForm({ name: "", slug: "", width_percent: 50, price_increment: 0, sort_order: estampadoSizes.length })}>
                + Agregar
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr><th>Nombre</th><th>Tamaño %</th><th>Incremento $</th><th>Orden</th><th></th></tr>
              </thead>
              <tbody>
                {estampadoSizes.map((s) => (
                  <tr key={s.id}>
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
                <tr><th>Nombre</th><th>Position key</th><th>Incremento $</th><th>Orden</th><th></th></tr>
              </thead>
              <tbody>
                {estampadoLocations.map((l) => (
                  <tr key={l.id}>
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
      {tab === "disenos" && (
        <>
          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Clases de diseño</h2>
              <button className="btn-back" onClick={() => { setEstampadoForm({ name: "", description: "", active: true, tags: [], sort_order: estampados.length }); setExpandedClase(null); setTipoForm(null); }}>
                + Nueva clase
              </button>
            </div>
            {estampadoForm && !expandedClase && !tipoForm && (
              <div className="admin-form">
                <label className="admin-label">Nombre</label>
                <input className="admin-input" value={estampadoForm.name ?? ""} onChange={(e) => setEstampadoForm({ ...estampadoForm, name: e.target.value })} />
                <label className="admin-label">Descripción</label>
                <input className="admin-input" value={estampadoForm.description ?? ""} onChange={(e) => setEstampadoForm({ ...estampadoForm, description: e.target.value })} />
                <label className="admin-label">Tags (separados por coma)</label>
                <input className="admin-input" value={Array.isArray(estampadoForm.tags) ? estampadoForm.tags.join(", ") : ""} onChange={(e) => setEstampadoForm({ ...estampadoForm, tags: e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean) })} />
                <label className="admin-label">Orden</label>
                <input className="admin-input" type="number" value={estampadoForm.sort_order ?? 0} onChange={(e) => setEstampadoForm({ ...estampadoForm, sort_order: parseInt(e.target.value) || 0 })} />
                <label className="admin-label"><input type="checkbox" checked={estampadoForm.active ?? true} onChange={(e) => setEstampadoForm({ ...estampadoForm, active: e.target.checked })} />{" Activo"}</label>
                <div className="admin-form-actions">
                  <button className="btn-back" onClick={() => setEstampadoForm(null)}>Cancelar</button>
                  <button className="btn-primary" disabled={!estampadoForm.name || saving}
                    onClick={async () => {
                      if (!estampadoForm.name) return; setSaving(true);
                      const p = { name: estampadoForm.name, description: estampadoForm.description ?? "", svg_content: "", image_url: "", active: estampadoForm.active ?? true, tags: estampadoForm.tags ?? [], sort_order: estampadoForm.sort_order ?? 0 };
                      let err: any;
                      if (estampadoForm.id) {
                        const { error } = await supabase.from("estampados").update(p).eq("id", estampadoForm.id);
                        err = error;
                      } else {
                        const { error } = await supabase.from("estampados").insert(p);
                        err = error;
                      }
                      if (err) { console.error("Error saving estampado:", err); setSaving(false); return; }
                      setSaving(false); setEstampadoForm(null);
                      const { data } = await supabase.from("estampados").select("*").order("sort_order");
                      if (data) setEstampados(data);
                    }}
                  >{estampadoForm.id ? "Guardar" : "Crear"}</button>
                </div>
              </div>
            )}
            {!estampadoForm && (
              <table className="admin-table">
                <thead><tr><th>Nombre</th><th>Tags</th><th>Activo</th><th>Tipos</th><th>Orden</th><th></th></tr></thead>
                <tbody>
                  {estampados.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No hay clases de diseño</td></tr>}
                  {estampados.map((e) => (
                    <React.Fragment key={e.id}>
                      <tr>
                        <td>{e.name}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{(e.tags ?? []).join(", ")}</td>
                        <td>{e.active ? "✓" : "✕"}</td>
                        <td>{(tiposByClase[e.id] ?? []).length}</td>
                        <td>{e.sort_order}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="btn-small" onClick={async () => {
                              if (expandedClase === e.id) { setExpandedClase(null); setTipoForm(null); return; }
                              setExpandedClase(e.id); setTipoForm(null);
                              if (!tiposByClase[e.id]) await loadTipos(e.id);
                            }}>{expandedClase === e.id ? "−" : "+"} Tipos</button>
                            <button className="btn-small" onClick={() => { setEstampadoForm(e); setExpandedClase(null); setTipoForm(null); }}>Editar</button>
                            <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "estampado", id: e.id })}>✕</button>
                          </div>
                        </td>
                      </tr>
                      {expandedClase === e.id && (
                        <tr key={`tipos-${e.id}`}>
                          <td colSpan={6} style={{ padding: "0.5rem 1rem 1rem", background: "var(--surface)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <strong style={{ fontSize: "0.85rem" }}>Tipos de {e.name}</strong>
                              <button className="btn-back" onClick={() => setTipoForm({ estampado_id: e.id, name: "", description: "", svg_content: "", image_url: "", sort_order: (tiposByClase[e.id] ?? []).length })}>
                                + Nuevo tipo
                              </button>
                            </div>
                            {tipoForm && tipoForm.estampado_id === e.id && (
                              <div className="admin-form" style={{ marginBottom: "0.75rem" }}>
                                <label className="admin-label">Nombre</label>
                                <input className="admin-input" value={tipoForm.name ?? ""} onChange={(e2) => { setTipoError(null); setTipoForm({ ...tipoForm, name: e2.target.value }); }} />
                                <label className="admin-label">Descripción</label>
                                <input className="admin-input" value={tipoForm.description ?? ""} onChange={(e2) => setTipoForm({ ...tipoForm, description: e2.target.value })} />
                                <label className="admin-label">SVG</label>
                                <textarea className="admin-textarea" rows={4} value={tipoForm.svg_content ?? ""} onChange={(e2) => setTipoForm({ ...tipoForm, svg_content: e2.target.value })} />
                                <label className="admin-label">URL imagen (opcional)</label>
                                <input className="admin-input" value={tipoForm.image_url ?? ""} onChange={(e2) => setTipoForm({ ...tipoForm, image_url: e2.target.value })} />
                                {tipoError && <p className="admin-error">{tipoError}</p>}
                                <div className="admin-form-actions">
                                  <button className="btn-back" onClick={() => { setTipoForm(null); setTipoError(null); }}>Cancelar</button>
                                  <button className="btn-primary" disabled={!tipoForm.name || saving}
                                    onClick={async () => {
                                      if (!tipoForm.name) return; setSaving(true); setTipoError(null);
                                      const p = { estampado_id: e.id, name: tipoForm.name, description: tipoForm.description ?? "", svg_content: tipoForm.svg_content ?? "", image_url: tipoForm.image_url ?? "", sort_order: tipoForm.sort_order ?? 0 };
                                      let err: any;
                                      if (tipoForm.id) {
                                        const { error } = await supabase.from("diseno_tipos").update(p).eq("id", tipoForm.id);
                                        err = error;
                                      } else {
                                        const { error } = await supabase.from("diseno_tipos").insert(p);
                                        err = error;
                                      }
                                      if (err) { console.error("Error saving tipo:", err); setTipoError(err.message || "Error al guardar"); setSaving(false); return; }
                                      setSaving(false); setTipoForm(null);
                                      await loadTipos(e.id);
                                    }}
                                  >{tipoForm.id ? "Guardar" : "Crear"}</button>
                                </div>
                              </div>
                            )}
                            {(tiposByClase[e.id] ?? []).length === 0 && !tipoForm && (
                              <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem" }}>Esta clase no tiene tipos todavía</p>
                            )}
                            {(tiposByClase[e.id] ?? []).map((t) => (
                              <div key={t.id} className="admin-row" style={{ marginBottom: "0.25rem" }}>
                                <div style={{ flex: 1 }}>
                                  <strong style={{ fontSize: "0.85rem" }}>{t.name}</strong>
                                  {t.description && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{t.description}</span>}
                                </div>
                                {t.svg_content && (
                                  <div style={{ width: 28, height: 28, color: "var(--accent)", marginRight: "0.5rem" }}
                                    dangerouslySetInnerHTML={{ __html: t.svg_content.replace(/currentColor/gi, "var(--accent)") }} />
                                )}
                                <button className="btn-small" onClick={() => setTipoForm(t)}>Editar</button>
                                <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "diseno_tipo", id: t.id, parentId: e.id })}>✕</button>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
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
