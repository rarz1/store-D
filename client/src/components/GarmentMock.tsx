import { lazy, Suspense, type ComponentType, useRef, useState, type ReactNode } from "react";
import { recolorMockSvg } from "../lib/recolorMock";

export const garmentComponents: Record<string, ComponentType<{ color: string }>> = {
  remeras: lazy(() => import("../assets/garments/TShirtSVG")),
  pantalones: lazy(() => import("../assets/garments/ShortsSVG")),
  buzos: lazy(() => import("../assets/garments/HoodieSVG")),
};

export function isLight(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

type Side = "front" | "back";
type Position = "small_front" | "small_front_right" | "large_front" | "small_back" | "large_back" | "sleeve";

export interface CustomPosition {
  x: number;
  y: number;
}

interface PlacedDesign {
  variantId: number;
  svgContent: string;
  imageUrl?: string;
  position: Position;
  customPosition?: CustomPosition;
  widthPercent?: number;
  side?: Side;
  name: string;
  isPreview?: boolean;
}

interface DragDesign {
  imageUrl?: string;
  svgContent?: string;
  widthPercent: number;
  position: CustomPosition;
}

interface Props {
  garmentId: string;
  color: string;
  designSvg?: string | null;
  svgMock?: string;
  svgMockBack?: string;
  placedDesigns?: PlacedDesign[];
  side?: Side;
  onToggleSide?: () => void;
  hideFlip?: boolean;
  dragDesign?: DragDesign | null;
  onDragPosition?: (pos: CustomPosition) => void;
  draggable?: boolean;
}

const positionStyles: Record<Position, React.CSSProperties> = {
  small_front: { top: "32%", left: "30%", width: "40%", height: "22%" },
  small_front_right: { top: "32%", left: "55%", width: "40%", height: "22%" },
  large_front: { top: "26%", left: "18%", width: "64%", height: "36%" },
  small_back: { top: "32%", left: "30%", width: "40%", height: "22%" },
  large_back: { top: "26%", left: "18%", width: "64%", height: "36%" },
  sleeve: { top: "8%", left: "2%", width: "15%", height: "20%" },
};

function RenderMock({ garmentId, color, svgMock, svgMockBack, placedDesigns, designSvg, side, dragDesign, onDragPosition, draggable }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const GarmentSVG = garmentComponents[garmentId];
  const designColor = isLight(color) ? "#1a1a1a" : "#ffffff";

  const mockSvg = side === "back" && svgMockBack ? svgMockBack : svgMock;
  const coloredMock = mockSvg ? recolorMockSvg(mockSvg, color) : null;

  const sideDesigns = (placedDesigns ?? []).filter((d) => {
    if (d.side) return d.side === side;
    if (d.position === "sleeve") return true;
    if (side === "front") return d.position.includes("front");
    return d.position.includes("back");
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable || !onDragPosition) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const update = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      if (!rect) return;
      const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 5, 95);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 5, 95);
      onDragPosition({ x, y });
    };
    update(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => update(ev.clientX, ev.clientY);
    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  };

  const renderDesignNode = (d: PlacedDesign): ReactNode => {
    if (d.imageUrl) {
      return <img className="garment-mock__design-image" src={d.imageUrl} alt={d.name} />;
    }
    const colored = d.svgContent.replace(/currentColor/gi, designColor);
    return <div className="garment-mock__design-svg" dangerouslySetInnerHTML={{ __html: colored }} />;
  };

  return (
    <div
      className="garment-mock__svg"
      ref={containerRef}
      data-side={side}
      style={draggable ? { touchAction: "none" } : undefined}
      onPointerDown={draggable ? handlePointerDown : undefined}
    >
      {coloredMock ? (
        <div className="garment-mock__custom" dangerouslySetInnerHTML={{ __html: coloredMock }} />
      ) : GarmentSVG ? (
        <Suspense fallback={<div className="garment-mock__fallback">...</div>}>
          <GarmentSVG color={color} />
        </Suspense>
      ) : (
        <div className="garment-mock__fallback">Prenda no disponible</div>
      )}

      {sideDesigns.map((d) => {
        const style = d.customPosition
          ? { left: `${d.customPosition.x}%`, top: `${d.customPosition.y}%`, transform: "translate(-50%, -50%)", width: `${d.widthPercent ?? 40}%`, height: "auto" }
          : positionStyles[d.position];
        return (
          <div
            key={d.isPreview ? `preview-${d.position}-${d.side ?? "auto"}` : `${d.variantId}-${d.position}-${d.side ?? "auto"}${d.customPosition ? `-${d.customPosition.x}x${d.customPosition.y}` : ""}`}
            className={`garment-mock__design${d.isPreview ? " garment-mock__design--preview" : ""}`}
            style={style}
          >
            {renderDesignNode(d)}
          </div>
        );
      })}

      {dragDesign && (
        <div
          className="garment-mock__design garment-mock__design--drag"
          style={{ left: `${dragDesign.position.x}%`, top: `${dragDesign.position.y}%`, transform: "translate(-50%, -50%)", width: `${dragDesign.widthPercent}%`, height: "auto" }}
        >
          {dragDesign.imageUrl ? (
            <img className="garment-mock__design-image" src={dragDesign.imageUrl} alt="" />
          ) : (
            <div className="garment-mock__design-svg" dangerouslySetInnerHTML={{ __html: (dragDesign.svgContent ?? "").replace(/currentColor/gi, designColor) }} />
          )}
        </div>
      )}

      {side === "front" && designSvg && (
        <div className="garment-mock__design" style={positionStyles.large_front} dangerouslySetInnerHTML={{ __html: designSvg.replace(/currentColor/gi, designColor) }} />
      )}
    </div>
  );
}

export default function GarmentMock(props: Props) {
  const { onToggleSide, hideFlip } = props;
  const [localSide, setLocalSide] = useState<Side>("front");
  const side = props.side ?? localSide;

  const toggle = onToggleSide ?? (() => setLocalSide((s) => (s === "front" ? "back" : "front")));

  return (
    <div className="garment-mock">
      <RenderMock {...props} side={side} />
      {!hideFlip && (props.svgMockBack || props.svgMock) && (
        <button className="garment-mock__flip" onClick={toggle}>
          {side === "front" ? "Ver posterior" : "Ver frente"}
        </button>
      )}
    </div>
  );
}
