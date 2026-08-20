import { useState } from "react";
import type { EstampadoRow, DisenoTipoRow, EstampadoSizeRow, EstampadoLocationRow } from "../lib/supabase";
import EstampadoSelector from "./EstampadoSelector";
import SizeSelector from "./SizeSelector";
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
  side?: "front" | "back";
}

interface MockDesign {
  variantId: number;
  svgContent: string;
  imageUrl?: string;
  position: "small_front" | "small_front_right" | "large_front" | "small_back" | "large_back" | "sleeve";
  customPosition?: CustomPosition;
  widthPercent?: number;
  side?: "front" | "back";
  name: string;
}

interface Props {
  estampados: EstampadoRow[];
  tiposByClase: Record<number, DisenoTipoRow[]>;
  stampSizes: EstampadoSizeRow[];
  garmentId: string;
  color: string;
  svgMock?: string;
  svgMockBack?: string;
  placedDesigns: MockDesign[];
  onAdd: (item: PlacedEstampado) => void;
  onSelectClase: (claseId: number) => void;
  onClose?: () => void;
}

type Step = "clase" | "tipo" | "diseno" | "size" | "location";

export default function DesignFlow({
  estampados,
  tiposByClase,
  stampSizes,
  garmentId,
  color,
  svgMock,
  svgMockBack,
  placedDesigns,
  onAdd,
  onSelectClase,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("clase");
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [customPos, setCustomPos] = useState<CustomPosition | null>(null);
  const [customSide, setCustomSide] = useState<"front" | "back">("front");

  const selectedClase = estampados.find((e) => e.id === selectedClaseId) ?? null;
  const tipos = selectedClaseId ? (tiposByClase[selectedClaseId] ?? []) : [];
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId) ?? null;
  const selectedSizeObj = stampSizes.find((s) => s.id === selectedSizeId) ?? null;

  const isPlacement = step === "size" || step === "location";
  const isDragging = step === "location" && !!selectedSizeObj;

  // Design being dragged/previewed on the garment mock during placement.
  const dragDesign = selectedSizeObj && selectedTipo
    ? {
        imageUrl: selectedTipo.image_url || undefined,
        svgContent: selectedTipo.svg_content || selectedClase?.svg_content || "",
        widthPercent: selectedSizeObj.width_percent,
        position: customPos ?? { x: 50, y: 50 },
      }
    : null;

  const handleSelectClase = (id: number) => {
    setSelectedClaseId(id);
    setSelectedTipoId(null);
    setStep("tipo");
    onSelectClase(id);
  };

  const handleSelectTipo = (id: number) => {
    setSelectedTipoId(id);
    setStep("diseno");
  };

  const handleSelectSize = (id: number) => {
    setSelectedSizeId(id);
    if (step === "size") {
      setCustomPos({ x: 50, y: 50 });
      setCustomSide("front");
      setStep("location");
    }
  };

  const handleConfirm = () => {
    if (!selectedClase || !selectedTipo || !selectedSizeObj) return;
    onAdd({
      estampado: selectedClase,
      tipo: selectedTipo,
      size: selectedSizeObj,
      locations: [],
      customPosition: customPos ?? { x: 50, y: 50 },
      side: customSide,
    });
  };

  const goBack = () => {
    if (isPlacement) {
      setStep("diseno");
      setSelectedSizeId(null);
      setCustomPos(null);
      setCustomSide("front");
    } else if (step === "diseno") {
      setStep("tipo");
    } else if (step === "tipo") {
      setStep("clase");
    } else {
      onClose?.();
    }
  };

  const selectionDone = step === "tipo" || step === "diseno";
  const selectionActive = step === "tipo" || step === "diseno";
  const placementSizeDone = step === "location";
  const placementSizeActive = step === "size";

  return (
    <div className="design-flow">
      <div className="design-flow__header">
        <button className="design-flow__back" onClick={goBack} type="button" aria-label="Volver">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="design-flow__header-title">
          {isPlacement ? "Personalizá tu diseño" : "CREA TU DISEÑO"}
        </span>
        {onClose && (
          <button className="design-flow__close" onClick={onClose} type="button" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {estampados.length === 0 && (
        <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>
          No hay diseños disponibles
        </p>
      )}

      {estampados.length > 0 && (
        <>
          {!isPlacement && (
            <div className="design-flow__stepper">
              <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <button
                  className={`stepper-step${selectionDone ? " stepper-step--done" : ""}${step === "clase" ? " stepper-step--active" : ""}`}
                  onClick={() => setStep("clase")}
                  type="button"
                >
                  <span className="stepper-step__dot">{selectionDone ? "✓" : 1}</span>
                  <span className="stepper-step__label">Elegí categoría</span>
                </button>
                <div className={`stepper-connector${selectionDone ? " stepper-connector--done" : ""}`} />
              </div>
              <div>
                <button
                  className={`stepper-step${step === "diseno" ? " stepper-step--done" : ""}${selectionActive ? " stepper-step--active" : ""}`}
                  onClick={() => selectedClaseId && setStep("tipo")}
                  disabled={!selectedClaseId}
                  type="button"
                >
                  <span className="stepper-step__dot">{step === "diseno" ? "✓" : 2}</span>
                  <span className="stepper-step__label">Elegí diseño</span>
                </button>
              </div>
            </div>
          )}

          {isPlacement && (
            <>
              <div className="design-flow__stepper">
                <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <button
                    className={`stepper-step${placementSizeDone ? " stepper-step--done" : ""}${placementSizeActive ? " stepper-step--active" : ""}`}
                    onClick={() => setStep("size")}
                    type="button"
                  >
                    <span className="stepper-step__dot">{placementSizeDone ? "✓" : 1}</span>
                    <span className="stepper-step__label">Elegí tamaño</span>
                  </button>
                  <div className={`stepper-connector${placementSizeDone ? " stepper-connector--done" : ""}`} />
                </div>
                <div>
                  <button
                    className={`stepper-step${step === "location" ? " stepper-step--active" : ""}`}
                    onClick={() => selectedSizeId && setStep("location")}
                    disabled={!selectedSizeId}
                    type="button"
                  >
                    <span className="stepper-step__dot">2</span>
                    <span className="stepper-step__label">Elegí ubicación</span>
                  </button>
                </div>
              </div>

              <div className={`design-flow__mock${isDragging ? " design-flow__mock--drag" : ""}`}>
                <div className="mock-duo">
                  <GarmentMock
                    garmentId={garmentId}
                    color={color}
                    svgMock={svgMock}
                    svgMockBack={svgMockBack}
                    placedDesigns={placedDesigns}
                    side="front"
                    hideFlip
                    draggable={isDragging}
                    dragDesign={customSide === "front" ? dragDesign : null}
                    onDragPosition={(pos) => {
                      setCustomPos(pos);
                      setCustomSide("front");
                    }}
                  />
                  {svgMockBack && (
                    <GarmentMock
                      garmentId={garmentId}
                      color={color}
                      svgMock={svgMock}
                      svgMockBack={svgMockBack}
                      placedDesigns={placedDesigns}
                      side="back"
                      hideFlip
                      draggable={isDragging}
                      dragDesign={customSide === "back" ? dragDesign : null}
                      onDragPosition={(pos) => {
                        setCustomPos(pos);
                        setCustomSide("back");
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}

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

            {step === "diseno" && selectedTipo && (
              <div className="design-flow__preview">
                <div className="estampado-card estampado-card--active">
                  <div className="estampado-card__preview">
                    {selectedTipo.image_url ? (
                      <img src={selectedTipo.image_url} alt={selectedTipo.name} decoding="async" />
                    ) : selectedTipo.svg_content ? (
                      <div className="estampado-card__svg"
                        dangerouslySetInnerHTML={{ __html: selectedTipo.svg_content.replace(/currentColor/gi, "var(--accent)") }}
                      />
                    ) : null}
                  </div>
                  <div className="estampado-card__info">
                    <span className="estampado-card__name">{selectedTipo.name}</span>
                    {selectedTipo.description && <span className="estampado-card__desc">{selectedTipo.description}</span>}
                  </div>
                </div>
                <button
                  className="btn-primary btn-primary--pill"
                  style={{ width: "100%", marginTop: "0.75rem" }}
                  onClick={() => setStep("size")}
                  type="button"
                >
                  Confirmar diseño
                </button>
              </div>
            )}

            {step === "size" && (
              <div className="control-group">
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
                <div className="control-group">
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
                <p className="text-muted" style={{ fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                  Arrastrá el diseño directamente sobre la prenda para ubicarlo donde quieras.
                  Usá la vista frontal o posterior para elegir la cara.
                </p>
                <button
                  className="btn-primary btn-primary--pill"
                  style={{ width: "100%", marginTop: "0.75rem" }}
                  onClick={handleConfirm}
                  disabled={!selectedSizeObj}
                  type="button"
                >
                  Confirmar diseño
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}