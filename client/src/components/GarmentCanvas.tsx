import { Suspense, useRef, type ReactNode } from "react";
import { recolorMockSvg } from "../lib/recolorMock";
import { garmentComponents, isLight } from "./GarmentMock";

export interface CanvasDesign {
  uid: string;
  imageUrl?: string;
  svgContent: string;
  widthPercent: number;
  x: number;
  y: number;
  active: boolean;
  pinned: boolean;
}

interface Props {
  garmentId: string;
  color: string;
  svgMock?: string;
  svgMockBack?: string;
  designs: CanvasDesign[];
  onSelect: (uid: string) => void;
  onMove: (uid: string, pos: { x: number; y: number }) => void;
  renderToolbar?: (uid: string) => ReactNode;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export default function GarmentCanvas({ garmentId, color, svgMock, svgMockBack, designs, onSelect, onMove, renderToolbar }: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const GarmentSVG = garmentComponents[garmentId];
  const designColor = isLight(color) ? "#1a1a1a" : "#ffffff";

  const frontSvg = svgMock ? recolorMockSvg(svgMock, color) : null;
  const backSvg = svgMockBack ? recolorMockSvg(svgMockBack, color) : frontSvg;

  const renderHalf = (svg: string | null) => {
    if (svg) {
      return <div className="garment-canvas__half" dangerouslySetInnerHTML={{ __html: svg }} />;
    }
    if (GarmentSVG) {
      return (
        <div className="garment-canvas__half">
          <Suspense fallback={<div className="garment-mock__fallback">...</div>}>
            <GarmentSVG color={color} />
          </Suspense>
        </div>
      );
    }
    return <div className="garment-canvas__half garment-mock__fallback">Prenda no disponible</div>;
  };

  const handlePointerDown = (e: React.PointerEvent, uid: string, pinned: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(uid);
    if (pinned) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const update = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      onMove(uid, {
        x: clamp(((clientX - rect.left) / rect.width) * 100, 3, 97),
        y: clamp(((clientY - rect.top) / rect.height) * 100, 2, 98),
      });
    };
    update(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => update(ev.clientX, ev.clientY);
    const end = () => {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  };

  return (
    <div className="garment-canvas" ref={canvasRef}>
      {renderHalf(frontSvg)}
      {renderHalf(backSvg)}

      {designs.map((d) => (
        <div
          key={d.uid}
          className={`df-design${d.active && !d.pinned ? " df-design--active" : ""}${d.pinned ? " df-design--pinned" : ""}`}
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.widthPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, d.uid, d.pinned)}
        >
          {d.active && !d.pinned && renderToolbar?.(d.uid)}
          {d.imageUrl ? (
            <img className="df-design__image" src={d.imageUrl} alt="" draggable={false} />
          ) : (
            <div
              className="df-design__svg"
              dangerouslySetInnerHTML={{ __html: d.svgContent.replace(/currentColor/gi, designColor) }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
