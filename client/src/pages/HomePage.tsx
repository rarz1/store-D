import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { supabase, type GarmentRow } from "../lib/supabase";
import { setMeta } from "../lib/seo";
import { getSettings, type SiteSettings } from "../lib/settings";
import { useFavorites } from "../lib/favorites";

export default function HomePage() {
  const navigate = useNavigate();
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [settings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todo");
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    getSettings().then(setSiteSettings);
    setMeta({
      title: "STORE · Colección",
      description: "Prendas personalizables. Remeras, pantalones y buzos oversize con diseño propio. Algodón orgánico, edición limitada.",
    });
    supabase.from("garments").select("*").order("id").then(({ data, error }) => {
      if (error) console.error("Error loading garments:", error);
      if (data) setGarments(data);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["Todo"]);
    for (const g of garments) for (const t of g.tags) set.add(t);
    return Array.from(set);
  }, [garments]);

  const filteredGarments = useMemo(
    () =>
      activeCategory === "Todo"
        ? garments
        : garments.filter((g) => g.tags.includes(activeCategory)),
    [garments, activeCategory]
  );

  const handleConfigure = (slug: string) => {
    navigate(`/producto/${slug}`);
  };

  const bannerImage = settings?.collections_banner_url
    ? `linear-gradient(rgba(19, 21, 24, 0.6), rgba(19, 21, 24, 0.6)), url(${settings.collections_banner_url})`
    : undefined;

  const pageBgStyle = settings?.collections_bg_url
    ? {
        backgroundImage: `linear-gradient(rgba(244, 244, 245, 0.82), rgba(244, 244, 245, 0.82)), url(${settings.collections_bg_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : undefined;

  return (
    <div className="home page-enter" style={pageBgStyle}>
      <AppHeader settings={settings} showBack title="COLECCIONES" hideFab />

      <section className="categories">
        <div
          className="collections-banner"
          style={bannerImage ? {
            backgroundImage: bannerImage,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : undefined}
        >
          <div className="collections-banner__content">
            <h2 className="collections-banner__title">
              {settings?.collections_title || "COLECCIONES"}
            </h2>
            <p className="collections-banner__subtitle">
              {settings?.collections_subtitle || "Elegí tu prenda y personalizala a tu gusto"}
            </p>
          </div>
        </div>

        {categories.length > 1 && (
          <div className="collections-pills">
            {categories.map((c) => (
              <button
                key={c}
                className={`collections-pill${activeCategory === c ? " collections-pill--active" : ""}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="categories__grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="category-card" style={{ pointerEvents: "none", animationDelay: `${i * 100}ms` }}>
                <div className="skeleton" style={{ width: 80, height: 104, borderRadius: "var(--radius-sm)" }} />
                <div className="category-card__info">
                  <div className="skeleton skeleton--text" style={{ width: "60%" }} />
                  <div className="skeleton skeleton--text" style={{ width: "80%", height: "0.75rem" }} />
                  <div className="skeleton skeleton--text" style={{ width: "40%", height: "0.75rem" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGarments.length === 0 ? (
          <div className="categories__empty">
            <div className="categories__empty__icon">🧵</div>
            <p className="categories__empty__title">PRÓXIMAMENTE</p>
            <p className="categories__empty__subtitle">Estamos preparando la colección. Volvé pronto.</p>
            <button className="btn-back" onClick={() => navigate("/colecciones")} style={{ marginTop: "1.5rem" }}>
              Volver al inicio
            </button>
          </div>
        ) : (
          <div className="categories__grid">
            {filteredGarments.map((g, i) => {
              const coloredMock = g.svg_mock
                ? g.svg_mock
                    .replace(/\s(width|height)="[^"]*"/g, "")
                    .replace(/currentColor/gi, "var(--accent)")
                : null;
              return (
                <div
                  key={g.id}
                  className="category-card"
                  style={{ animationDelay: `${(i + 3) * 80}ms` }}
                  onClick={() => handleConfigure(g.slug)}
                >
                  <div className="category-card__media">
                    {coloredMock ? (
                      <div
                        className="category-card__mock-svg"
                        dangerouslySetInnerHTML={{ __html: coloredMock }}
                      />
                    ) : (
                      <span style={{ fontSize: "2rem", color: "var(--accent)" }}>{g.name[0]}</span>
                    )}
                    <span className="category-card__badge">{g.badge_label || "Nuevo"}</span>
                  </div>
                  <div className="category-card__info">
                    <h3 className="category-card__name">{g.name}</h3>
                    <p className="category-card__desc">{g.description}</p>
                    <span className="category-card__price">
                      Desde ${Number(g.base_price).toLocaleString("es-AR")}
                    </span>
                    <button
                      className="btn-buy-now"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfigure(g.slug);
                      }}
                    >
                      COMPRAR AHORA
                    </button>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      const isFav = isFavorite(g.id, "", "");
                      if (isFav) {
                        removeFavorite(g.id, "", "");
                      } else {
                        addFavorite({
                          garmentId: g.id,
                          garmentName: g.name,
                          garmentSlug: g.slug,
                          basePrice: g.base_price,
                          colorHex: "",
                          colorName: "",
                          size: "",
                        });
                      }
                    }}
                    aria-label={isFavorite(g.id, "", "") ? "Quitar de favoritos" : "Agregar a favoritos"}
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      zIndex: 5,
                      color: isFavorite(g.id, "", "") ? "#84cc16" : undefined,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill={isFavorite(g.id, "", "") ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}