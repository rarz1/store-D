import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type GarmentRow, type DesignRow } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import ConfirmModal from "../../components/ConfirmModal";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<{ type: "garment" | "design"; id: number } | null>(null);

  useEffect(() => {
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading garments:", error);
      if (data) setGarments(data);
    });
    supabase.from("designs").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading designs:", error);
      if (data) setDesigns(data);
    });
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
        <button className="btn-back" onClick={logout}>Cerrar sesión</button>
      </div>

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
    </div>
  );
}
