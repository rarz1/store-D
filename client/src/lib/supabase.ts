import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type GarmentRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  svg_mock: string;
  svg_mock_back: string;
  tags: string[];
  created_at: string;
};

export type GarmentColorRow = {
  id: number;
  garment_id: number;
  name: string;
  hex: string;
};

export type GarmentSizeRow = {
  id: number;
  garment_id: number;
  name: string;
};

export type DesignOptionRow = {
  id: number;
  name: string;
  description: string;
  base_price: number;
  tags: string[];
  created_at: string;
};

export type DesignVariantRow = {
  id: number;
  design_option_id: number;
  name: string;
  svg_content: string;
  image_url: string;
  additional_price: number;
  positions: string[];
  sort_order: number;
  created_at: string;
};

export type DesignRow = DesignOptionRow & { variants: DesignVariantRow[] };

export type EstampadoRow = {
  id: number;
  name: string;
  description: string;
  svg_content: string;
  image_url: string;
  active: boolean;
  tags: string[];
  sort_order: number;
  created_at: string;
};

export type EstampadoSizeRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  width_percent: number;
  price_increment: number;
  sort_order: number;
};

export type EstampadoLocationRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  position_key: string;
  price_increment: number;
  sort_order: number;
};

export type DisenoTipoRow = {
  id: number;
  estampado_id: number;
  name: string;
  description: string;
  svg_content: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type GarmentEstampadoSizeRow = {
  garment_id: number;
  estampado_size_id: number;
};

export type GarmentEstampadoLocationRow = {
  garment_id: number;
  estampado_location_id: number;
};
