import { useState, useEffect } from "react";
import type { EstampadoRow, DisenoTipoRow, EstampadoSizeRow, EstampadoLocationRow } from "../lib/supabase";
import EstampadoSelector from "./EstampadoSelector";
import SizeSelector from "./SizeSelector";
import LocationSelector from "./LocationSelector";
import GarmentMock from "./GarmentMock";

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
}

export interface PreviewEstampado {
  svgContent: string;
  locations: EstampadoLocationRow[];
  name: string;
  imageUrl?: string;
  customPosition?: CustomPosition | null;
  widthPercent?: number;
}

interface Props {
  estampados: EstampadoRow[];
  tiposByClase: Record<number, DisenoTipoRow[]>;
  stampSizes: EstampadoSizeRow[];
  stampLocations: EstampadoLocationRow[];
  onAdd: (item: PlacedEstampado) => void;
  onOpenHelp: () => void;
  onSelectClase: (claseId: number) => void;
  onPreviewChange?: (preview: PreviewEstampado | null) => void;
  garmentId?: string;
  color?: string;
  svgMock?: string;
  svgMockBack?: string;
}

type Step = "closed" | "clase" | "tipo" | "size" | "location";

const STEPS: { id: Step; label: string }[] = [
  { id: "clase", label: "Categoría" },
  { id: "tipo", label: "Diseño" },
  { id: "size", label: "Escala" },
  { id: "location", label: "Ubicación" },
];

