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
    <div className="cart-item">
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
      <div className="cart-item__info">
        <strong className="cart-item__name">{fav.garmentName}</strong>
        <span className="cart-item__meta">{fav.colorName} · Talla {fav.size}</span>
        <span className="cart-item__price">${fav.basePrice.toLocaleString("es-AR")}</span>
        <button className="btn-small" onClick={() => navigate(`/producto/${fav.garmentSlug}`)} type="button">
          Ver prenda
        </button>
      </div>
      <button
        className="cart-item__remove"
        onClick={() => removeFavorite(fav.garmentId, fav.colorHex, fav.size)}
        aria-label="Quitar de favoritos"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
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