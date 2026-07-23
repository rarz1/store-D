export interface Color {
  name: string;
  hex: string;
}

export interface Design {
  id: string;
  name: string;
}

export interface GarmentConfig {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  colors: Color[];
  sizes: string[];
  designs: Design[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: Category;
  variants: Variant[];
}

export interface Media {
  type: 'image' | 'video';
  url: string;
}

export interface Variant {
  color: string;
  size: string;
  media: Media[];
}

export interface Category {
  id: number;
  name: string;
}
