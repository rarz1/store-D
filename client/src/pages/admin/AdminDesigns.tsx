import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminDesigns() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";

  const [name, setName] = useState("");
  const [svgContent, setSvgContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    supabase.from("designs").select("*").eq("id", Number(id)).single().then(({ data, error }) => {
      if (error) { console.error("Error loading design:", error); return; }
      if (!data) return;
      setName(data.name);
      setSvgContent(data.svg_content);
    });
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!name || !svgContent) return;
    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await supabase.from("designs").update({ name, svg_content: svgContent }).eq("id", Number(id));
        if (error) throw error;
      } else {
        const { error } = await supabase.from("designs").insert({ name, svg_content: svgContent });
        if (error) throw error;
      }
      navigate("/admin");
    } catch (err) {
      console.error("Error saving design:", err);
    }
    setSaving(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h1>{isEdit ? "Editar" : "Nuevo"} diseño</h1>
        <button className="btn-back" onClick={() => navigate("/admin")}>Volver</button>
      </div>

      <div className="admin-form">
        <label className="admin-label">Nombre</label>
        <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Geométrico" />

        <label className="admin-label">
          SVG
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
            Usá currentColor para que herede el color de la prenda
          </span>
        </label>
        <textarea
          className="admin-input admin-textarea admin-textarea--code"
          value={svgContent}
          onChange={(e) => setSvgContent(e.target.value)}
          placeholder={`<svg viewBox="0 0 200 220" fill="none"><circle cx="100" cy="110" r="50" fill="currentColor"/></svg>`}
          spellCheck={false}
        />

        {svgContent && (
          <>
            <label className="admin-label">Vista previa</label>
            <div className="admin-preview">
              <div
                className="design-card__svg"
                style={{ width: 120, height: 132 }}
                dangerouslySetInnerHTML={{
                  __html: svgContent.replace(/currentColor/gi, "#f97316"),
                }}
              />
            </div>
          </>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
