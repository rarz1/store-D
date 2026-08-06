# Tipos de diseño PNG + ubicación personalizada — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el cliente elija el diseño (PNG) que irá estampado y lo posicione en lugares predefinidos o arrastrándolo sobre el mock; en admin, mejorar el tab Diseños (clases y tipos) con subida de PNG a Supabase, tags por chips, UI premium y fix del "tercer tipo no se guarda".

**Architecture:** Se extrae el tab Diseños de `AdminDashboard.tsx` a un componente aislado `AdminDesignsTab.tsx` con su propio estado y `ConfirmModal`. Se crea un `TagInput` reutilizable (chips, sin comas). Los tipos guardan la imagen en el bucket `store-images` (función `uploadImage()` existente) en el campo `image_url`. El cliente: `GarmentMock` aprende a renderizar `<img>` y posiciones custom `{x,y}` en %, y en modo `draggable` captura pointer events para posicionar el diseño; `DesignFlow` agrega el modo "Ubicación libre"; `cart.tsx` persiste `customPosition`. No hay cambios de tablas.

**Tech Stack:** React 19, Vite, @supabase/supabase-js, react-router-dom, TypeScript. Sin test runner configurado → verificación con `npm run build` (tsc -b + vite) y `npm run lint` (oxlint).

**Notas del proyecto:**
- `tsc --noEmit` es NO-OP (tsconfig de solución). El chequeo real es `npm run build`.
- UI copy en español, identificadores de código en inglés.
- Tipos con solo `import type` para imports de tipos.
- Trabajar directo en `main` (consentimiento del usuario).

---

### Task 1: TagInput component (chips, sin comas)

**Files:**
- Create: `client/src/components/admin/TagInput.tsx`
- Modify: `client/src/App.css` (estilos)

- [ ] **Step 1: Crear el componente**

Crear `client/src/components/admin/TagInput.tsx`:

```tsx
import { useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim();
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="admin-tag-input">
      <div className="admin-tag-input__chips">
        {value.map((tag) => (
          <span key={tag} className="admin-tag-chip">
            {tag}
            <button
              type="button"
              className="admin-tag-chip__remove"
              onClick={() => removeTag(tag)}
              aria-label={`Quitar etiqueta ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        className="admin-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
          if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={addTag}
        placeholder={placeholder ?? "Escribí una etiqueta y presioná Enter"}
      />
    </div>
  );
}
```

- [ ] **Step 2: Agregar estilos a `App.css`**

Agregar al final de `client/src/App.css`:

```css
/* ─── Admin TagInput ──────────────────────────── */
.admin-tag-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-tag-input__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.admin-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem 0.25rem 0.75rem;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--text);
}

.admin-tag-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.65rem;
  transition: all 150ms ease;
}

.admin-tag-chip__remove:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
```

- [ ] **Step 3: Verificar build**

Run (workdir `client`): `npm run build`
Expected: compila sin errores.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/admin/TagInput.tsx client/src/App.css
git commit -m "feat(admin): reusable tag chip input"
```

---

### Task 2: AdminDesignsTab — tab Diseños completo (PNG upload, tags chips, fix 3er tipo)

**Files:**
- Create: `client/src/pages/admin/AdminDesignsTab.tsx`
- Modify: `client/src/pages/admin/AdminDashboard.tsx` (reemplazar tab inline, quitar estado de disenos)
- Modify: `client/src/App.css` (panel, form-actions, upload, drag styles para admin)

- [ ] **Step 1: Crear `AdminDesignsTab.tsx`**

Crear el componente completo. Maneja clases (`estampados`), tipos (`diseno_tipos`) con upload de PNG a `store-images`, tags con `TagInput`, y su propio `ConfirmModal` + verificación de errores visibles.