export default function DesignFlow({
  estampados,
  tiposByClase,
  stampSizes,
  stampLocations,
  onAdd,
  onOpenHelp,
  onSelectClase,
  onPreviewChange,
  garmentId,
  color,
  svgMock,
  svgMockBack,
}: Props) {
  const [step, setStep] = useState<Step>("closed");
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [customMode, setCustomMode] = useState(false);
  const [customPos, setCustomPos] = useState<CustomPosition | null>({ x: 50, y: 50 });

  const selectedClase = estampados.find((e) => e.id === selectedClaseId) ?? null;
  const tipos = selectedClaseId ? (tiposByClase[selectedClaseId] ?? []) : [];
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId) ?? null;
  const selectedSizeObj = stampSizes.find((s) => s.id === selectedSizeId) ?? null;
  const selectedLocations = stampLocations.filter((l) => selectedLocationIds.includes(l.id));

  // M3: Emit preview of currently selected but unconfirmed stamp design
  useEffect(() => {
    if (step !== "closed" && selectedTipo && (selectedLocations.length > 0 || (customMode && customPos))) {
      onPreviewChange?.({
        svgContent: selectedTipo.svg_content || selectedClase?.svg_content || "",
        imageUrl: selectedTipo.image_url || undefined,
        locations: selectedLocations,
        customPosition: customMode ? customPos : null,
        widthPercent: selectedSizeObj?.width_percent ?? 40,
        name: `${selectedClase?.name ?? ""} · ${selectedTipo.name}`,
      });
    } else {
      onPreviewChange?.(null);
    }
  }, [step, selectedTipo, selectedLocations, selectedClase, selectedSizeObj, customMode, customPos, onPreviewChange]);

  const handleSelectClase = (id: number) => {
    setSelectedClaseId(id);
    setSelectedTipoId(null);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
    setSelectedLocationIds([]);
    setCustomMode(false);
    setCustomPos(null);
    setStep("tipo");
    onSelectClase(id);
  };

  const handleSelectTipo = (id: number) => {
    setSelectedTipoId(id);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
    setSelectedLocationIds([]);
    setCustomMode(false);
    setCustomPos(null);
    setStep("size");
  };

  const handleSelectSize = (id: number) => {
    setSelectedSizeId(id);
    setSelectedLocationIds([]);
    setCustomMode(false);
    setCustomPos({ x: 50, y: 50 });
    setStep("location");
  };

  const handleToggleLocation = (id: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setCustomMode(false);
    setCustomPos(null);
  };

  const handleToggleCustom = () => {
    if (customMode) {
      setCustomMode(false);
      setCustomPos(null);
    } else {
      setCustomMode(true);
      setSelectedLocationIds([]);
      setCustomPos({ x: 50, y: 50 });
    }
  };

  const handleConfirm = () => {
    if (!selectedClase || !selectedTipo || !selectedSizeObj) return;
    if (customMode && !customPos) return;
    onAdd({
      estampado: selectedClase,
      tipo: selectedTipo,
      size: selectedSizeObj,
      locations: customMode ? [] : selectedLocations,
      customPosition: customMode ? customPos : null,
    });
    setSelectedClaseId(null);
    setSelectedTipoId(null);
    setSelectedSizeId(null);
    setSelectedLocationIds([]);
    setCustomMode(false);
    setCustomPos(null);
    setStep("closed");
    onPreviewChange?.(null);
  };

  const toggleOpen = () => setStep(step === "closed" ? "clase" : "closed");

  const getStepIndex = (s: Step) => STEPS.findIndex((item) => item.id === s);
  const currentStepIdx = getStepIndex(step);

  const canGoToStep = (targetStep: Step) => {
    if (targetStep === "clase") return true;
    if (targetStep === "tipo") return selectedClaseId !== null;
    if (targetStep === "size") return selectedTipoId !== null;
    if (targetStep === "location") return selectedSizeId !== null;
    return false;
  };

  return (
    <div className="design-flow">
      <div className="control-group">
        <div className="control-group__header control-group__header--clickable" onClick={toggleOpen}>
          <span className="control-label">PERSONALIZÁ TU PRENDA</span>
          <button className="btn-small btn-small--help" onClick={(e) => { e.stopPropagation(); onOpenHelp(); }} title="¿Cómo funciona?">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {step !== "closed" && estampados.length === 0 && (
          <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>No hay diseños disponibles</p>
        )}

        {step !== "closed" && estampados.length > 0 && (
          <>
            <button className="choice-btn" onClick={toggleOpen} style={{ marginBottom: "0.75rem" }}>
              <span className="choice-btn__label">Diseño</span>
              <span className="choice-btn__value">
                {selectedClase ? `${selectedClase.name}${selectedTipo ? ` · ${selectedTipo.name}` : ""}${selectedSizeObj ? ` (${selectedSizeObj.name})` : ""}` : "Elegir diseño"}
              </span>
              <svg className="choice-btn__arrow choice-btn__arrow--open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

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

              {(step === "size" || step === "location") && (
                <SizeSelector
                  sizes={stampSizes}
                  selectedId={selectedSizeId}
                  onSelect={handleSelectSize}
                />
              )}

              {step === "location" && (
                <div className="design-flow__confirm">
                  <LocationSelector
                    locations={stampLocations}
                    selectedIds={selectedLocationIds}
                    onToggle={handleToggleLocation}
                    onCustomToggle={handleToggleCustom}
                    customActive={customMode}
                  />
                  {customMode && garmentId && color && (
                    <div className="design-flow__drag">
                      <span className="control-label" style={{ marginBottom: "0.25rem", display: "block" }}>ARRÁSTRÁ EL DISEÑO SOBRE LA PRENDA</span>
                      <GarmentMock
                        garmentId={garmentId}
                        color={color}
                        svgMock={svgMock}
                        svgMockBack={svgMockBack}
                        draggable
                        dragDesign={{
                          imageUrl: selectedTipo?.image_url || undefined,
                          svgContent: selectedTipo?.svg_content || selectedClase?.svg_content || "",
                          widthPercent: selectedSizeObj?.width_percent ?? 40,
                          position: customPos ?? { x: 50, y: 50 },
                        }}
                        onDragPosition={setCustomPos}
                      />
                      <p className="text-muted" style={{ fontSize: "0.75rem", textAlign: "center", margin: "0.25rem 0 0" }}>
                        Tamaño: {selectedSizeObj?.name} — mantené pulsado y mové sobre la prenda
                      </p>
                    </div>
                  )}
                  <button
                    className="btn-primary"
                    style={{ width: "100%", marginTop: "0.75rem" }}
                    onClick={handleConfirm}
                    disabled={!customMode ? selectedLocationIds.length === 0 : !customPos}
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
    </div>
  );
}
