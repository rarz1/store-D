import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  garmentSlug?: string;
}

type GarmentCategory = "remeras" | "buzos" | "pantalones";

interface MeasurementRow {
  size: string;
  chestOrWaist: string;
  length: string;
  shoulderOrHip: string;
}

const MEASUREMENTS: Record<GarmentCategory, { title: string; chestLabel: string; shoulderLabel: string; rows: MeasurementRow[] }> = {
  remeras: {
    title: "Remeras Oversize",
    chestLabel: "Ancho Pecho",
    shoulderLabel: "Hombro a Hombro",
    rows: [
      { size: "S", chestOrWaist: "54 cm", length: "70 cm", shoulderOrHip: "50 cm" },
      { size: "M", chestOrWaist: "57 cm", length: "73 cm", shoulderOrHip: "53 cm" },
      { size: "L", chestOrWaist: "60 cm", length: "76 cm", shoulderOrHip: "56 cm" },
      { size: "XL", chestOrWaist: "63 cm", length: "79 cm", shoulderOrHip: "59 cm" },
      { size: "XXL", chestOrWaist: "66 cm", length: "82 cm", shoulderOrHip: "62 cm" },
    ],
  },
  buzos: {
    title: "Buzos Hoodie Oversize",
    chestLabel: "Ancho Sisa",
    shoulderLabel: "Largo Manga",
    rows: [
      { size: "S", chestOrWaist: "58 cm", length: "68 cm", shoulderOrHip: "60 cm" },
      { size: "M", chestOrWaist: "61 cm", length: "71 cm", shoulderOrHip: "62 cm" },
      { size: "L", chestOrWaist: "64 cm", length: "74 cm", shoulderOrHip: "64 cm" },
      { size: "XL", chestOrWaist: "67 cm", length: "77 cm", shoulderOrHip: "66 cm" },
      { size: "XXL", chestOrWaist: "70 cm", length: "80 cm", shoulderOrHip: "68 cm" },
    ],
  },
  pantalones: {
    title: "Pantalones / Shorts",
    chestLabel: "Cintura (Elástico)",
    shoulderLabel: "Cadera",
    rows: [
      { size: "S", chestOrWaist: "34 - 42 cm", length: "42 cm", shoulderOrHip: "52 cm" },
      { size: "M", chestOrWaist: "36 - 45 cm", length: "44 cm", shoulderOrHip: "55 cm" },
      { size: "L", chestOrWaist: "38 - 48 cm", length: "46 cm", shoulderOrHip: "58 cm" },
      { size: "XL", chestOrWaist: "40 - 51 cm", length: "48 cm", shoulderOrHip: "61 cm" },
      { size: "XXL", chestOrWaist: "42 - 54 cm", length: "50 cm", shoulderOrHip: "64 cm" },
    ],
  },
};

export default function SizeGuideModal({ open, onClose, garmentSlug }: Props) {
  const initialCategory: GarmentCategory =
    garmentSlug && garmentSlug in MEASUREMENTS ? (garmentSlug as GarmentCategory) : "remeras";
  
  const [activeTab, setActiveTab] = useState<GarmentCategory>(initialCategory);

  if (!open) return null;

  const currentData = MEASUREMENTS[activeTab];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content size-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Guía de Talles y Medidas</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar guía">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Garment Selector Tabs */}
        <div className="size-guide-tabs">
          <button
            className={`size-guide-tab${activeTab === "remeras" ? " size-guide-tab--active" : ""}`}
            onClick={() => setActiveTab("remeras")}
            type="button"
          >
            Remeras
          </button>
          <button
            className={`size-guide-tab${activeTab === "buzos" ? " size-guide-tab--active" : ""}`}
            onClick={() => setActiveTab("buzos")}
            type="button"
          >
            Buzos
          </button>
          <button
            className={`size-guide-tab${activeTab === "pantalones" ? " size-guide-tab--active" : ""}`}
            onClick={() => setActiveTab("pantalones")}
            type="button"
          >
            Pantalones
          </button>
        </div>

        <div className="size-guide-body">
          <h4 className="size-guide-title">{currentData.title}</h4>
          <p className="size-guide-subtitle">Medidas expresadas sobre la prenda plana (sin estirar).</p>

          <div className="size-guide-table-wrapper">
            <table className="size-guide-table">
              <thead>
                <tr>
                  <th>Talle</th>
                  <th>{currentData.chestLabel}</th>
                  <th>Largo Total</th>
                  <th>{currentData.shoulderLabel}</th>
                </tr>
              </thead>
              <tbody>
                {currentData.rows.map((r) => (
                  <tr key={r.size}>
                    <td className="size-guide-cell--size">{r.size}</td>
                    <td>{r.chestOrWaist}</td>
                    <td>{r.length}</td>
                    <td>{r.shoulderOrHip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="size-guide-tip">
            <strong>💡 Tip de calce:</strong> Si preferís un corte <em>very oversize</em> o dudas entre dos talles, te recomendamos elegir el talle mayor.
          </div>
        </div>
      </div>
    </div>
  );
}
