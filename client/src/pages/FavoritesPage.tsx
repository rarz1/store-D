import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import GarmentMock from "../components/GarmentMock";
import { useFavorites, type FavoriteItem } from "../lib/favorites";
import { useGarment } from "../lib/hooks";
import { setMeta } from "../lib/seo";

function FavoriteCard({ fav }: { fav: FavoriteItem }) {
  const navigate = useNavigate();
  const { removeFavorite } = useFavorites();
  const { data: garment } = useGarment(fav.garmentSlug);

  return (
    <div className="cart-item fav-item">
      <div className="fav-item__thumb-col">
        <div className="cart-item__thumb">
          {garment ? (
            <GarmentMock
              garmentId={fav.garmentSlug}
              color={fav.colorHex}
              svgMock={garment.svg_mock}
              svgMockBack={garment.svg_mock_back}
              placedDesigns={[]}
              side="front"
              hideFlip
            />
          ) : (
            <div className="skeleton skeleton--mock" />
          )}
        </div>
      </div>
      <div className="cart-item__info">
        <strong className="cart-item__name">{fav.garmentName}</strong>
        <span className="cart-item__meta">
          Color: {fav.colorName} – Talla: {fav.size}
        </span>
        <span className="cart-item__meta">
          ${Number(fav.basePrice).toLocaleString("es-AR")}
        </span>
      </div>
      <div className="cart-item__side">
        <button
          className="cart-item__remove cart-item__remove--neon"
          onClick={() => removeFavorite(fav.garmentId, fav.colorHex, fav.size)}
          aria-label="Quitar de favoritos"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="cart-item__remove cart-item__remove--neon"
          onClick={() => navigate(`/producto/${fav.garmentSlug}`)}
          aria-label="Ver la prenda"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="26" height="26">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites } = useFavorites();

  useEffect(() => {
    setMeta({ title: "Favoritos · STORE", description: "Tus prendas favoritas." });
  }, []);

  return (
    <div className="cart-page page-enter">
      <AppHeader settings={null} title="Favoritos" showBack />

      <div className="cart-page__body">
        {favorites.length === 0 ? (
          <div className="cart-empty">
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>♡</span>
            <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "var(--text)" }}>Todavía no tenés favoritos</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              Tocá el corazón en una prenda para guardarla acá
            </p>
            <button className="btn-primary" onClick={() => navigate("/colecciones")}>
              Explorar colección
            </button>
          </div>
        ) : (
          <div className="cart-items">
            {favorites.map((fav) => (
              <FavoriteCard key={`${fav.garmentId}-${fav.colorHex}-${fav.size}`} fav={fav} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}