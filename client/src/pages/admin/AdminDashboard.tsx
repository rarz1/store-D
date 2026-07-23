import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type GarmentRow, type DesignRow } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [designs, setDesigns] = useState<DesignRow[]>([]);

  useEffect(() => {
    supabase.from("garments").select("*").order("id").then(({ data }) => {
      if (data) setGarments(data);
    });
    supabase.from("designs").select("*").order("id").then(({ data }) => {
      if (data) setDesigns(data);
    });
  }, []);

  const deleteGarment = async (id: number) => {
    if (!confirm("¿Eliminar esta prenda?")) return;
    await supabase.from("garments").delete().eq("id", id);
    setGarments((prev) => prev.filter((g) => g.id !== id));
  };

  const deleteDesign = async (id: number) => {
    if (!confirm("¿Eliminar este diseño?")) return;
    await supabase.from("designs").delete().eq("id", id);
    setDesigns((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="admin-page">
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
                  <button className="btn-small btn-small--danger" onClick={() => deleteGarment(g.id)}>Borrar</button>
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
                  <button className="btn-small btn-small--danger" onClick={() => deleteDesign(d.id)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
