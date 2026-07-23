import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface ColorEntry { name: string; hex: string; }
interface SizeEntry { name: string; }

export default function AdminGarmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [colors, setColors] = useState<ColorEntry[]>([{ name: "", hex: "#000000" }]);
  const [sizes, setSizes] = useState<SizeEntry[]>([{ name: "" }]);
  const [saving, setSaving] = useState(false);

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
    });
    supabase.from("garment_colors").select("*").eq("garment_id", numId).then(({ data, error }) => {
      if (error) { console.error("Error loading colors:", error); return; }
      if (data?.length) setColors(data.map((c) => ({ name: c.name, hex: c.hex })));
    });
    supabase.from("garment_sizes").select("*").eq("garment_id", numId).then(({ data, error }) => {
      if (error) { console.error("Error loading sizes:", error); return; }
      if (data?.length) setSizes(data.map((s) => ({ name: s.name })));
    });
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!name || !slug || !basePrice) return;
    setSaving(true);

    try {
      if (isEdit) {
        const numId = Number(id);
        const { error: eg } = await supabase.from("garments").update({ name, slug, description, base_price: parseFloat(basePrice) }).eq("id", numId);
        if (eg) throw eg;
        await supabase.from("garment_colors").delete().eq("garment_id", numId);
        await supabase.from("garment_sizes").delete().eq("garment_id", numId);
        await supabase.from("garment_colors").insert(colors.filter((c) => c.name).map((c) => ({ garment_id: numId, name: c.name, hex: c.hex })));
        await supabase.from("garment_sizes").insert(sizes.filter((s) => s.name).map((s) => ({ garment_id: numId, name: s.name })));
      } else {
        const { data, error } = await supabase.from("garments").insert({ name, slug, description, base_price: parseFloat(basePrice) }).select().single();
        if (error) throw error;
        if (data) {
          await supabase.from("garment_colors").insert(colors.filter((c) => c.name).map((c) => ({ garment_id: data.id, name: c.name, hex: c.hex })));
          await supabase.from("garment_sizes").insert(sizes.filter((s) => s.name).map((s) => ({ garment_id: data.id, name: s.name })));
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
        <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Remeras" />

        <label className="admin-label">Slug</label>
        <input className="admin-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ej: remeras" style={{ fontSize: "0.8rem" }} />
        {isEdit && originalSlug && slug !== originalSlug && (
          <p style={{ fontSize: "0.75rem", color: "#f97316", margin: 0 }}>
            ⚠ Cambiar el slug rompe los links existentes a esta prenda
          </p>
        )}

        <label className="admin-label">Descripción</label>
        <textarea className="admin-input admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción corta" />

        <label className="admin-label">Precio base ($)</label>
        <input className="admin-input" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="8500" />

        <label className="admin-label">
          Colores
          <button className="btn-small" style={{ marginLeft: 8 }} onClick={() => setColors([...colors, { name: "", hex: "#000000" }])}>+</button>
        </label>
        {colors.map((c, i) => (
          <div key={i} className="admin-row">
            <input className="admin-input" value={c.name} onChange={(e) => { const copy = [...colors]; copy[i].name = e.target.value; setColors(copy); }} placeholder="Negro" />
            <input className="admin-input admin-input--color" type="color" value={c.hex} onChange={(e) => { const copy = [...colors]; copy[i].hex = e.target.value; setColors(copy); }} />
            <button className="btn-small btn-small--danger" onClick={() => setColors(colors.filter((_, j) => j !== i))}>X</button>
          </div>
        ))}

        <label className="admin-label">
          Talles
          <button className="btn-small" style={{ marginLeft: 8 }} onClick={() => setSizes([...sizes, { name: "" }])}>+</button>
        </label>
        {sizes.map((s, i) => (
          <div key={i} className="admin-row">
            <input className="admin-input" value={s.name} onChange={(e) => { const copy = [...sizes]; copy[i].name = e.target.value; setSizes(copy); }} placeholder="S" />
            <button className="btn-small btn-small--danger" onClick={() => setSizes(sizes.filter((_, j) => j !== i))}>X</button>
          </div>
        ))}

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
