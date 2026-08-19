import { useState, useEffect } from "react";
import type { EstampadoRow, DisenoTipoRow, EstampadoSizeRow, EstampadoLocationRow } from "../lib/supabase";
import EstampadoSelector from "./EstampadoSelector";
import SizeSelector from "./SizeSelector";

export interface CustomPosition {
  x: number;
  y: number;
}

interface PlacedEstampado {
  estampado: EstampadoRow;
  tipo: DisenoTipoRow;
  size: EstampadoSizeRow;
  locations: EstampadoLocationRow[];
  customPosition?: CustomPosition | null;
  side?: "front" | "back";
}

export interface PreviewEstampado {
  svgContent: string;
  locations: EstampadoLocationRow[];
  name: string;
  imageUrl?: string;
  customPosition?: CustomPosition | null;
  widthPercent?: number;
  side?: "front" | "back";
}

interface Props {
  estampados: EstampadoRow[];
  tiposByClase: Record<number, DisenoTipoRow[]>;
  stampSizes: EstampadoSizeRow[];
  onAdd: (item: PlacedEstampado) => void;
  onSelectClase: (claseId: number) => void;
  onPreviewChange?: (preview: PreviewEstampado | null) => void;
  customMode: boolean;
  customPos: CustomPosition | null;
  customSide: "front" | "back";
  onCustomModeChange: (mode: boolean) => void;
  onCustomPosChange: (pos: CustomPosition | null) => void;
  onCustomSideChange: (side: "front" | "back") => void;
}

type Tab = "diseno" | "tamano" | "ubicacion";

const TABS: { id: Tab; label: string }[] = [
  { id: "diseno", label: "Diseño" },
  { id: "tamano", label: "Tamaño" },
  { id: "ubicacion", label: "Ubicación" },
];

export default function DesignFlow({
  estampados,
  tiposByClase,
  stampSizes,
  onAdd,
  onSelectClase,
  onPreviewChange,
  customPos,
  customSide,
  onCustomModeChange,
  onCustomPosChange,
  onCustomSideChange,
}: Props) {
  const [tab, setTab] = useState<Tab>("diseno");
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  const selectedClase = estampados.find((e) => e.id === selectedClaseId) ?? null;
  const tipos = selectedClaseId ? (tiposByClase[selectedClaseId] ?? []) : [];
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId) ?? null;
  const selectedSizeObj = stampSizes.find((s) => s.id === selectedSizeId) ?? null;

  const disenoDone = selectedClaseId !== null && selectedTipoId !== null;
  const tamanoDone = selectedSizeId !== null;

  // Free placement is the only option: reaching the "ubicacion" tab activates
  // the drag on the main garment mock in ProductPage.
  useEffect(() => {
    if (tab === "ubicacion") {
      onCustomModeChange(true);
      onCustomPosChange({ x: 50, y: 50 });
      onCustomSideChange("front");
    } else {
      onCustomModeChange(false);
      onCustomPosChange(null);
      onCustomSideChange("front");
    }
  }, [tab, onCustomModeChange, onCustomPosChange, onCustomSideChange]);

  // Emit preview of the currently selected (but unconfirmed) design so
  // ProductPage can render it as the draggable design on the garment mock.
  useEffect(() => {
    if (tab === "ubicacion" && selectedTipo && customPos) {
      onPreviewChange?.({
        svgContent: selectedTipo.svg_content || selectedClase?.svg_content || "",
        imageUrl: selectedTipo.image_url || undefined,
        locations: [],
        customPosition: customPos,
        widthPercent: selectedSizeObj?.width_percent ?? 40,
        name: `${selectedClase?.name ?? ""} · ${selectedTipo.name}`,
        side: customSide,
      });
    } else {
      onPreviewChange?.(null);
    }
  }, [tab, selectedTipo, selectedClase, selectedSizeObj, customPos, customSide, onPreviewChange]);

  const handleSelectClase = (id: number) => {
    setSelectedClaseId(id);
    setSelectedTipoId(null);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
    onSelectClase(id);
  };

  const handleSelectTipo = (id: number) => {
    setSelectedTipoId(id);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
  };

  const handleConfirm = () => {
    if (!selectedClase || !selectedTipo || !selectedSizeObj) return;
    if (!customPos) return;
    onAdd({
      estampado: selectedClase,
      tipo: selectedTipo,
      size: selectedSizeObj,
      locations: [],
      customPosition: customPos,
      side: customSide,
    });
    setSelectedClaseId(null);
    setSelectedTipoId(null);
    setSelectedSizeId(null);
    setTab("diseno");
    onPreviewChange?.(null);
  };

  return (
    <div className="design-flow">
      <div className="design-flow__tabs">
        {TABS.map((t) => {
          const done = t.id === "diseno" ? disenoDone : t.id === "tamano" ? tamanoDone : false;
          return (
            <button
              key={t.id}
              className={`design-flow__tab${tab === t.id ? " design-flow__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              <span className="design-flow__tab-name">{t.label}</span>
              {done && <span className="design-flow__tab-check">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="design-flow__body">
        {tab === "diseno" && (
          <>
            <EstampadoSelector
              estampados={estampados}
              selectedId={selectedClaseId}
              onSelect={handleSelectClase}
            />
            {selectedClase && (
              <div className="control-group">
                <span className="control-label">TIPO DE {selectedClase.name.toUpperCase()}</span>
                <div className="estampado-grid">
                  {tipos.map((t) => (
                    <button
                      key={t.id}
                      className={`estampado-card${selectedTipoId === t.id ? " estampado-card--active" : ""}`}
                      onClick={() => handleSelectTipo(t.id)}
                      type="button"
                    >
                      <div className="estampado-card__preview">
                        {t.image_url ? (
                          <img src={t.image_url} alt={t.name} loading="lazy" decoding="async" />
                        ) : t.svg_content ? (
                          <div className="estampado-card__svg"
                            dangerouslySetInnerHTML={{ __html: t.svg_content.replace(/currentColor/gi, "var(--accent)") }}
                          />
                        ) : (
                          <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>?</span>
                        )}
                      </div>
                      <div className="estampado-card__info">
                        <span className="estampado-card__name">{t.name}</span>
                        {t.description && <span className="estampado-card__desc">{t.description}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "tamano" && (
          <div className="control-group">
            <span className="control-label">TAMAÑO DEL ESTAMPADO</span>
            <SizeSelector sizes={stampSizes} selectedId={selectedSizeId} onSelect={setSelectedSizeId} />
          </div>
        )}

        {tab === "ubicacion" && (
          <div className="design-flow__confirm">
            {disenoDone && tamanoDone ? (
              <>
                <p className="text-muted" style={{ fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                  Arrastrá el diseño directamente sobre la prenda para ubicarlo donde quieras.
                  Usá la vista frontal o posterior para elegir la cara.
                </p>
                <button
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "0.75rem" }}
                  onClick={handleConfirm}
                  disabled={!customPos}
                  type="button"
                >
                  Confirmar estampado
                </button>
              </>
            ) : (
              <p className="text-muted" style={{ fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>
                Completá diseño y tamaño para elegir la ubicación.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}