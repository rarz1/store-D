import { supabase } from "./supabase";

export interface SiteSettings {
  id: number;
  store_title: string;
  store_subtitle: string;
  logo_url: string;
  collections_title: string;
  collections_subtitle: string;
  color_bg: string;
  color_surface: string;
  color_text: string;
  color_accent: string;
  updated_at: string;
}

export interface CarouselSlide {
  id: number;
  sort_order: number;
  layout: "full" | "double";
  image_1_url: string;
  image_2_url: string;
  text_overlay: string;
  subtitle: string;
}

export async function getSettings(): Promise<SiteSettings | null> {
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  return data;
}

export async function saveSettings(settings: Partial<SiteSettings>): Promise<boolean> {
  const { error } = await supabase.from("site_settings").update(settings).eq("id", 1);
  return !error;
}

export async function getSlides(): Promise<CarouselSlide[]> {
  const { data } = await supabase.from("carousel_slides").select("*").order("sort_order");
  return data ?? [];
}

export async function saveSlide(id: number, slide: Partial<CarouselSlide>): Promise<boolean> {
  const { error } = await supabase.from("carousel_slides").update(slide).eq("id", id);
  return !error;
}

export async function uploadImage(file: File, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("store-images").upload(path, file, { upsert: true });
  if (error) { console.error("Upload error:", error); return null; }
  const { data: { publicUrl } } = supabase.storage.from("store-images").getPublicUrl(data.path);
  return publicUrl;
}

export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function lightenHex(hex: string, percent: number): string {
  const c = hex.replace("#", "");
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);
  r = Math.min(255, Math.round(r + (255 - r) * percent));
  g = Math.min(255, Math.round(g + (255 - g) * percent));
  b = Math.min(255, Math.round(b + (255 - b) * percent));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function applyColors(settings: SiteSettings) {
  const root = document.documentElement;
  root.style.setProperty("--bg", settings.color_bg);
  root.style.setProperty("--surface", settings.color_surface);
  root.style.setProperty("--text", settings.color_text);
  root.style.setProperty("--accent", settings.color_accent);
  root.style.setProperty("--accent-hover", lightenHex(settings.color_accent, 0.1));
  root.style.setProperty("--accent-glow", hexToRgba(settings.color_accent, 0.2));
  root.style.setProperty("--surface-hover", lightenHex(settings.color_surface, 0.05));
  root.style.setProperty("--border", lightenHex(settings.color_surface, 0.08));
}