```tsx
import React, { useEffect, useState } from "react";
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
    const p = {
      name: estampadoForm.name,
      description: estampadoForm.description ?? "",
      svg_content: "",
      image_url: "",
      active: estampadoForm.active ?? true,
      tags: estampadoForm.tags ?? [],
      sort_order: estampadoForm.sort_order ?? 0,
    };
    const { error } = estampadoForm.id
      ? await supabase.from("estampados").update(p).eq("id", estampadoForm.id)
      : await supabase.from("estampados").insert(p);
    setSaving(false);
    if (error) { console.error("Error saving estampado:", error); return; }
    setEstampadoForm(null);
    await loadEstampados();
  };

  const saveTipo = async () => {
    if (!tipoForm?.name || !tipoForm.estampado_id) return;
    setSaving(true);
    setTipoError(null);
    const p = {
      estampado_id: tipoForm.estampado_id,
      name: tipoForm.name,
      description: tipoForm.description ?? "",
      svg_content: "",
      image_url: tipoForm.image_url ?? "",
      tags: tipoForm.tags ?? [],
      active: tipoForm.active ?? true,
      sort_order: tipoForm.sort_order ?? 0,
    };
    const { error } = tipoForm.id
      ? await supabase.from("diseno_tipos").update(p).eq("id", tipoForm.id)
      : await supabase.from("diseno_tipos").insert(p);
    setSaving(false);
    if (error) {
      console.error("Error saving tipo:", error);
      setTipoError(error.message || "Error al guardar el tipo");
      return;
    }
    setTipoForm(null);
    await loadTipos(p.estampado_id);
  };

  const handleTipoImage = async (file: File) => {
    if (!tipoForm) return;
    if (!file.type.startsWith("image/png")) {
      setTipoError("Solo se permiten imágenes PNG");
      return;
    }
    setUploadingImg(true);
    setTipoError(null);
    const url = await uploadImage(file, `disenos/${Date.now()}-${file.name}`);
    setUploadingImg(false);
    if (!url) { setTipoError("Error al subir la imagen a Supabase"); return; }
    setTipoForm({ ...tipoForm, image_url: url });
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
            <button type="button" className="admin-panel__close" onClick={() => setEstampadoForm(null)} aria-label="Cerrar">✕</button>
          </div>
          <div className="admin-form">
            <label className="admin-label">Nombre</label>
            <input className="admin-input" value={estampadoForm.name ?? ""} onChange={(e) => setEstampadoForm({ ...estampadoForm, name: e.target.value })} placeholder="Ej: Animal Print" />
            <label className="admin-label">Descripción</label>
            <input className="admin-input" value={estampadoForm.description ?? ""} onChange={(e) => setEstampadoForm({ ...estampadoForm, description: e.target.value })} />
            <label className="admin-label">Etiquetas</label>
            <TagInput value={estampadoForm.tags ?? []} onChange={(tags) => setEstampadoForm({ ...estampadoForm, tags })} />
            <label className="admin-label">Orden</label>
            <input className="admin-input" type="number" value={estampadoForm.sort_order ?? 0} onChange={(e) => setEstampadoForm({ ...estampadoForm, sort_order: parseInt(e.target.value) || 0 })} />
            <label className="admin-label">
              <input type="checkbox" checked={estampadoForm.active ?? true} onChange={(e) => setEstampadoForm({ ...estampadoForm, active: e.target.checked })} />{" Activo"}
            </label>
            <div className="admin-form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEstampadoForm(null)}>Cancelar</button>
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
                      <button className="btn-small" onClick={() => { setEstampadoForm(e); setExpandedClase(null); setTipoForm(null); }}>Editar</button>
                      <button className="btn-small btn-small--danger" onClick={() => setConfirmTarget({ type: "estampado", id: e.id })}>✕</button>
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
                            <label className="admin-label">Imagen PNG</label>
                            <input className="admin-input" type="file" accept="image/png" onChange={(e2) => {
                              const file = e2.target.files?.[0];
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
```

- [ ] **Step 2: Integrar en `AdminDashboard.tsx`**

