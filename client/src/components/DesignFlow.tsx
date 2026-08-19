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
  onClose?: () => void;
}

type Step = "clase" | "tipo" | "size" | "location";

const STEPS: { id: Step; label: string }[] = [
  { id: "clase", label: "Elegí categoría" },
  { id: "tipo", label: "Elegí diseño" },
  { id: "size", label: "Elegí tamaño" },
  { id: "location", label: "Elegí ubicación" },
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
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("clase");
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  const selectedClase = estampados.find((e) => e.id === selectedClaseId) ?? null;
  const tipos = selectedClaseId ? (tiposByClase[selectedClaseId] ?? []) : [];
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId) ?? null;
  const selectedSizeObj = stampSizes.find((s) => s.id === selectedSizeId) ?? null;

  // Free placement is the only option: reaching the "location" step activates
  // the drag on the garment mock pinned above the bottom sheet.
  useEffect(() => {
    if (step === "location") {
      onCustomModeChange(true);
      onCustomPosChange({ x: 50, y: 50 });
      onCustomSideChange("front");
    } else {
      onCustomModeChange(false);
      onCustomPosChange(null);
      onCustomSideChange("front");
    }
  }, [step, onCustomModeChange, onCustomPosChange, onCustomSideChange]);

  // Emit preview of the currently selected (but unconfirmed) design so
  // ProductPage can render it as the draggable design on the garment mock.
  useEffect(() => {
    if (step === "location" && selectedTipo && customPos) {
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
  }, [step, selectedTipo, selectedClase, selectedSizeObj, customPos, customSide, onPreviewChange]);

  const handleSelectClase = (id: number) => {
    setSelectedClaseId(id);
    setSelectedTipoId(null);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
    setStep("tipo");
    onSelectClase(id);
  };

  const handleSelectTipo = (id: number) => {
    setSelectedTipoId(id);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
    setStep("size");
  };

  const handleSelectSize = (id: number) => {
    setSelectedSizeId(id);
    setStep("location");
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
    setStep("clase");
    onPreviewChange?.(null);
  };

  const currentStepIdx = STEPS.findIndex((item) => item.id === step);

  const canGoToStep = (targetStep: Step) => {
    if (targetStep === "clase") return true;
    if (targetStep === "tipo") return selectedClaseId !== null;
    if (targetStep === "size") return selectedTipoId !== null;
    if (targetStep === "location") return selectedSizeId !== null;
    return false;
  };

  return (
    <div className="design-flow">
      <div className="design-flow__header">
        <span className="design-flow__header-title">Personalizá tu estampado</span>
        {onClose && (
          <button className="design-flow__close" onClick={onClose} type="button" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {estampados.length === 0 && (
        <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>No hay diseños disponibles</p>
      )}

      {estampados.length > 0 && (
        <>
          {/* M2: Stepper UI */}
          <div className="design-flow__stepper">
            {STEPS.map((s, idx) => {
              const isDone = idx < currentStepIdx;
              const isActive = step === s.id;
              const enabled = canGoToStep(s.id);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", flex: idx < STEPS.length - 1 ? 1 : "initial" }}>
                  <button
                    className={`stepper-step${isDone ? " stepper-step--done" : ""}${isActive ? " stepper-step--active" : ""}`}
                    onClick={() => enabled && setStep(s.id)}
                    disabled={!enabled}
                    type="button"
                  >
                    <span className="stepper-step__dot">{isDone ? "✓" : idx + 1}</span>
                    <span className="stepper-step__label">{s.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`stepper-connector${idx < currentStepIdx ? " stepper-connector--done" : ""}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="design-flow__body">
            {step === "clase" && (
              <EstampadoSelector
                estampados={estampados}
                selectedId={selectedClaseId}
                onSelect={handleSelectClase}
              />
            )}

            {step === "tipo" && (
              <div className="control-group">
                <span className="control-label">TIPO DE {selectedClase?.name.toUpperCase()}</span>
                {tipos.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>
                    No hay diseños en esta categoría
                  </p>
                ) : (
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
                )}
              </div>
            )}

            {step === "size" && (
              <div className="control-group">
                <span className="control-label">TAMAÑO DEL ESTAMPADO</span>
                {stampSizes.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>
                    No hay tamaños disponibles para este estampado
                  </p>
                ) : (
                  <SizeSelector
                    sizes={stampSizes}
                    selectedId={selectedSizeId}
                    onSelect={handleSelectSize}
                  />
                )}
              </div>
            )}

            {step === "location" && (
              <div className="design-flow__confirm">
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}