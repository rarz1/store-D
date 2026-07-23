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

export type DesignRow = {
  id: number;
  name: string;
  svg_content: string;
  created_at: string;
};