Reemplazar todo el bloque `{tab === "disenos" && ( ... )}` (líneas ~471-642, incluye la sección y el cierre `</>`) por:

```tsx
      {tab === "disenos" && <AdminDesignsTab />}
```

Agregar el import en `AdminDashboard.tsx`:

```tsx
import AdminDesignsTab from "./AdminDesignsTab";
```

Luego **eliminar del `AdminDashboard.tsx`** el estado y handlers que ya no se usan (para no romper el build por variables sin uso):
- Estado: `estampados`, `estampadoForm`, `tiposByClase`, `expandedClase`, `tipoForm`, `selectedDesigns`, `tipoError`
- Handlers: `loadTipos`, `deleteEstampado`, `deleteTipo`, `toggleDesignSelection`, `deleteBulkEstampados`, `toggleBulkEstampadoActive`
- El type `Tab` y el nav quedan igual; `confirmTarget` se mantiene para products (garments/bulk-garments).
- Del import de `../../lib/supabase` quitar `EstampadoRow` y `DisenoTipoRow` si ya no se referencian en el resto del archivo. Verificar con build.

- [ ] **Step 3: Agregar estilos admin a `App.css`**

Agregar al final de `client/src/App.css`:

```css
/* ─── Admin panels (create/edit windows) ─────── */
.admin-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-sm);
}

.admin-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.admin-panel__header h4 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.04em;
  color: var(--text);
  margin: 0;
}

.admin-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 150ms ease;
}

.admin-panel__close:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
}

.admin-form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.admin-form-actions .btn-primary {
  flex: 0 0 auto;
  margin: 0;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-primary--auto {
  width: auto;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
}

.admin-upload-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.admin-upload-preview img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.admin-tipo-thumb {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 4px;
  margin-right: 0.5rem;
}

.admin-tipo-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.8rem;
}
```

- [ ] **Step 4: Verificar build**

Run (workdir `client`): `npm run build`
Expected: compila sin errores (si quedan vars sin uso en `AdminDashboard`, eliminarlas hasta que pase).

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminDesignsTab.tsx client/src/pages/admin/AdminDashboard.tsx client/src/App.css
git commit -m "feat(admin): redesign designs tab - PNG upload, tag chips, visible errors"
```

---

### Task 3: GarmentMock — soporte de imágenes + posición custom + drag

**Files:**
- Modify: `client/src/components/GarmentMock.tsx`
- Modify: `client/src/App.css` (estilos drag/overlay)

- [ ] **Step 1: Extender `GarmentMock.tsx`**

Reemplazar el contenido de `client/src/components/GarmentMock.tsx` por:

```tsx
import { lazy, Suspense, type ComponentType, useRef, useState, type ReactNode } from "react";

const garmentComponents: Record<string, ComponentType<{ color: string }>> = {
  remeras: lazy(() => import("../assets/garments/TShirtSVG")),
  pantalones: lazy(() => import("../assets/garments/ShortsSVG")),
  buzos: lazy(() => import("../assets/garments/HoodieSVG")),
};

