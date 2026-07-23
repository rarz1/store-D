import TShirtSVG from "../assets/garments/TShirtSVG";
import ShortsSVG from "../assets/garments/ShortsSVG";
import HoodieSVG from "../assets/garments/HoodieSVG";
import {
  DesignGeometric,
  DesignFloral,
  DesignWave,
  DesignTypo,
  DesignSilhouette,
  DesignMandala,
} from "../assets/designs/DesignComponents";

const garmentMap: Record<string, typeof TShirtSVG> = {
  remeras: TShirtSVG,
  pantalones: ShortsSVG,
  buzos: HoodieSVG,
};

const designMap: Record<string, React.ComponentType<{ color: string }>> = {
  geometric: DesignGeometric,
  floral: DesignFloral,
  wave: DesignWave,
  typo: DesignTypo,
  silhouette: DesignSilhouette,
  mandala: DesignMandala,
};

interface Props {
  garmentId: string;
  color: string;
  designId: string | null;
}

export default function GarmentMock({ garmentId, color, designId }: Props) {
  const GarmentSVG = garmentMap[garmentId];
  const DesignSVG = designId ? designMap[designId] : null;

  if (!GarmentSVG) return null;

  const isLight = (hex: string) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  };

  const designColorValue = isLight(color) ? "#1a1a1a" : "#ffffff";

  return (
    <div className="garment-mock">
      <div className="garment-mock__svg">
        <GarmentSVG color={color} />
        {DesignSVG && (
          <div className="garment-mock__design">
            <DesignSVG color={designColorValue} />
          </div>
        )}
      </div>
    </div>
  );
}
