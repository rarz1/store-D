import { lazy, Suspense, type ComponentType, useState } from "react";

const garmentComponents: Record<string, ComponentType<{ color: string }>> = {
  remeras: lazy(() => import("../assets/garments/TShirtSVG")),
  pantalones: lazy(() => import("../assets/garments/ShortsSVG")),
  buzos: lazy(() => import("../assets/garments/HoodieSVG")),
};

function isLight(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

type Side = "front" | "back";
type Position = "small_front" | "large_front" | "small_back" | "large_back";

interface PlacedDesign {
  variantId: number;
  svgContent: string;
  position: Position;
  name: string;
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
}

const positionStyles: Record<Position, React.CSSProperties> = {
  small_front: { top: "32%", left: "30%", width: "40%", height: "22%" },
  large_front: { top: "26%", left: "18%", width: "64%", height: "36%" },
  small_back: { top: "32%", left: "30%", width: "40%", height: "22%" },
  large_back: { top: "26%", left: "18%", width: "64%", height: "36%" },
};

function RenderMock({ garmentId, color, svgMock, svgMockBack, placedDesigns, designSvg, side }: Props) {
  const GarmentSVG = garmentComponents[garmentId];
  const designColor = isLight(color) ? "#1a1a1a" : "#ffffff";

  const mockSvg = side === "back" && svgMockBack ? svgMockBack : svgMock;
  const coloredMock = mockSvg
    ? mockSvg
        .replace(/\s(width|height)="[^"]*"/g, "")
        .replace(/\sfill="(?!none)(?!currentColor)[^"]*"/gi, ' fill="currentColor"')
        .replace('<svg', `<svg style="color:${color}"`)
        .replace(/currentColor/gi, color)
    : null;

  const sideDesigns = (placedDesigns ?? []).filter((d) => {
    if (side === "front") return d.position.includes("front");
    return d.position.includes("back");
  });

  return (
    <div className="garment-mock__svg">
      {coloredMock ? (
        <div
          className="garment-mock__custom"
          dangerouslySetInnerHTML={{ __html: coloredMock }}
        />
      ) : GarmentSVG ? (
        <Suspense fallback={<div className="garment-mock__fallback">...</div>}>
          <GarmentSVG color={color} />
        </Suspense>
      ) : (
        <div className="garment-mock__fallback">Prenda no disponible</div>
      )}

      {sideDesigns.map((d) => {
        const colored = d.svgContent.replace(/currentColor/gi, designColor);
        return (
          <div
            key={`${d.variantId}-${d.position}`}
            className="garment-mock__design"
            style={positionStyles[d.position]}
            dangerouslySetInnerHTML={{ __html: colored }}
          />
        );
      })}

      {side === "front" && designSvg && (
        <div
          className="garment-mock__design"
          style={positionStyles.large_front}
          dangerouslySetInnerHTML={{ __html: designSvg.replace(/currentColor/gi, designColor) }}
        />
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