function isLight(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

type Side = "front" | "back";
type Position = "small_front" | "small_front_right" | "large_front" | "small_back" | "large_back" | "sleeve";

export interface CustomPosition {
  x: number;
  y: number;
}

interface PlacedDesign {
  variantId: number;
  svgContent: string;
  imageUrl?: string;
  position: Position;
  customPosition?: CustomPosition;
  side?: Side;
  name: string;
  isPreview?: boolean;
}

interface DragDesign {
  imageUrl?: string;
  svgContent?: string;
  widthPercent: number;
  position: CustomPosition;
}

interface Props {
  garmentId: string;
  color: string;
  designSvg?: string | null;
  svgMock?: string;
  svgMockBack?: string;
  placedDesigns?: PlacedDesign[];
  side?: Side;
  onToggleSide?: () => void;
  hideFlip?: boolean;
  dragDesign?: DragDesign | null;
  onDragPosition?: (pos: CustomPosition) => void;
  draggable?: boolean;
}

const positionStyles: Record<Position, React.CSSProperties> = {
  small_front: { top: "32%", left: "30%", width: "40%", height: "22%" },
  small_front_right: { top: "32%", left: "55%", width: "40%", height: "22%" },
  large_front: { top: "26%", left: "18%", width: "64%", height: "36%" },
  small_back: { top: "32%", left: "30%", width: "40%", height: "22%" },
  large_back: { top: "26%", left: "18%", width: "64%", height: "36%" },
  sleeve: { top: "8%", left: "2%", width: "15%", height: "20%" },
};

function RenderMock({ garmentId, color, svgMock, svgMockBack, placedDesigns, designSvg, side, dragDesign, onDragPosition, draggable }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const GarmentSVG = garmentComponents[garmentId];
  const designColor = isLight(color) ? "#1a1a1a" : "#ffffff";

  const mockSvg = side === "back" && svgMockBack ? svgMockBack : svgMock;
  const coloredMock = mockSvg
    ? mockSvg
        .replace(/\s(width|height)="[^"]*"/g, "")
        .replace(/currentColor/gi, color)
    : null;

  const sideDesigns = (placedDesigns ?? []).filter((d) => {
    if (d.side) return d.side === side;
    if (d.position === "sleeve") return true;
    if (side === "front") return d.position.includes("front");
    return d.position.includes("back");
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable || !onDragPosition) return;
    e.preventDefault();
    const update = (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 5, 95);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 5, 95);
      onDragPosition({ x, y });
    };
    update(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => update(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const renderDesignNode = (d: PlacedDesign): ReactNode => {
    if (d.imageUrl) {
      return <img className="garment-mock__design-image" src={d.imageUrl} alt={d.name} />;
    }
    const colored = d.svgContent.replace(/currentColor/gi, designColor);
    return <div className="garment-mock__design-svg" dangerouslySetInnerHTML={{ __html: colored }} />;
  };

  return (
    <div className="garment-mock__svg" ref={containerRef} onPointerDown={draggable ? handlePointerDown : undefined}>
      {coloredMock ? (
        <div className="garment-mock__custom" dangerouslySetInnerHTML={{ __html: coloredMock }} />
      ) : GarmentSVG ? (
        <Suspense fallback={<div className="garment-mock__fallback">...</div>}>
          <GarmentSVG color={color} />
        </Suspense>
      ) : (
        <div className="garment-mock__fallback">Prenda no disponible</div>
      )}

      {sideDesigns.map((d) => {
        const style = d.customPosition
          ? { left: `${d.customPosition.x}%`, top: `${d.customPosition.y}%`, transform: "translate(-50%, -50%)" }
          : positionStyles[d.position];
        return (
          <div
            key={`${d.variantId}-${d.position}-${d.customPosition ? `${d.customPosition.x}-${d.customPosition.y}` : "fixed"}`}
            className={`garment-mock__design${d.isPreview ? " garment-mock__design--preview" : ""}`}
            style={style}
          >
            {renderDesignNode(d)}
          </div>
        );
      })}

      {dragDesign && (
        <div
          className="garment-mock__design garment-mock__design--drag"
          style={{ left: `${dragDesign.position.x}%`, top: `${dragDesign.position.y}%`, transform: "translate(-50%, -50%)", width: `${dragDesign.widthPercent}%` }}
        >
          {dragDesign.imageUrl ? (
            <img className="garment-mock__design-image" src={dragDesign.imageUrl} alt="" />
          ) : (
            <div className="garment-mock__design-svg" dangerouslySetInnerHTML={{ __html: (dragDesign.svgContent ?? "").replace(/currentColor/gi, designColor) }} />
          )}
        </div>
      )}

      {side === "front" && designSvg && (
        <div className="garment-mock__design" style={positionStyles.large_front} dangerouslySetInnerHTML={{ __html: designSvg.replace(/currentColor/gi, designColor) }} />
      )}
    </div>
  );
}

export default function GarmentMock(props: Props) {
  const { onToggleSide, hideFlip } = props;
  const [localSide, setLocalSide] = useState<Side>("front");
  const side = props.side ?? localSide;

  const toggle = onToggleSide ?? (() => setLocalSide((s) => (s === "front" ? "back" : "front")));

  return (
    <div className="garment-mock">
      <RenderMock {...props} side={side} />
      {!hideFlip && (props.svgMockBack || props.svgMock) && (
        <button className="garment-mock__flip" onClick={toggle}>
          {side === "front" ? "Ver posterior" : "Ver frente"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Agregar estilos de mock a `App.css`**

Modificar el bloque `.garment-mock__design` en `App.css` (línea 403) — **quitar `pointer-events: none;`** y agregar al final:

```css
.garment-mock__design--drag {
  opacity: 0.85;
  cursor: grab;
  pointer-events: none;
}

.garment-mock__design-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.garment-mock__design-svg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.garment-mock__design-svg svg {
  width: 100%;
  height: 100%;
}
```

Nota: el `pointer-events: none` que estaba en `.garment-mock__design` impide que el overlay de drag reciba el pointer — al quitarlo, los diseños existentes podrían interferir con el drag del mock; por eso el drag se captura en el contenedor (`.garment-mock__svg`), y los nodos internos tienen `pointer-events: none` individual.

- [ ] **Step 3: Verificar build**

Run (workdir `client`): `npm run build`
Expected: compila sin errores. Si `React.CSSProperties` da error de scope (no hay import de React con la nueva config JSX), reemplazar `React.CSSProperties` por `import type { CSSProperties } from "react"` y usar `CSSProperties`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/GarmentMock.tsx client/src/App.css
git commit -m "feat(client): garment mock supports images, custom position and drag"
```

---

### Task 4: DesignFlow — ubicación libre (drag) + preview de imagen

**Files:**
- Modify: `client/src/components/DesignFlow.tsx`
- Modify: `client/src/components/LocationSelector.tsx`
- Modify: `client/src/App.css` (estilo botón ubicación libre)

- [ ] **Step 1: Extender interfaces y props de `DesignFlow.tsx`**

Modificar `PreviewEstampado`, `PlacedEstampado` y `Props`:

```tsx
export interface CustomPosition {
  x: number;
  y: number;
}

interface PlacedEstampado {
  estampado: EstampadoRow;
  tipo: DisenoTipoRow;
  size: EstampadoSizeRow;
  locations: EstampadoLocationRow[];
  customPosition?: CustomPosition | null;
}

export interface PreviewEstampado {
  svgContent: string;
  imageUrl?: string;
  locations: EstampadoLocationRow[];
  customPosition?: CustomPosition | null;
  name: string;
}
```

Y `Props` gana:

```tsx
  garmentId: string;
  color: string;
  svgMock?: string;
  svgMockBack?: string;
```

- [ ] **Step 2: Estado de ubicación libre y preview**

Dentro del componente, agregar estado:

```tsx
  const [customMode, setCustomMode] = useState(false);
  const [customPos, setCustomPos] = useState<CustomPosition | null>({ x: 50, y: 50 });
```

Actualizar el `useEffect` del preview (M3):

```tsx
  useEffect(() => {
    if (step !== "closed" && selectedTipo && (selectedLocations.length > 0 || (customMode && customPos))) {
      onPreviewChange?.({
        svgContent: selectedTipo.svg_content || selectedClase?.svg_content || "",
        imageUrl: selectedTipo.image_url || undefined,
        locations: selectedLocations,
        customPosition: customMode ? customPos : null,
        name: `${selectedClase?.name ?? ""} · ${selectedTipo.name}`,
      });
    } else {
      onPreviewChange?.(null);
    }
  }, [step, selectedTipo, selectedLocations, selectedClase, customMode, customPos, onPreviewChange]);
```

Resetear `customMode`/`customPos` en los handlers de selección:

```tsx
  const handleSelectTipo = (id: number) => {
    setSelectedTipoId(id);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
    setSelectedLocationIds([]);
    setCustomMode(false);
    setCustomPos(null);
    setStep("size");
  };

  const handleSelectSize = (id: number) => {
    setSelectedSizeId(id);
    setSelectedLocationIds([]);
    setCustomMode(false);
    setCustomPos({ x: 50, y: 50 });
    setStep("location");
  };

  const handleToggleLocation = (id: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setCustomMode(false);
    setCustomPos(null);
  };

  const handleConfirm = () => {
    if (!selectedClase || !selectedTipo || !selectedSizeObj) return;
    if (customMode) {
      if (!customPos) return;
      onAdd({ estampado: selectedClase, tipo: selectedTipo, size: selectedSizeObj, locations: [], customPosition: customPos });
    } else {
      onAdd({ estampado: selectedClase, tipo: selectedTipo, size: selectedSizeObj, locations: selectedLocations, customPosition: null });
    }
    setSelectedClaseId(null);
    setSelectedTipoId(null);
    setSelectedSizeId(null);
    setSelectedLocationIds([]);
    setCustomMode(false);
    setCustomPos(null);
    setStep("closed");
    onPreviewChange?.(null);
  };
```

- [ ] **Step 3: Render del paso ubicación con drag**

Reemplazar el bloque `{step === "location" && (...)}` en `DesignFlow.tsx` por:

```tsx
              {step === "location" && (
                <div className="design-flow__confirm">
                  <LocationSelector
                    locations={stampLocations}
                    selectedIds={selectedLocationIds}
                    onToggle={handleToggleLocation}
                  />
                  <button
                    className={`choice-btn${customMode ? " choice-btn--active" : ""}`}
                    type="button"
                    onClick={() => {
                      const next = !customMode;
                      setCustomMode(next);
                      if (next) setSelectedLocationIds([]);
                      setCustomPos(next ? { x: 50, y: 50 } : null);
                    }}
                  >
                    <span className="choice-btn__label">Ubicación</span>
                    <span className="choice-btn__value">{customMode ? "Libre (arrastrá sobre la prenda)" : "Elegir ubicación libre"}</span>
                  </button>
                  {customMode && (
                    <div className="design-flow__drag">
                      <span className="control-label" style={{ marginBottom: "0.25rem", display: "block" }}>ARRÁSTRÁ EL DISEÑO SOBRE LA PRENDA</span>
                      <GarmentMock
                        garmentId={garmentId}
                        color={color}
                        svgMock={svgMock}
                        svgMockBack={svgMockBack}
                        draggable
                        dragDesign={{
                          imageUrl: selectedTipo?.image_url || undefined,
                          svgContent: selectedTipo?.svg_content || selectedClase?.svg_content || "",
                          widthPercent: selectedSizeObj?.width_percent ?? 40,
                          position: customPos ?? { x: 50, y: 50 },
                        }}
                        onDragPosition={setCustomPos}
                      />
                      <p className="text-muted" style={{ fontSize: "0.75rem", textAlign: "center", margin: "0.25rem 0 0" }}>
                        Tamaño: {selectedSizeObj?.name} — mantené pulsado y mové sobre la prenda
                      </p>
                    </div>
                  )}
                  <button
                    className="btn-primary"
                    style={{ width: "100%", marginTop: "0.75rem" }}
                    onClick={handleConfirm}
                    disabled={!customMode ? selectedLocationIds.length === 0 : !customPos}
                    type="button"
                  >
                    Confirmar estampado
                  </button>
                </div>
              )}
```

Agregar el import de `GarmentMock` y `CustomPosition` en `DesignFlow.tsx`:

```tsx
import GarmentMock from "./GarmentMock";
```

- [ ] **Step 4: Botón de modo libre en `LocationSelector.tsx`**

Agregar un botón opcional en `LocationSelector.tsx`:

```tsx
import type { EstampadoLocationRow } from "../lib/supabase";

interface Props {
  locations: EstampadoLocationRow[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onCustomToggle?: () => void;
  customActive?: boolean;
}

export default function LocationSelector({ locations, selectedIds, onToggle, onCustomToggle, customActive }: Props) {
  if (locations.length === 0) return null;

  return (
    <div className="control-group">
      <span className="control-label">UBICACIÓN</span>
      <div className="design-option-selector">
        {locations.map((l) => {
          const active = selectedIds.includes(l.id);
          return (
            <button
              key={l.id}
              className={`design-option-card${active ? " design-option-card--active" : ""}`}
              onClick={() => onToggle(l.id)}
            >
              <span className="design-option-card__name">{l.name}</span>
              {l.price_increment > 0 && (
                <span className="design-option-card__price">+${l.price_increment.toFixed(2)}</span>
              )}
            </button>
          );
        })}
        {onCustomToggle && (
          <button
            className={`design-option-card${customActive ? " design-option-card--active" : ""}`}
            onClick={onCustomToggle}
          >
            <span className="design-option-card__name">🎯 Ubicación libre</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

Nota: el botón "Ubicación libre" está en `LocationSelector` (Step 3 render no lo duplica — **elegir UNA** implementación). Se recomienda mantener el botón en `LocationSelector` vía `onCustomToggle`/`customActive` y pasar esas props desde `DesignFlow`; en ese caso el `choice-btn` agregado en Step 3 se omite. **Decisión de implementación: usar `LocationSelector` con las props nuevas y NO agregar el `choice-btn` duplicado en Step 3.**

- [ ] **Step 5: Estilos del drag en `App.css`**

Agregar al final de `client/src/App.css`:

```css
/* ─── DesignFlow custom placement ─────────────── */
.design-flow__drag {
  margin-top: 0.5rem;
}

.choice-btn--active {
  border-color: var(--accent);
  color: var(--accent);
}

.design-flow__drag .garment-mock {
  cursor: grab;
}

.design-flow__drag .garment-mock:active {
  cursor: grabbing;
}
```

- [ ] **Step 6: Verificar build**

Run (workdir `client`): `npm run build`
Expected: compila sin errores. Revisar que `designSvg` y demás props existentes de `GarmentMock` sigan usándose donde corresponda.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/DesignFlow.tsx client/src/components/LocationSelector.tsx client/src/App.css
git commit -m "feat(client): custom drag placement in design flow"
```

---

### Task 5: ProductPage + cart — propagar imagen y posición custom

**Files:**
- Modify: `client/src/pages/ProductPage.tsx`
- Modify: `client/src/lib/cart.tsx`

- [ ] **Step 1: Propagar props al DesignFlow en `ProductPage.tsx`**

En `ProductPage.tsx`:
- Extender `PlacedEstampado` local con `customPosition?: { x: number; y: number } | null`.
- Extender `previewStamp` state con `imageUrl?: string` y `customPosition`.
- Pasar a `<DesignFlow>` las nuevas props:

```tsx
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
                  JSON.stringify(p.locations.map((l) => l.id).sort()) === JSON.stringify(item.locations.map((l) => l.id).sort()) &&
                  JSON.stringify(p.customPosition ?? null) === JSON.stringify(item.customPosition ?? null)
                );
                if (isDuplicate) {
                  toast.warning("Este diseño ya está agregado en esa ubicación");
                  return;
                }
                setPlacedEstampados([...placedEstampados, item]);
              }}
            />
```

- [ ] **Step 2: Construir `placedDesigns` y `previewDesigns` con imagen + posición custom**

Reemplazar los bloques `placedDesigns` y `previewDesigns`:

```tsx
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
        side: "front" as const,
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
            side: "front" as const,
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
```

- [ ] **Step 3: Cart — `customPosition` en item y WhatsApp**

En `client/src/lib/cart.tsx`:

Extender el tipo en `CartItem.estampados`:

```tsx
  estampados: Array<{
    estampado: EstampadoRow;
    tipo: DisenoTipoRow;
    size: EstampadoSizeRow;
    locations: EstampadoLocationRow[];
    customPosition?: { x: number; y: number } | null;
  }>;
```

Actualizar el mensaje de WhatsApp en `CartDrawer`:

```tsx
      item.estampados.forEach((p) => {
        const locText = p.customPosition
          ? "Ubicación libre"
          : p.locations.map((l) => l.name).join(", ");
        lines.push(`   • Estampado: ${p.estampado.name} · ${p.tipo.name} (${p.size.name}) [${locText}]`);
      });
```

Nota: `addItem`/`reorder` ya comparan `JSON.stringify(i.estampados)` — como `customPosition` queda dentro de cada objeto de `estampados`, el dedupe incluye la posición automáticamente. No requiere cambio en `addItem`.

- [ ] **Step 4: Verificar build**

Run (workdir `client`): `npm run build`
Expected: compila sin errores.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/ProductPage.tsx client/src/lib/cart.tsx
git commit -m "feat(client): propagate custom position and PNG to cart and mock"
```

---

### Task 6: Verificación final, lint y docs

**Files:**
- Modify: `AI_CONTEXT.md`

- [ ] **Step 1: Lint**

Run (workdir `client`): `npm run lint`
Expected: solo warnings preexistentes (fast-refresh, exhaustive-deps). Sin errores nuevos.

- [ ] **Step 2: Build completo**

Run (workdir `client`): `npm run build`
Expected: PASS.

- [ ] **Step 3: Actualizar `AI_CONTEXT.md`**

Agregar al final una nota de sesión con lo implementado (UI copy en español): tab Diseños reescrito (PNG a Supabase, tags chips, paneles con cierre ✕, fix del 3er tipo), GarmentMock con imágenes/posición custom/drag, DesignFlow con "Ubicación libre", cart con `customPosition`.

- [ ] **Step 4: Commit docs**

```bash
git add AI_CONTEXT.md
git commit -m "docs: update AI_CONTEXT with design PNG and custom placement session"
```

---

## Self-Review

**Spec coverage:**
- Tab Diseños extraído a `AdminDesignsTab.tsx` con UI premium → Task 2 ✓
- Clases: tags chips, activo, orden, paneles con ✕ y Cancelar → Task 2 ✓
- Tipos: upload PNG a Supabase (validación MIME + `uploadImage`), sin SVG/URL, preview + Quitar → Task 2 ✓
- Fix 3er tipo: `saveTipo` muestra `error.message` visible y recarga → Task 2 ✓
- PNG en preview y mock + ubicación predefinida o drag → Tasks 3, 4, 5 ✓
- `customPosition` en carrito y WhatsApp → Task 5 ✓
- Sin cambios de tablas (reutiliza `image_url`) → n/a ✓
- Elemento de cierre en ventanas de creación (✕ + Cancelar) → Task 2 (`.admin-panel__close`, `.admin-form-actions` con `.btn-secondary`) ✓

**Placeholders:** Ninguno; todos los pasos tienen código/commandos reales.

**Type consistency:**
- `CustomPosition` definido en GarmentMock (Task 3) y re-exportado en DesignFlow (Task 4) — mismo shape `{x,y}` ✓
- `PlacedDesign.imageUrl`/`customPosition`/`side` usados en Task 3, producidos en Task 5 ✓
- `PreviewEstampado.imageUrl`/`customPosition` emitidos en Task 4, consumidos en Task 5 ✓
- `DragDesign` shape consistente entre Task 3 (GarmentMock) y Task 4 (DesignFlow) ✓
- `btn-secondary`, `btn-primary--auto`, `admin-panel__*`, `admin-form-actions`, `admin-tipo-thumb` definidos en App.css (Task 2) ✓
