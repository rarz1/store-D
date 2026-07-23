import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type DesignVariantRow } from "../../lib/supabase";

export default function AdminDesigns() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [tags, setTags] = useState("");
  const [variants, setVariants] = useState<Partial<DesignVariantRow>[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const numId = Number(id);
    supabase.from("design_options").select("*").eq("id", numId).single().then(({ data, error }) => {
      if (error) { console.error("Error loading design:", error); return; }
      if (!data) return;
      setName(data.name);
      setDescription(data.description);
      setBasePrice(String(data.base_price));
      setTags((data.tags ?? []).join(", "));
    });
    supabase.from("design_variants").select("*").eq("design_option_id", numId).order("sort_order").then(({ data, error }) => {
      if (error) { console.error("Error loading variants:", error); return; }
      if (data?.length) setVariants(data);
    });
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      if (isEdit) {
        const numId = Number(id);
        await supabase.from("design_options").update({ name, description, base_price: parseFloat(basePrice) || 0, tags: parsedTags }).eq("id", numId);
        const existing = await supabase.from("design_variants").select("id").eq("design_option_id", numId);
        const existingIds = (existing.data ?? []).map((v) => v.id);
        const keepIds: number[] = [];
        for (const v of variants) {
          if (v.id && v.svg_content) {
            await supabase.from("design_variants").update({
              name: v.name, svg_content: v.svg_content, image_url: v.image_url ?? "",
              additional_price: v.additional_price ?? 0, positions: v.positions ?? [],
              sort_order: v.sort_order ?? 0,
            }).eq("id", v.id);
            keepIds.push(v.id);
          } else if (v.svg_content) {
            const { data: ins } = await supabase.from("design_variants").insert({
              design_option_id: numId, name: v.name, svg_content: v.svg_content,
              image_url: v.image_url ?? "", additional_price: v.additional_price ?? 0,
              positions: v.positions ?? [], sort_order: v.sort_order ?? 0,
            }).select().single();
            if (ins) keepIds.push(ins.id);
          }
        }
        for (const oldId of existingIds) {
          if (!keepIds.includes(oldId)) await supabase.from("design_variants").delete().eq("id", oldId);
        }
      } else {
        const { data: ins } = await supabase.from("design_options").insert({ name, description, base_price: parseFloat(basePrice) || 0, tags: parsedTags }).select().single();
        if (ins) {
          for (const v of variants) {
            if (v.svg_content) {
              await supabase.from("design_variants").insert({
                design_option_id: ins.id, name: v.name, svg_content: v.svg_content,
                image_url: v.image_url ?? "", additional_price: v.additional_price ?? 0,
                positions: v.positions ?? [], sort_order: v.sort_order ?? 0,
              });
            }
          }
        }
      }
      navigate("/admin");
    } catch (err) {
      console.error("Error saving design:", err);
    }
    setSaving(false);
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", svg_content: "", additional_price: 0, positions: ["small_front", "large_front", "small_back", "large_back"], sort_order: variants.length }]);
  };

  const updateVariant = (i: number, field: string, value: unknown) => {
    const copy = [...variants];
    (copy[i] as Record<string, unknown>)[field] = value;
    setVariants(copy);
  };

  const removeVariant = (i: number) => {
    setVariants(variants.filter((_, j) => j !== i));
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h1>{isEdit ? "Editar" : "Nueva"} línea de diseño</h1>
        <button className="btn-back" onClick={() => navigate("/admin")}>Volver</button>
      </div>

      <div className="admin-form">
        <label className="admin-label">Nombre</label>
        <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Geométrico" />

        <label className="admin-label">Descripción</label>
        <textarea className="admin-input admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción de la línea de diseño" />

        <label className="admin-label">Precio base adicional ($)</label>
        <input className="admin-input" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0" />

        <label className="admin-label">
          Etiquetas
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
            separadas por coma
          </span>
        </label>
        <input className="admin-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="geométrico, minimalista, líneas" />

        <hr className="admin-divider" />

        <div className="admin-section-header">
          <h3 style={{ fontSize: "1rem" }}>Variantes de diseño</h3>
          <button className="btn-small" onClick={addVariant}>+ Agregar variante</button>
        </div>

        {variants.map((v, i) => (
          <div key={i} className="admin-variant">
            <div className="admin-variant__header">
              <strong>Variante {i + 1}</strong>
              <button className="btn-small btn-small--danger" onClick={() => removeVariant(i)}>X</button>
            </div>

            <label className="admin-label">Nombre</label>
            <input className="admin-input" value={v.name ?? ""} onChange={(e) => updateVariant(i, "name", e.target.value)} placeholder="Geométrico negro" />

            <label className="admin-label">Precio adicional ($)</label>
            <input className="admin-input" type="number" value={v.additional_price ?? 0} onChange={(e) => updateVariant(i, "additional_price", parseFloat(e.target.value) || 0)} placeholder="0" />

            <label className="admin-label">
              SVG
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
                Usá currentColor para que herede el color
              </span>
            </label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input type="file" accept=".svg" style={{ flex: 1 }} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                updateVariant(i, "svg_content", text);
              }} />
              {v.svg_content && (
                <button className="btn-small btn-small--danger" onClick={() => updateVariant(i, "svg_content", "")}>Quitar</button>
              )}
            </div>

            {v.svg_content && (
              <div className="admin-preview" style={{ marginTop: 8 }}>
                <div
                  className="design-card__svg"
                  style={{ width: 80, height: 88 }}
                  dangerouslySetInnerHTML={{ __html: (v.svg_content as string).replace(/currentColor/gi, "var(--accent)") }}
                />
              </div>
            )}

            <label className="admin-label">
              Posiciones disponibles
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
                Ctrl+Click para múltiples
              </span>
            </label>
            <select multiple className="admin-input" value={v.positions as string[] ?? []} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value);
              updateVariant(i, "positions", selected);
            }} style={{ height: 100 }}>
              <option value="small_front">Pequeño - Frente</option>
              <option value="large_front">Grande - Frente</option>
              <option value="small_back">Pequeño - Posterior</option>
              <option value="large_back">Grande - Posterior</option>
            </select>
          </div>
        ))}

        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: "1rem" }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
