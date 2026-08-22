-- ============================================
-- STORE - Ronda 5 (2026-08-21)
-- 1. Badge editable por prenda (ej: Nuevo, Oferta, Descuento)
-- 2. Imagen de fondo de la página de colecciones
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

alter table garments
  add column if not exists badge_label text not null default 'Nuevo';

alter table site_settings
  add column if not exists collections_bg_url text not null default '';
