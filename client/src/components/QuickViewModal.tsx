import { useState, useEffect } from "react";
import { supabase, type GarmentRow } from "../lib/supabase";
import GarmentMock from "../components/GarmentMock";
import { setMeta } from "../lib/seo";

interface Props {
  open: boolean;
  onClose: () => void;
  garmentId: number | null;
}

export default function QuickViewModal({ open, onClose, garmentId }: Props) {
  const [garment, setGarment] = useState<GarmentRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !garmentId) return;
    setLoading(true);
    supabase.from("garments").select("*").eq("id", garmentId).single().then(({ data, error }) => {
      if (error) console.error("Error loading garment:", error);
      if (data) setGarment(data);
      setLoading(false);
    });
  }, [open, garmentId]);

  useEffect(() => {
    if (garment) {
      setMeta({
        title: `${garment.name} · STORE`,
        description: `${garment.name} · ${garment.description}`,
      });
    }
  }, [garment]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{garment?.name ?? "Prenda"}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="skeleton skeleton--mock" />
        ) : garment ? (
          <>
            <div className="mock-section">
              <GarmentMock
                garmentId={garment.slug}
                color={garment.svg_mock ? "#1a1a1a" : "#f2f4f7"}
                svgMock={garment.svg_mock}
                svgMockBack={garment.svg_mock_back}
                hideFlip
              />
            </div>

            <div style={{ padding: "0 1.5rem 1.5rem", textAlign: "center" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {garment.description}
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--accent)", margin: "0 0 1rem" }}>
                Desde ${Number(garment.base_price).toLocaleString("es-AR")}
              </p>
              <button className="btn-primary" onClick={() => { onClose(); window.location.href = `/producto/${garment.slug}`; }}>
                Configurar prenda
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            Prenda no encontrada
          </div>
        )}
      </div>
    </div>
  );
}