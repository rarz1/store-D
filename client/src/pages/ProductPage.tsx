import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GARMENTS } from "../data/garments";
import GarmentMock from "../components/GarmentMock";
import {
  DesignGeometric,
  DesignFloral,
  DesignWave,
  DesignTypo,
  DesignSilhouette,
  DesignMandala,
} from "../assets/designs/DesignComponents";

const DESIGN_PREVIEW_COLORS = [
  "#ffffff", "#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ef4444",
];

const designComponents: Record<string, React.ComponentType<{ color: string }>> = {
  geometric: DesignGeometric,
  floral: DesignFloral,
  wave: DesignWave,
  typo: DesignTypo,
  silhouette: DesignSilhouette,
  mandala: DesignMandala,
};

export default function ProductPage() {
  const { garmentId } = useParams<{ garmentId: string }>();
  const navigate = useNavigate();

  const garment = useMemo(
    () => GARMENTS.find((g) => g.id === garmentId),
    [garmentId]
  );

  const [color, setColor] = useState(garment?.colors[0]?.hex ?? "#1a1a1a");
  const [size, setSize] = useState(garment?.sizes[0] ?? "M");
  const [designId, setDesignId] = useState<string | null>(null);

  if (!garment) {
    return (
      <div className="product-page product-page--empty">
        <p>Prenda no encontrada</p>
        <button className="btn-back" onClick={() => navigate("/")}>
          Volver al inicio
        </button>
      </div>
    );
  }

  const selectedDesign = garment.designs.find((d) => d.id === designId);
  const totalPrice = garment.basePrice;

  const whatsappMessage = encodeURIComponent(
    `Hola! Quiero consultar por:\n` +
    `• Prenda: ${garment.name}\n` +
    `• Color: ${garment.colors.find((c) => c.hex === color)?.name ?? color}\n` +
    `• Talle: ${size}\n` +
    (selectedDesign ? `• Diseño: ${selectedDesign.name}\n` : "") +
    `• Precio: $${totalPrice.toLocaleString("es-AR")}`
  );

  const handleShare = async () => {
    const shareData = {
      title: `${garment.name} · STORE`,
      text: `Mirá esta prenda: ${garment.name} en STORE`,
      url: window.location.href,
    };
    try {
      await navigator.share(shareData);
    } catch {
      // fallback
    }
  };

  const showShare = typeof navigator.share === "function";

  return (
    <div className="product-page">
      <header className="product-header">
        <button className="btn-icon" onClick={() => navigate("/")} aria-label="Volver">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="product-header__info">
          <h1 className="product-header__title">{garment.name}</h1>
          <span className="product-header__price">${totalPrice.toLocaleString("es-AR")}</span>
        </div>
        {showShare && (
          <button className="btn-icon" onClick={handleShare} aria-label="Compartir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </header>

      <div className="product-content">
        <div className="mock-section">
          <GarmentMock
            garmentId={garment.id}
            color={color}
            designId={designId}
          />
        </div>

        <div className="controls-section">
          <div className="control-group">
            <label className="control-label">COLOR</label>
            <div className="color-selector">
              {garment.colors.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch${color === c.hex ? " color-swatch--active" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setColor(c.hex)}
                  aria-label={c.name}
                  title={c.name}
                >
                  {color === c.hex && (
                    <svg viewBox="0 0 12 12" fill="none" width="14" height="14">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke={c.hex === "#f0f0f0" || c.hex === "#ffffff" ? "#1a1a1a" : "#fff"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">TALLE</label>
            <div className="size-selector">
              {garment.sizes.map((s) => (
                <button
                  key={s}
                  className={`size-chip${size === s ? " size-chip--active" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">
              DISEÑO
              {designId && (
                <span
                  className="control-clear"
                  onClick={() => setDesignId(null)}
                >
                  Quitar
                </span>
              )}
            </label>
            <div className="design-selector">
              {garment.designs.map((d, i) => {
                const DesignPreview = designComponents[d.id];
                return (
                  <button
                    key={d.id}
                    className={`design-card${designId === d.id ? " design-card--active" : ""}`}
                    onClick={() => setDesignId(d.id)}
                  >
                    <div className="design-card__preview">
                      <div className="design-card__svg">
                        {DesignPreview && (
                          <DesignPreview color={DESIGN_PREVIEW_COLORS[i % DESIGN_PREVIEW_COLORS.length]} />
                        )}
                      </div>
                    </div>
                    <span className="design-card__name">{d.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="product-footer">
        <a
          href={`https://wa.me/YOUR_PHONE_NUMBER?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
