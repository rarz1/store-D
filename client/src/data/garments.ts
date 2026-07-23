import type { GarmentConfig } from "../types";

export const COLORS = [
  { name: "Negro", hex: "#1a1a1a" },
  { name: "Blanco", hex: "#f0f0f0" },
  { name: "Gris", hex: "#8a919e" },
  { name: "Navy", hex: "#1e3a5f" },
];

export const SIZES = ["S", "M", "L", "XL"];

export const DESIGNS = [
  { id: "geometric", name: "Geométrico" },
  { id: "floral", name: "Floral" },
  { id: "wave", name: "Olas" },
  { id: "typo", name: "Tipográfico" },
  { id: "silhouette", name: "Silueta" },
  { id: "mandala", name: "Mandala" },
];

export const GARMENTS: GarmentConfig[] = [
  {
    id: "remeras",
    name: "Remeras",
    description: "Remera oversize de algodón peinado 24.1. Corte recto, cuello redondo. Ideal para estampados frontales.",
    basePrice: 8500,
    colors: COLORS,
    sizes: SIZES,
    designs: DESIGNS,
  },
  {
    id: "pantalones",
    name: "Pantalonetas",
    description: "Pantaloneta corta con cordón, bolsillos laterales y trasero. Tiro medio, corte relajado.",
    basePrice: 9500,
    colors: COLORS,
    sizes: SIZES,
    designs: DESIGNS,
  },
  {
    id: "buzos",
    name: "Buzos",
    description: "Buzo hoodie oversized con capucha forrada, bolsillo canguro y puños acanalados.",
    basePrice: 12500,
    colors: COLORS,
    sizes: SIZES,
    designs: DESIGNS,
  },
];
