import { useRef, useState } from "react";
import type { EstampadoRow, DisenoTipoRow, EstampadoSizeRow, EstampadoLocationRow } from "../lib/supabase";
import GarmentCanvas from "./GarmentCanvas";

const USAGE_GUIDE_STEPS = [
  "Elija el diseño",
  "Cuando el diseño esté sobre la prenda, arrástrelo hacia la ubicación elegida",
  "Elija el tamaño de su diseño",
  'Puede clonar ese diseño las veces que desee con el selector "+" o eliminarlo con "-"',
  "Una vez que el diseño se encuentre en el lugar deseado fíjelo con el selector del chinche",
  "Una vez satisfecho con su diseño, agregue al carrito",
];

export interface CustomPosition {
  x: number;
  y: number;
}

export interface PlacedEstampado {
  estampado: EstampadoRow;
  tipo: DisenoTipoRow;
  size: EstampadoSizeRow;
  locations: EstampadoLocationRow[];
  customPosition?: CustomPosition | null;
  side?: "front" | "back";
}

interface EditorDesign {
  uid: string;
  estampado: EstampadoRow;
  tipo: DisenoTipoRow;
  size: EstampadoSizeRow;
  x: number;
  y: number;
  pinned: boolean;
}

interface Props {
  estampados: EstampadoRow[];
  tiposByClase: Record<number, DisenoTipoRow[]>;
  stampSizes: EstampadoSizeRow[];
  garmentId: string;
  color: string;
  svgMock?: string;
  svgMockBack?: string;
  initialDesigns: PlacedEstampado[];
  onSelectClase: (claseId: number) => void;
  onClose?: () => void;
  onConfirm: (designs: PlacedEstampado[]) => void;
}

type Phase = "personaliza" | "crea";

const SIZE_LABELS = ["S", "M", "L", "XL", "FULL"];
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

// Canvas y (0-100 over the stacked front+back canvas) <-> per-side position.
function toCanvasY(p: PlacedEstampado): number {
  const cy = p.customPosition?.y ?? 50;
  return (p.side ?? "front") === "back" ? 50 + cy / 2 : cy / 2;
}

function fromCanvas(d: EditorDesign): PlacedEstampado {
  return {
    estampado: d.estampado,
    tipo: d.tipo,
    size: d.size,
    locations: [],
    customPosition: { x: d.x, y: d.y < 50 ? d.y * 2 : (d.y - 50) * 2 },
    side: d.y < 50 ? "front" : "back",
  };
}

