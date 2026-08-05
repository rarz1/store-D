import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useFavorites } from "../lib/favorites";
import type { SiteSettings } from "../lib/settings";

interface Props {
  settings: SiteSettings | null;
  showBack?: boolean;
  title?: string;
  showFavorites?: boolean;
}

export default function AppHeader({ settings, showBack, title, showFavorites = true }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const { favorites } = useFavorites();
  const isHome = location.pathname === "/";

  return (
    <>
      <header className={`app-header glass${isHome ? " app-header--floating" : ""}`}>
        <div className="app-header__inner">
          <div className="app-header__left">
            {showBack ? (
              <button
                className="btn-icon"
                onClick={() => navigate("/")}
                aria-label="Volver al inicio"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                className="app-header__logo-btn"
                onClick={() => navigate("/")}
                aria-label="Ir al inicio"
              >
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt={settings.store_title} className="app-header__logo" />
                ) : (
                  <span className="app-header__store-name">{settings?.store_title ?? "STORE"}</span>
                )}
              </button>
            )}
          </div>

          {title && (
            <div className="app-header__title">{title}</div>
          )}

          <div className="app-header__right">
            {showFavorites && (
              <button
                className="app-header__cart"
                onClick={() => navigate("/favoritos")}
                aria-label={`Favoritos, ${favorites.length} ${favorites.length === 1 ? "ítem" : "ítems"}`}
                style={{ position: "relative" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {favorites.length > 0 && (
                  <span className="app-header__badge">{favorites.length > 9 ? "9+" : favorites.length}</span>
                )}
              </button>
            )}
            <button
              className="app-header__cart"
              onClick={openCart}
              aria-label={`Carrito, ${totalItems} ${totalItems === 1 ? "ítem" : "ítems"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none" />
                <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none" />
              </svg>
              {totalItems > 0 && (
                <span className="app-header__badge">{totalItems > 9 ? "9+" : totalItems}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {totalItems > 0 && (
        <button className="fab-cart" onClick={openCart} aria-label="Abrir carrito" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none" />
            <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span className="fab-cart__badge">{totalItems > 9 ? "9+" : totalItems}</span>
        </button>
      )}
    </>
  );
}
