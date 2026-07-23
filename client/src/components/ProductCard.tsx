import type { Product } from "../types";

const ADMIN_PHONE = "YOUR_PHONE_NUMBER";

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const firstVariant = product.variants[0];
  const media = firstVariant?.media[0];
  const hasVariants = product.variants.length > 0;

  const whatsappLink = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(
    `Me interesa el producto: ${product.name}`
  )}`;

  return (
    <article
      className="product-card"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="product-card__media">
        {media && media.type === "image" ? (
          <img src={media.url} alt={product.name} className="product-card__img" loading="lazy" />
        ) : (
          <div className="product-card__media-placeholder">
            {product.name.charAt(0)}
          </div>
        )}

        <div className="product-card__overlay">
          {product.description && (
            <p className="product-card__overlay-desc">{product.description}</p>
          )}
          {ADMIN_PHONE !== "YOUR_PHONE_NUMBER" && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="product-card__overlay-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Consultar
            </a>
          )}
        </div>
      </div>

      <div className="product-card__body">
        <h2 className="product-card__name">{product.name}</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="product-card__price">${product.price.toFixed(2)}</span>
          {hasVariants && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {firstVariant!.color} · {firstVariant!.size}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
