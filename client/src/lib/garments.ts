// Static garment data — SVGs are React components, not stored in DB
export const GARMENT_SVGS = {
  remeras: () => import("../assets/garments/TShirtSVG"),
  pantalones: () => import("../assets/garments/ShortsSVG"),
  buzos: () => import("../assets/garments/HoodieSVG"),
} as const;

export type GarmentSlug = keyof typeof GARMENT_SVGS;

export const GARMENT_NAMES: Record<GarmentSlug, string> = {
  remeras: "Remeras",
  pantalones: "Pantalonetas",
  buzos: "Buzos",
};
