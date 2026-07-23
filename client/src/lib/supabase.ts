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
