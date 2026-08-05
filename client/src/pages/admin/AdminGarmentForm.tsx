import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type EstampadoSizeRow, type EstampadoLocationRow } from "../../lib/supabase";

interface ColorEntry { name: string; hex: string; }
interface SizeEntry { name: string; }
interface FormErrors { name?: string; slug?: string; basePrice?: string; colors?: string; sizes?: string; }

export default function AdminGarmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [svgMock, setSvgMock] = useState("");
  const [svgMockBack, setSvgMockBack] = useState("");
  const [tags, setTags] = useState("");
  const [colors, setColors] = useState<ColorEntry[]>([{ name: "", hex: "#000000" }]);
  const [sizes, setSizes] = useState<SizeEntry[]>([{ name: "" }]);
  const [allStampSizes, setAllStampSizes] = useState<EstampadoSizeRow[]>([]);
  const [allStampLocations, setAllStampLocations] = useState<EstampadoLocationRow[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isEdit) return;
    const numId = Number(id);
    supabase.from("garments").select("*").eq("id", numId).single().then(({ data: g, error }) => {
      if (error) { console.error("Error loading garment:", error); return; }
      if (!g) return;
      setName(g.name);
      setSlug(g.slug);
      setOriginalSlug(g.slug);
      setDescription(g.description);
      setBasePrice(String(g.base_price));
      if (g.svg_mock) setSvgMock(g.svg_mock);
      if (g.svg_mock_back) setSvgMockBack(g.svg_mock_back);
      if (g.tags?.length) setTags(g.tags.join(", "));
    });
    supabase.from("garment_colors").select("*").eq("garment_id", numId).then(({ data, error }) => {
      if (error) { console.error("Error loading colors:", error); return; }
      if (data?.length) setColors(data.map((c) => ({ name: c.name, hex: c.hex })));
    });
    supabase.from("garment_sizes").select("*").eq("garment_id", numId).then(({ data, error }) => {
      if (error) { console.error("Error loading sizes:", error); return; }
      if (data?.length) setSizes(data.map((s) => ({ name: s.name })));
    });
    supabase.from("estampado_sizes").select("*").order("sort_order").then(({ data }) => {
      if (data) setAllStampSizes(data);
    });
    supabase.from("estampado_locations").select("*").order("sort_order").then(({ data }) => {
      if (data) setAllStampLocations(data);
    });
    supabase.from("garment_estampado_sizes").select("estampado_size_id").eq("garment_id", numId).then(({ data }) => {
      if (data) setSelectedSizeIds(data.map((r) => r.estampado_size_id));
    });
    supabase.from("garment_estampado_locations").select("estampado_location_id").eq("garment_id", numId).then(({ data }) => {
      if (data) setSelectedLocationIds(data.map((r) => r.estampado_location_id));
    });
  }, [id, isEdit]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!slug.trim()) e.slug = "El slug es obligatorio";
    if (!basePrice || Number(basePrice) <= 0) e.basePrice = "El precio debe ser mayor a 0";
    const validColors = colors.filter((c) => c.name.trim() && c.hex.trim());
    if (validColors.length === 0) e.colors = "Debe haber al menos un color";
    const validSizes = sizes.filter((s) => s.name.trim());
    if (validSizes.length === 0) e.sizes = "Debe haber al menos un talle";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      if (isEdit) {
        const numId = Number(id);
        const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        const { error: eg } = await supabase.from("garments").update({ name, slug, description, base_price: parseFloat(basePrice), svg_mock: svgMock, svg_mock_back: svgMockBack, tags: parsedTags }).eq("id", numId);
        if (eg) throw eg;
        await supabase.from("garment_colors").delete().eq("garment_id", numId);
        await supabase.from("garment_sizes").delete().eq("garment_id", numId);
        await supabase.from("garment_colors").insert(colors.filter((c) => c.name).map((c) => ({ garment_id: numId, name: c.name, hex: c.hex })));
        await supabase.from("garment_sizes").insert(sizes.filter((s) => s.name).map((s) => ({ garment_id: numId, name: s.name })));
        await supabase.from("garment_estampado_sizes").delete().eq("garment_id", numId);
        await supabase.from("garment_estampado_locations").delete().eq("garment_id", numId);
        if (selectedSizeIds.length > 0) await supabase.from("garment_estampado_sizes").insert(selectedSizeIds.map((sid) => ({ garment_id: numId, estampado_size_id: sid })));
        if (selectedLocationIds.length > 0) await supabase.from("garment_estampado_locations").insert(selectedLocationIds.map((lid) => ({ garment_id: numId, estampado_location_id: lid })));
      } else {
        const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        const { data, error } = await supabase.from("garments").insert({ name, slug, description, base_price: parseFloat(basePrice), svg_mock: svgMock, svg_mock_back: svgMockBack, tags: parsedTags }).select().single();
        if (error) throw error;
        if (data) {
          await supabase.from("garment_colors").insert(colors.filter((c) => c.name).map((c) => ({ garment_id: data.id, name: c.name, hex: c.hex })));
          await supabase.from("garment_sizes").insert(sizes.filter((s) => s.name).map((s) => ({ garment_id: data.id, name: s.name })));
          if (selectedSizeIds.length > 0) await supabase.from("garment_estampado_sizes").insert(selectedSizeIds.map((sid) => ({ garment_id: data.id, estampado_size_id: sid })));
          if (selectedLocationIds.length > 0) await supabase.from("garment_estampado_locations").insert(selectedLocationIds.map((lid) => ({ garment_id: data.id, estampado_location_id: lid })));
        }
      }
      navigate("/admin");
    } catch (err) {
      console.error("Error saving garment:", err);
    }
    setSaving(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h1>{isEdit ? "Editar" : "Nueva"} prenda</h1>
        <button className="btn-back" onClick={() => navigate("/admin")}>Volver</button>
      </div>

       <div className="admin-form">
         <label className="admin-label">Nombre</label>
         <input className="admin-input" style={errors.name ? { borderColor: "#ef4444" } : {}} value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }} placeholder="Ej: Remeras" />
         {errors.name && <p className="admin-error">{errors.name}</p>}

         <label className="admin-label">Slug</label>
         <input className="admin-input" style={{ ...(errors.slug ? { borderColor: "#ef4444" } : {}), fontSize: "0.8rem" }} value={slug} onChange={(e) => { setSlug(e.target.value); if (errors.slug) setErrors((p) => ({ ...p, slug: undefined })); }} placeholder="Ej: remeras" />
         {errors.slug && <p className="admin-error">{errors.slug}</p>}
         {isEdit && originalSlug && slug !== originalSlug && (
           <p style={{ fontSize: "0.75rem", color: "#f97316", margin: 0 }}>
             ⚠ Cambiar el slug rompe los links existentes a esta prenda
           </p>
         )}

         <label className="admin-label">Descripción</label>
         <textarea className="admin-input admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción corta" />

         <label className="admin-label">Precio base ($)</label>
         <input className="admin-input" style={errors.basePrice ? { borderColor: "#ef4444" } : {}} type="number" value={basePrice} onChange={(e) => { setBasePrice(e.target.value); if (errors.basePrice) setErrors((p) => ({ ...p, basePrice: undefined })); }} placeholder="8500" />
         {errors.basePrice && <p className="admin-error">{errors.basePrice}</p>}

        <label className="admin-label">Mock SVG</label>
        <input className="admin-input" type="file" accept=".svg" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          setSvgMock(text);
        }} />
        {svgMock && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              width: 120, height: 156, background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              <div style={{ width: 80, height: 104, color: "var(--text)" }}
                dangerouslySetInnerHTML={{ __html: svgMock.replace(/currentColor/gi, "var(--text)") }}
              />
            </div>
            <button className="btn-small btn-small--danger" style={{ marginTop: 4 }} onClick={() => setSvgMock("")}>Quitar SVG</button>
          </div>
        )}

        <label className="admin-label">Mock SVG - Vista posterior</label>
        <input className="admin-input" type="file" accept=".svg" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          setSvgMockBack(text);
        }} />
        {svgMockBack && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              width: 120, height: 156, background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              <div style={{ width: 80, height: 104, color: "var(--text)" }}
                dangerouslySetInnerHTML={{ __html: svgMockBack.replace(/currentColor/gi, "var(--text)") }}
              />
            </div>
            <button className="btn-small btn-small--danger" style={{ marginTop: 4 }} onClick={() => setSvgMockBack("")}>Quitar SVG</button>
          </div>
        )}

        <label className="admin-label">
          Etiquetas
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
            separadas por coma
          </span>
        </label>
        <input className="admin-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hombre, mujer, unisex, urbano" />

         <label className="admin-label">
           Colores
           <button className="btn-small" style={{ marginLeft: 8 }} onClick={() => setColors([...colors, { name: "", hex: "#000000" }])}>+</button>
         </label>
         {errors.colors && <p className="admin-error">{errors.colors}</p>}
         {colors.map((c, i) => (
           <div key={i} className="admin-row">
             <input className="admin-input" style={!c.name && i === colors.length - 1 ? { borderColor: "#ef4444" } : {}} value={c.name} onChange={(e) => { const copy = [...colors]; copy[i].name = e.target.value; setColors(copy); }} placeholder="Negro" />
             <input className="admin-input admin-input--color" type="color" value={c.hex} onChange={(e) => { const copy = [...colors]; copy[i].hex = e.target.value; setColors(copy); }} />
             <button className="btn-small btn-small--danger" onClick={() => setColors(colors.filter((_, j) => j !== i))}>X</button>
           </div>
         ))}

         <label className="admin-label">
           Talles
           <button className="btn-small" style={{ marginLeft: 8 }} onClick={() => setSizes([...sizes, { name: "" }])}>+</button>
         </label>
         {errors.sizes && <p className="admin-error">{errors.sizes}</p>}
         {sizes.map((s, i) => (
           <div key={i} className="admin-row">
             <input className="admin-input" style={!s.name && i === sizes.length - 1 ? { borderColor: "#ef4444" } : {}} value={s.name} onChange={(e) => { const copy = [...sizes]; copy[i].name = e.target.value; setSizes(copy); }} placeholder="S" />
             <button className="btn-small btn-small--danger" onClick={() => setSizes(sizes.filter((_, j) => j !== i))}>X</button>
           </div>
         ))}

        <label className="admin-label">Tamaños de estampado disponibles</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {allStampSizes.map((s) => (
            <label key={s.id} className={`tag-chip${selectedSizeIds.includes(s.id) ? " tag-chip--active" : ""}`} style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={selectedSizeIds.includes(s.id)} onChange={() => setSelectedSizeIds((prev) => prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id])} style={{ display: "none" }} />
              {s.name}
            </label>
          ))}
        </div>

        <label className="admin-label">Ubicaciones de estampado disponibles</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {allStampLocations.map((l) => (
            <label key={l.id} className={`tag-chip${selectedLocationIds.includes(l.id) ? " tag-chip--active" : ""}`} style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={selectedLocationIds.includes(l.id)} onChange={() => setSelectedLocationIds((prev) => prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id])} style={{ display: "none" }} />
              {l.name}
            </label>
          ))}
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
