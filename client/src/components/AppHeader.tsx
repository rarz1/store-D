import { useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useFavorites } from "../lib/favorites";
import type { SiteSettings } from "../lib/settings";

interface Props {
  settings: SiteSettings | null;
  showBack?: boolean;
  title?: string;
  showHome?: boolean;
  hideFab?: boolean;
  variant?: "default" | "transparent";
  storeName?: string;
  bigStoreName?: boolean;
}

/* Shared icon set: same stroke style and size across every page header. */
const ICON_SIZE = 22;

export default function AppHeader({
  settings,
  showBack,
  title,
  showHome,
  hideFab,
  variant = "default",
  storeName,
  bigStoreName,
}: Props) {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { totalCount: totalFavs } = useFavorites();
  const isFloating = variant === "transparent";

  return (
    <>
      <header className={`app-header glass${isFloating ? " app-header--floating" : ""}`}>
        <div className="app-header__inner">
          <div className="app-header__left">
            {showBack ? (
              <button
                className="btn-icon"
                onClick={() => navigate(-1)}
                aria-label="Volver"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={ICON_SIZE} height={ICON_SIZE}>
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                className="app-header__logo-btn"
                onClick={() => navigate("/colecciones")}
                aria-label="Ir a la colección"
              >
                {settings?.logo_url && !storeName ? (
                  <img src={settings.logo_url} alt={settings.store_title} className="app-header__logo" />
                ) : (
                  <span
                    className={`app-header__store-name${bigStoreName ? " app-header__store-name--big" : ""}`}
                    title={storeName ?? settings?.store_title}
                  >
                    {storeName ?? settings?.store_title ?? "STORE"}
                  </span>
                )}
              </button>
            )}
          </div>

          {title && (
            <div className="app-header__title">{title}</div>
          )}

          <div className="app-header__right">
            {showHome && (
              <button
                className="btn-icon app-header__icon-btn"
                onClick={() => navigate("/")}
                aria-label="Volver a inicio"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={ICON_SIZE} height={ICON_SIZE}>
                  <path d="M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <button
              className="btn-icon app-header__icon-btn"
              onClick={() => navigate("/favoritos")}
              aria-label={`Favoritos, ${totalFavs} ${totalFavs === 1 ? "favorito" : "favoritos"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={ICON_SIZE} height={ICON_SIZE}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {totalFavs > 0 && (
                <span className="app-header__badge">{totalFavs > 999 ? "999+" : totalFavs}</span>
              )}
            </button>
            <button
              className="btn-icon app-header__icon-btn"
              onClick={() => navigate("/carrito")}
              aria-label={`Carrito, ${totalItems} ${totalItems === 1 ? "ítem" : "ítems"}`}
            >
              {/* Supermarket shopping cart */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={ICON_SIZE} height={ICON_SIZE}>
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.5 3h2l2.4 12.2a1.8 1.8 0 001.8 1.4h8.6a1.8 1.8 0 001.8-1.4L22.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {totalItems > 0 && (
                <span className="app-header__badge">{totalItems > 999 ? "999+" : totalItems}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {!hideFab && totalItems > 0 && (
        <button className="fab-cart" onClick={() => navigate("/carrito")} aria-label="Abrir carrito" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <circle cx="9" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.5 3h2l2.4 12.2a1.8 1.8 0 001.8 1.4h8.6a1.8 1.8 0 001.8-1.4L22.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="fab-cart__badge">{totalItems > 999 ? "999+" : totalItems}</span>
        </button>
      )}
    </>
  );
}
