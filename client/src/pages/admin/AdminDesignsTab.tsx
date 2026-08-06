import React, { useEffect, useRef, useState } from "react";
import { supabase, type EstampadoRow, type DisenoTipoRow } from "../../lib/supabase";
import { uploadImage } from "../../lib/settings";
import ConfirmModal from "../../components/ConfirmModal";
import TagInput from "../../components/admin/TagInput";

interface ConfirmTarget {
  type: "estampado" | "diseno_tipo" | "bulk-estampados";
  id?: number;
  parentId?: number;
  ids?: number[];
}

export default function AdminDesignsTab() {
  const [estampados, setEstampados] = useState<EstampadoRow[]>([]);
  const [estampadoForm, setEstampadoForm] = useState<Partial<EstampadoRow> | null>(null);
  const [tiposByClase, setTiposByClase] = useState<Record<number, DisenoTipoRow[]>>({});
  const [expandedClase, setExpandedClase] = useState<number | null>(null);
  const [tipoForm, setTipoForm] = useState<Partial<DisenoTipoRow> | null>(null);
  const [selectedDesigns, setSelectedDesigns] = useState<Set<number>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [tipoError, setTipoError] = useState<string | null>(null);
  const [claseError, setClaseError] = useState<string | null>(null);
  const tipoFormRef = useRef<Partial<DisenoTipoRow> | null>(null);
  tipoFormRef.current = tipoForm;

  useEffect(() => {
    loadEstampados();
  }, []);

  const loadEstampados = async () => {
    const { data } = await supabase.from("estampados").select("*").order("sort_order");
    if (data) setEstampados(data);
  };

  const loadTipos = async (claseId: number) => {
    const { data } = await supabase.from("diseno_tipos").select("*").eq("estampado_id", claseId).order("sort_order");
    if (data) setTiposByClase((prev) => ({ ...prev, [claseId]: data }));
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
    const { error } = await supabase.from("diseno_tipos").delete().eq("id", id);
    if (error) { console.error("Error deleting tipo:", error); return; }
    setTiposByClase((prev) => ({ ...prev, [claseId]: (prev[claseId] ?? []).filter((t) => t.id !== id) }));
    setConfirmTarget(null);
  };

  const toggleDesignSelection = (id: number) => {
    setSelectedDesigns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteBulkEstampados = async () => {
    const ids = [...selectedDesigns];
    if (ids.length === 0) return;
    const { error } = await supabase.from("estampados").delete().in("id", ids);
    if (error) { console.error("Error deleting estampados:", error); return; }
    setEstampados((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelectedDesigns(new Set());
    setConfirmTarget(null);
  };

  const toggleBulkEstampadoActive = async () => {
    const ids = [...selectedDesigns];
    if (ids.length === 0) return;
    const targetActive = !estampados.some((e) => ids.includes(e.id) && e.active);
    const { error } = await supabase.from("estampados").update({ active: targetActive }).in("id", ids);
    if (error) { console.error("Error updating estampados:", error); return; }
    setEstampados((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, active: targetActive } : e));
    setSelectedDesigns(new Set());
  };

  const saveEstampado = async () => {
    if (!estampadoForm?.name) return;
    setSaving(true);
    setClaseError(null);
    const p = {
      name: estampadoForm.name,
      description: estampadoForm.description ?? "",
      svg_content: "",
      image_url: "",
      active: estampadoForm.active ?? true,
      tags: estampadoForm.tags ?? [],
      sort_order: estampadoForm.sort_order ?? 0,
    };
    try {
      const { error } = estampadoForm.id
        ? await supabase.from("estampados").update(p).eq("id", estampadoForm.id)
        : await supabase.from("estampados").insert(p);
      if (error) {
        console.error("Error saving estampado:", error);
        setClaseError(error.message || "Error al guardar la clase");
        return;
      }
      setEstampadoForm(null);
      await loadEstampados();
    } finally {
      setSaving(false);
    }
  };

  const saveTipo = async () => {
    if (!tipoForm?.name || !tipoForm.estampado_id) return;
    setSaving(true);
    setTipoError(null);
    const p = {
      estampado_id: tipoForm.estampado_id,
      name: tipoForm.name,
      description: tipoForm.description ?? "",
      svg_content: tipoForm.svg_content ?? "",
      image_url: tipoForm.image_url ?? "",
      tags: tipoForm.tags ?? [],
      active: tipoForm.active ?? true,
      sort_order: tipoForm.sort_order ?? 0,
    };
    try {
      const { error } = tipoForm.id
        ? await supabase.from("diseno_tipos").update(p).eq("id", tipoForm.id)
        : await supabase.from("diseno_tipos").insert(p);
      if (error) {
        console.error("Error saving tipo:", error);
        setTipoError(error.message || "Error al guardar el tipo");
        return;
      }
      setTipoForm(null);
      await loadTipos(p.estampado_id);
    } finally {
      setSaving(false);
    }
  };

  const handleTipoImage = async (file: File) => {
    if (!tipoFormRef.current) return;
    if (!file.type.startsWith("image/png")) {
      setTipoError("Solo se permiten imágenes PNG");
      return;
    }
    setUploadingImg(true);
    setTipoError(null);
    try {
      const url = await uploadImage(file, `disenos/${Date.now()}-${file.name}`);
      if (!url) { setTipoError("Error al subir la imagen a Supabase"); return; }
      setTipoForm((prev) => (prev ? { ...tipoFormRef.current!, image_url: url } : prev));
    } finally {
      setUploadingImg(false);
    }
  };

  return (
    <section className="admin-section">
      <ConfirmModal
        open={confirmTarget !== null}
        title={confirmTarget?.type === "estampado" ? "Eliminar clase" : confirmTarget?.type === "bulk-estampados" ? "Eliminar clases" : "Eliminar tipo"}
        message={confirmTarget?.type === "estampado" ? "¿Eliminar esta clase de diseño? También se eliminarán sus tipos." : confirmTarget?.type === "bulk-estampados" ? `¿Eliminar ${confirmTarget.ids?.length ?? 0} clases seleccionadas? También se eliminarán sus tipos.` : "¿Eliminar este tipo de diseño?"}
        onConfirm={() => {
          if (!confirmTarget) return;
          if (confirmTarget.type === "estampado") deleteEstampado(confirmTarget.id!);
          else if (confirmTarget.type === "diseno_tipo") deleteTipo(confirmTarget.id!, confirmTarget.parentId!);
          else if (confirmTarget.type === "bulk-estampados") deleteBulkEstampados();
        }}
        onCancel={() => setConfirmTarget(null)}
      />

      <div className="admin-section-header">
        <h2>Clases de diseño</h2>
        <button
          className="btn-back"
          onClick={() => {
            setClaseError(null);
            setEstampadoForm({ name: "", description: "", active: true, tags: [], sort_order: estampados.length });
            setExpandedClase(null);
            setTipoForm(null);
          }}
        >
          + Nueva clase
        </button>
      </div>

      {estampadoForm && !expandedClase && (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h4>{estampadoForm.id ? "Editar clase" : "Nueva clase"}</h4>
            <button type="button" className="admin-panel__close" onClick={() => { setClaseError(null); setEstampadoForm(null); }} aria-label="Cerrar">✕</button>
          </div>
          <div className="admin-form">
            <label className="admin-label">Nombre</label>
            <input className="admin-input" value={estampadoForm.name ?? ""} onChange={(e) => { setClaseError(null); setEstampadoForm({ ...estampadoForm, name: e.target.value }); }} placeholder="Ej: Animal Print" />
            <label className="admin-label">Descripción</label>
            <input className="admin-input" value={estampadoForm.description ?? ""} onChange={(e) => { setClaseError(null); setEstampadoForm({ ...estampadoForm, description: e.target.value }); }} />
            <label className="admin-label">Etiquetas</label>
            <TagInput value={estampadoForm.tags ?? []} onChange={(tags) => { setClaseError(null); setEstampadoForm({ ...estampadoForm, tags }); }} />
            <label className="admin-label">Orden</label>
            <input className="admin-input" type="number" value={estampadoForm.sort_order ?? 0} onChange={(e) => { setClaseError(null); setEstampadoForm({ ...estampadoForm, sort_order: parseInt(e.target.value) || 0 }); }} />
            <label className="admin-label">
              <input type="checkbox" checked={estampadoForm.active ?? true} onChange={(e) => { setClaseError(null); setEstampadoForm({ ...estampadoForm, active: e.target.checked }); }} />{" Activo"}
            </label>
            {claseError && <p className="admin-error">{claseError}</p>}
            <div className="admin-form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setClaseError(null); setEstampadoForm(null); }}>Cancelar</button>
              <button type="button" className="btn-primary btn-primary--auto" disabled={!estampadoForm.name || saving} onClick={saveEstampado}>
                {estampadoForm.id ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!estampadoForm && (
        <table className="admin-table">
          <thead><tr>
            <th style={{ width: 36 }}>
              <input
                type="checkbox"
                aria-label="Seleccionar todas las clases"
                checked={estampados.length > 0 && selectedDesigns.size === estampados.length}
                onChange={(e) => setSelectedDesigns(e.target.checked ? new Set(estampados.map((x) => x.id)) : new Set())}
              />
            </th>
            <th>Nombre</th><th>Etiquetas</th><th>Activo</th><th>Tipos</th><th>Orden</th><th></th>
          </tr></thead>
          <tbody>
            {estampados.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No hay clases de diseño</td></tr>}
            {estampados.map((e) => (
              <React.Fragment key={e.id}>
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${e.name}`}
                      checked={selectedDesigns.has(e.id)}
                      onChange={() => toggleDesignSelection(e.id)}
                    />
                  </td>
                  <td>{e.name}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{(e.tags ?? []).join(", ")}</td>
                  <td>{e.active ? "✓" : "✕"}</td>
                  <td>{(tiposByClase[e.id] ?? []).length}</td>
                  <td>{e.sort_order}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="btn-small" onClick={async () => {
                        if (expandedClase === e.id) { setExpandedClase(null); setTipoForm(null); return; }
                        setExpandedClase(e.id);
                        setTipoForm(null);
                        if (!tiposByClase[e.id]) await loadTipos(e.id);
                      }}>{expandedClase === e.id ? "−" : "+"} Tipos</button>
                      <button className="btn-small" onClick={() => { setClaseError(null); setEstampadoForm(e); setExpandedClase(null); setTipoForm(null); }}>Editar</button>
                      <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "estampado", id: e.id })} aria-label={`Eliminar ${e.name}`}>✕</button>
                    </div>
                  </td>
                </tr>
                {expandedClase === e.id && (
                  <tr key={`tipos-${e.id}`}>
                    <td colSpan={7} style={{ padding: "0.5rem 1rem 1rem", background: "var(--surface)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <strong style={{ fontSize: "0.85rem" }}>Tipos de {e.name}</strong>
                        <button className="btn-back" onClick={() => setTipoForm({ estampado_id: e.id, name: "", description: "", image_url: "", tags: [], active: true, sort_order: (tiposByClase[e.id] ?? []).length })}>
                          + Nuevo tipo
                        </button>
                      </div>
                      {tipoForm && tipoForm.estampado_id === e.id && (
                        <div className="admin-panel" style={{ marginBottom: "0.75rem" }}>
                          <div className="admin-panel__header">
                            <h4>{tipoForm.id ? "Editar tipo" : "Nuevo tipo"}</h4>
                            <button type="button" className="admin-panel__close" onClick={() => { setTipoForm(null); setTipoError(null); }} aria-label="Cerrar">✕</button>
                          </div>
                          <div className="admin-form">
                            <label className="admin-label">Nombre</label>
                            <input className="admin-input" value={tipoForm.name ?? ""} onChange={(e2) => { setTipoError(null); setTipoForm({ ...tipoForm, name: e2.target.value }); }} />
                            <label className="admin-label">Descripción</label>
                            <input className="admin-input" value={tipoForm.description ?? ""} onChange={(e2) => setTipoForm({ ...tipoForm, description: e2.target.value })} />
                            <label className="admin-label" htmlFor="tipo-image-input">Imagen PNG</label>
                            <input id="tipo-image-input" className="admin-input" type="file" accept="image/png" onChange={(e2) => {
                              const file = e2.target.files?.[0];
                              e2.target.value = "";
                              if (file) handleTipoImage(file);
                            }} />
                            {uploadingImg && <p className="admin-error">Subiendo imagen...</p>}
                            {tipoForm.image_url && (
                              <div className="admin-upload-preview">
                                <img src={tipoForm.image_url} alt="Preview del tipo" />
                                <button type="button" className="btn-small btn-small--danger" onClick={() => setTipoForm({ ...tipoForm, image_url: "" })}>Quitar imagen</button>
                              </div>
                            )}
                            <label className="admin-label">Etiquetas</label>
                            <TagInput value={tipoForm.tags ?? []} onChange={(tags) => setTipoForm({ ...tipoForm, tags })} />
                            <label className="admin-label">
                              <input type="checkbox" checked={tipoForm.active ?? true} onChange={(e2) => setTipoForm({ ...tipoForm, active: e2.target.checked })} />{" Activo"}
                            </label>
                            {tipoError && <p className="admin-error">{tipoError}</p>}
                            <div className="admin-form-actions">
                              <button type="button" className="btn-secondary" onClick={() => { setTipoForm(null); setTipoError(null); }}>Cancelar</button>
                              <button type="button" className="btn-primary btn-primary--auto" disabled={!tipoForm.name || saving || uploadingImg} onClick={saveTipo}>
                                {tipoForm.id ? "Guardar" : "Crear"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {(tiposByClase[e.id] ?? []).length === 0 && !tipoForm && (
                        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem" }}>Esta clase no tiene tipos todavía</p>
                      )}
                      {(tiposByClase[e.id] ?? []).map((t) => (
                        <div key={t.id} className="admin-row" style={{ marginBottom: "0.25rem" }}>
                          {t.image_url ? (
                            <img src={t.image_url} alt={t.name} className="admin-tipo-thumb" />
                          ) : t.svg_content ? (
                            <div style={{ width: 28, height: 28, color: "var(--accent)" }} dangerouslySetInnerHTML={{ __html: t.svg_content.replace(/currentColor/gi, "var(--accent)") }} />
                          ) : (
                            <span className="admin-tipo-thumb admin-tipo-thumb--empty">?</span>
                          )}
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "0.85rem" }}>{t.name}</strong>
                            {t.description && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{t.description}</span>}
                            {(t.tags ?? []).length > 0 && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>#{ (t.tags ?? []).join(", #")}</span>}
                          </div>
                          <span style={{ fontSize: "0.75rem", marginRight: "0.5rem", color: t.active ? "var(--accent)" : "var(--text-muted)" }}>{t.active ? "✓" : "✕"}</span>
                          <button className="btn-small" onClick={() => setTipoForm(t)}>Editar</button>
                          <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "diseno_tipo", id: t.id, parentId: e.id })} aria-label={`Eliminar ${t.name}`}>✕</button>
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

      {selectedDesigns.size > 0 && (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-bar__count">{selectedDesigns.size} seleccionadas</span>
          <button className="btn-small" onClick={toggleBulkEstampadoActive}>Activar/Desactivar</button>
          <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "bulk-estampados", ids: [...selectedDesigns] })}>Eliminar seleccionadas</button>
        </div>
      )}
    </section>
  );
}
