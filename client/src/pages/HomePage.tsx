import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import { supabase, type GarmentRow } from "../lib/supabase";
import { setMeta } from "../lib/seo";
import { getSettings, type SiteSettings } from "../lib/settings";

const iconPaths: Record<string, string> = {
  remeras: "M55 120L145 38L195 38L285 120L310 410L260 430L80 430L30 410Z",
  pantalones: "M65 18L275 18L310 360L260 380L80 380L30 360Z",
  buzos: "M50 80L140 20L200 20L290 80L315 430L265 455L75 455L25 430Z",
};

export default function HomePage() {
  const navigate = useNavigate();
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [settings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(setSiteSettings);
    setMeta({ title: "STORE · Colección", description: "Prendas personalizables. Remeras, pantalones y buzos oversize con diseño propio. Algodón orgánico, edición limitada." });
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading garments:", error);
      if (data) setGarments(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="home">
      <Carousel />

      <section className="categories">
        <div className="categories__header">
          <h2 className="categories__title">{settings?.collections_title || "COLECCIONES"}</h2>
          <p className="categories__subtitle">{settings?.collections_subtitle || "Elegí tu prenda y personalizala a tu gusto"}</p>
        </div>

        {loading ? (
          <div className="categories__grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="category-card" style={{ pointerEvents: "none" }}>
                <div className="skeleton" style={{ width: 80, height: 104, borderRadius: "var(--radius-sm)" }} />
                <div className="category-card__info">
                  <div className="skeleton skeleton--text" style={{ width: "60%" }} />
                  <div className="skeleton skeleton--text" style={{ width: "80%", height: "0.75rem" }} />
                  <div className="skeleton skeleton--text" style={{ width: "40%", height: "0.75rem" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="categories__grid">
            {garments.map((g) => {
              const path = iconPaths[g.slug];
              return (
                <button
                  key={g.id}
                  className="category-card"
                  onClick={() => navigate(`/producto/${g.slug}`)}
                >
                  <div className="category-card__icon">
                    {path ? (
                      <svg viewBox="0 0 340 440" fill="none" width="100" height="130">
                        <path d={path} fill="var(--accent)" opacity="0.85" />
                        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: "2rem", color: "var(--accent)" }}>{g.name[0]}</span>
                    )}
                  </div>
                  <div className="category-card__info">
                    <h3 className="category-card__name">{g.name}</h3>
                    <p className="category-card__desc">{g.description}</p>
                    <span className="category-card__price">
                      Desde ${Number(g.base_price).toLocaleString("es-AR")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