export default function DesignFlow({
  estampados,
  tiposByClase,
  stampSizes,
  garmentId,
  color,
  svgMock,
  svgMockBack,
  initialDesigns,
  onSelectClase,
  onClose,
  onConfirm,
}: Props) {
  const [phase, setPhase] = useState<Phase>("personaliza");
  const [showGuide, setShowGuide] = useState(false);
  const [designs, setDesigns] = useState<EditorDesign[]>(() =>
    initialDesigns.map((p, i) => ({
      uid: `init-${i}`,
      estampado: p.estampado,
      tipo: p.tipo,
      size: p.size,
      x: p.customPosition?.x ?? 50,
      y: toCanvasY(p),
      pinned: true,
    }))
  );
  const [activeUid, setActiveUid] = useState<string | null>(null);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);

  const uidCounter = useRef(0);
  const nextUid = () => `d-${++uidCounter.current}`;

  const sizeOptions = [...stampSizes]
    .sort((a, b) => a.width_percent - b.width_percent)
    .slice(0, 5)
    .map((row, i) => ({ row, label: SIZE_LABELS[i] ?? row.name }));
  const defaultSize = sizeOptions[0]?.row ?? null;

  const categories = [...new Set(estampados.flatMap((e) => e.tags))].sort();
  const clases = selectedTag
    ? estampados.filter((e) => e.tags.includes(selectedTag))
    : categories.length === 0
      ? estampados
      : [];
  const tipos = selectedClaseId ? (tiposByClase[selectedClaseId] ?? []) : [];
  const selectedClase = estampados.find((e) => e.id === selectedClaseId) ?? null;
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId) ?? null;

  const activeDesign = designs.find((d) => d.uid === activeUid) ?? null;

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setSelectedClaseId(null);
    setSelectedTipoId(null);
  };

  const handleSelectClase = (id: number) => {
    setSelectedClaseId(id);
    setSelectedTipoId(null);
    onSelectClase(id);
  };

  const handlePlaceDesign = () => {
    if (!selectedClase || !selectedTipo || !defaultSize) return;
    const uid = nextUid();
    setDesigns((prev) => [
      ...prev,
      { uid, estampado: selectedClase, tipo: selectedTipo, size: defaultSize, x: 50, y: 25, pinned: false },
    ]);
    setActiveUid(uid);
    setSelectedTipoId(null);
    setPhase("personaliza");
  };

  const handleSelectDesign = (uid: string) => {
    setActiveUid(uid);
    setDesigns((prev) => prev.map((d) => (d.uid === uid ? { ...d, pinned: false } : d)));
  };

  const handleMove = (uid: string, pos: { x: number; y: number }) => {
    setDesigns((prev) => prev.map((d) => (d.uid === uid ? { ...d, x: pos.x, y: pos.y } : d)));
  };

  const handleClone = (uid: string) => {
    const src = designs.find((d) => d.uid === uid);
    if (!src) return;
    const newUid = nextUid();
    setDesigns((prev) => [
      ...prev,
      { ...src, uid: newUid, x: clamp(src.x + 6, 3, 97), y: clamp(src.y + 6, 2, 98), pinned: false },
    ]);
    setActiveUid(newUid);
  };

  const handleRemoveClone = (uid: string) => {
    const src = designs.find((d) => d.uid === uid);
    if (!src) return;
    const sameKind = designs.filter((d) => d.tipo.id === src.tipo.id);
    if (sameKind.length <= 1) return;
    setDesigns((prev) => prev.filter((d) => d.uid !== uid));
    setActiveUid(null);
  };

  const handlePin = (uid: string) => {
    setDesigns((prev) => prev.map((d) => (d.uid === uid ? { ...d, pinned: true } : d)));
    setActiveUid(null);
  };

  const handleSizeChange = (row: EstampadoSizeRow) => {
    if (!activeUid) return;
    setDesigns((prev) => prev.map((d) => (d.uid === activeUid ? { ...d, size: row } : d)));
  };

  const handleConfirm = () => {
    if (designs.length === 0) return;
    onConfirm(designs.map(fromCanvas));
  };

  const goBack = () => {
    if (phase === "crea") {
      if (selectedTipoId) setSelectedTipoId(null);
      else if (selectedClaseId) setSelectedClaseId(null);
      else if (selectedTag) setSelectedTag(null);
      else setPhase("personaliza");
    } else {
      onClose?.();
    }
  };

  const step1Done = !!selectedTag || categories.length === 0;
  const step2Done = !!selectedClaseId;
  const step3Done = !!selectedTipoId;

  const renderToolbar = (uid: string) => {
    const d = designs.find((x) => x.uid === uid);
    if (!d) return null;
    const count = designs.filter((x) => x.tipo.id === d.tipo.id).length;
    return (
      <div className="df-toolbar" onPointerDown={(e) => e.stopPropagation()}>
        <button className="df-toolbar__btn" onClick={() => handleRemoveClone(uid)} disabled={count <= 1} type="button" aria-label="Quitar copia">
          −
        </button>
        <span className="df-toolbar__count">{count}</span>
        <button className="df-toolbar__btn" onClick={() => handleClone(uid)} type="button" aria-label="Clonar diseño">
          +
        </button>
        <button className="df-toolbar__btn df-toolbar__btn--pin" onClick={() => handlePin(uid)} type="button" aria-label="Fijar diseño">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M12 17v5M9 3h6l1 7 3 3H5l3-3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="design-flow">
      <div className="design-flow__header">
        <button className="design-flow__back" onClick={goBack} type="button" aria-label="Volver">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="design-flow__header-title">
          {phase === "crea" ? "CREA TU DISEÑO" : "PERSONALIZÁ TU DISEÑO"}
        </span>
        {onClose && (
          <button className="design-flow__close" onClick={onClose} type="button" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {phase === "personaliza" && (
        <>
          <div className="df-pills">
            <button className="df-pill" onClick={() => setPhase("crea")} type="button">
              Elige diseño
            </button>
            <button className="df-pill df-pill--guide" onClick={() => setShowGuide(true)} type="button">
              Guía de Uso
            </button>
            <button
              className={`df-pill df-pill--confirm${designs.length > 0 ? " df-pill--active" : ""}`}
              onClick={handleConfirm}
              type="button"
            >
              Añade al Carrito
            </button>
          </div>

          {showGuide && (
            <div className="df-guide-overlay" onClick={() => setShowGuide(false)}>
              <div className="df-guide-box" onClick={(e) => e.stopPropagation()}>
                <div className="df-guide-box__header">
                  <span className="df-guide-box__title">Guía de Uso</span>
                  <button className="df-guide-box__close" onClick={() => setShowGuide(false)} type="button" aria-label="Cerrar guía">
                    ✕
                  </button>
                </div>
                <ol className="df-guide-box__list">
                  {USAGE_GUIDE_STEPS.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <div className="df-editor">
            <div className="df-editor__canvas">
              <GarmentCanvas
                garmentId={garmentId}
                color={color}
                svgMock={svgMock}
                svgMockBack={svgMockBack}
                designs={designs.map((d) => ({
                  uid: d.uid,
                  imageUrl: d.tipo.image_url || undefined,
                  svgContent: d.tipo.svg_content || d.estampado.svg_content || "",
                  widthPercent: d.size.width_percent,
                  x: d.x,
                  y: d.y,
                  active: d.uid === activeUid,
                  pinned: d.pinned,
                }))}
                onSelect={handleSelectDesign}
                onMove={handleMove}
                renderToolbar={renderToolbar}
              />
            </div>
            <div className="df-size-rail">
              <span className="df-size-rail__title">
                <span>Elige</span>
                <span>Tamaño</span>
              </span>
              {sizeOptions.map((o) => (
                <button
                  key={o.row.id}
                  className={`df-size-btn${activeDesign?.size.id === o.row.id ? " df-size-btn--active" : ""}`}
                  onClick={() => handleSizeChange(o.row)}
                  disabled={!activeDesign}
                  type="button"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {designs.length > 0 && (
            <p className="text-muted df-hint">
              Arrastrá el diseño sobre la prenda. Tocá un diseño fijo para volver a moverlo.
            </p>
          )}
        </>
      )}

      {phase === "crea" && (
        <>
          <div className="design-flow__stepper">
            <button
              className={`stepper-step${step1Done ? " stepper-step--done" : ""}${!selectedTag && categories.length > 0 ? " stepper-step--active" : ""}`}
              onClick={() => {
                setSelectedTag(null);
                setSelectedClaseId(null);
                setSelectedTipoId(null);
              }}
              type="button"
            >
              <span className="stepper-step__dot">{step1Done ? "✓" : 1}</span>
              <span className="stepper-step__label">Elige Categoria</span>
            </button>
            <div className={`stepper-connector${step1Done ? " stepper-connector--done" : ""}`} />
            <button
              className={`stepper-step${step2Done ? " stepper-step--done" : ""}${selectedTag && !selectedClaseId ? " stepper-step--active" : ""}`}
              onClick={() => selectedTag && setSelectedClaseId(null)}
              disabled={!selectedTag}
              type="button"
            >
              <span className="stepper-step__dot">{step2Done ? "✓" : 2}</span>
              <span className="stepper-step__label">Elige Clase</span>
            </button>
            <div className={`stepper-connector${step2Done ? " stepper-connector--done" : ""}`} />
            <button
              className={`stepper-step${step3Done ? " stepper-step--done" : ""}${selectedClaseId && !selectedTipoId ? " stepper-step--active" : ""}`}
              onClick={() => selectedClaseId && setSelectedTipoId(null)}
              disabled={!selectedClaseId}
              type="button"
            >
              <span className="stepper-step__dot">{step3Done ? "✓" : 3}</span>
              <span className="stepper-step__label">Elige Diseño</span>
            </button>
          </div>

          <div className="design-flow__body">
            {categories.length > 0 && (
              <div className="df-section">
                <span className="df-section-title">Categorías de Diseño</span>
                <div className="df-cat-grid">
                  {categories.map((tag) => (
                    <button
                      key={tag}
                      className={`df-cat-card${selectedTag === tag ? " df-cat-card--active" : ""}`}
                      onClick={() => handleSelectTag(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedTag || categories.length === 0) && (
              <div className="df-section">
                <span className="df-section-title">Clases de Diseños</span>
                {clases.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>
                    No hay clases en esta categoría
                  </p>
                ) : (
                  <div className="estampado-grid">
                    {clases.map((c) => (
                      <button
                        key={c.id}
                        className={`estampado-card${selectedClaseId === c.id ? " estampado-card--active" : ""}`}
                        onClick={() => handleSelectClase(c.id)}
                        type="button"
                      >
                        <div className="estampado-card__preview">
                          {c.image_url ? (
                            <img src={c.image_url} alt={c.name} loading="lazy" decoding="async" />
                          ) : c.svg_content ? (
                            <div
                              className="estampado-card__svg"
                              dangerouslySetInnerHTML={{ __html: c.svg_content.replace(/currentColor/gi, "var(--accent)") }}
                            />
                          ) : (
                            <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>?</span>
                          )}
                        </div>
                        <div className="estampado-card__info">
                          <span className="estampado-card__name">{c.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedClaseId && (
              <div className="df-section">
                <span className="df-section-title">Imágenes de Diseños</span>
                {tipos.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>
                    No hay diseños en esta clase
                  </p>
                ) : (
                  <>
                    <div className="estampado-grid">
                      {tipos.map((t) => (
                        <button
                          key={t.id}
                          className={`estampado-card${selectedTipoId === t.id ? " estampado-card--active" : ""}`}
                          onClick={() => setSelectedTipoId(t.id)}
                          type="button"
                        >
                          <div className="estampado-card__preview">
                            {t.image_url ? (
                              <img src={t.image_url} alt={t.name} loading="lazy" decoding="async" />
                            ) : t.svg_content ? (
                              <div
                                className="estampado-card__svg"
                                dangerouslySetInnerHTML={{ __html: t.svg_content.replace(/currentColor/gi, "var(--accent)") }}
                              />
                            ) : (
                              <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>?</span>
                            )}
                          </div>
                          <div className="estampado-card__info">
                            <span className="estampado-card__name">{t.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedTipo && (
                      <button className="btn-primary btn-primary--pill df-pick-btn" onClick={handlePlaceDesign} type="button">
                        Elige la Imagen
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
