import { lazy, Suspense, type ComponentType } from "react";

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

interface Props {
  garmentId: string;
  color: string;
  designSvg: string | null;
}

export default function GarmentMock({ garmentId, color, designSvg }: Props) {
  const GarmentSVG = garmentComponents[garmentId];

  const designColor = isLight(color) ? "#1a1a1a" : "#ffffff";
  const coloredDesign = designSvg
    ? designSvg.replace(/currentColor/gi, designColor)
    : null;

  return (
    <div className="garment-mock">
      <div className="garment-mock__svg">
        {GarmentSVG ? (
          <Suspense fallback={<div className="garment-mock__fallback">...</div>}>
            <GarmentSVG color={color} />
          </Suspense>
        ) : (
          <div className="garment-mock__fallback">Prenda no disponible</div>
        )}
        {coloredDesign && (
          <div
            className="garment-mock__design"
            dangerouslySetInnerHTML={{ __html: coloredDesign }}
          />
        )}
      </div>
    </div>
  );
}
