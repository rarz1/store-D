-- ============================================
-- STORE - Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- Garment types (remeras, pantalones, buzos)
create table garments (
  id bigint primary key generated always as identity,
  name text not null,
  slug text unique not null,
  description text not null default '',
  base_price numeric(10,2) not null default 0,
  svg_mock text not null default '',
  created_at timestamptz default now()
);

-- Available colors per garment
create table garment_colors (
  id bigint primary key generated always as identity,
  garment_id bigint references garments(id) on delete cascade,
  name text not null,
  hex text not null
);

-- Available sizes per garment
create table garment_sizes (
  id bigint primary key generated always as identity,
  garment_id bigint references garments(id) on delete cascade,
  name text not null
);

-- SVG designs for printing
create table designs (
  id bigint primary key generated always as identity,
  name text not null,
  svg_content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- SEED DATA
-- ============================================

-- Garments
insert into garments (name, slug, description, base_price) values
  ('Remeras', 'remeras', 'Remera oversize de algodón peinado 24.1. Corte recto, cuello redondo. Ideal para estampados frontales.', 8500),
  ('Pantalonetas', 'pantalones', 'Pantaloneta corta con cordón, bolsillos laterales y trasero. Tiro medio, corte relajado.', 9500),
  ('Buzos', 'buzos', 'Buzo hoodie oversized con capucha forrada, bolsillo canguro y puños acanalados.', 12500);

-- Colors for each garment
insert into garment_colors (garment_id, name, hex) values
  (1, 'Negro', '#1a1a1a'), (1, 'Blanco', '#f0f0f0'), (1, 'Gris', '#8a919e'), (1, 'Navy', '#1e3a5f'),
  (2, 'Negro', '#1a1a1a'), (2, 'Blanco', '#f0f0f0'), (2, 'Gris', '#8a919e'), (2, 'Navy', '#1e3a5f'),
  (3, 'Negro', '#1a1a1a'), (3, 'Blanco', '#f0f0f0'), (3, 'Gris', '#8a919e'), (3, 'Navy', '#1e3a5f');

-- Sizes for each garment
insert into garment_sizes (garment_id, name) values
  (1, 'S'), (1, 'M'), (1, 'L'), (1, 'XL'),
  (2, 'S'), (2, 'M'), (2, 'L'), (2, 'XL'),
  (3, 'S'), (3, 'M'), (3, 'L'), (3, 'XL');

-- Designs
insert into designs (name, svg_content) values
  ('Geométrico', '<svg viewBox="0 0 200 220" fill="none"><polygon points="100,10 190,80 150,200 50,200 10,80" fill="currentColor" opacity="0.9"/><polygon points="100,40 155,85 130,160 70,160 45,85" fill="currentColor" opacity="0.6"/><polygon points="100,65 130,92 115,130 85,130 70,92" fill="currentColor" opacity="0.4"/><line x1="100" y1="10" x2="100" y2="200" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><line x1="10" y1="80" x2="190" y2="80" stroke="currentColor" stroke-width="1.5" opacity="0.3"/></svg>'),
  ('Floral', '<svg viewBox="0 0 200 220" fill="none"><circle cx="100" cy="110" r="60" fill="currentColor" opacity="0.15"/><circle cx="100" cy="110" r="40" fill="currentColor" opacity="0.25"/><circle cx="100" cy="110" r="20" fill="currentColor" opacity="0.5"/><ellipse cx="60" cy="70" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(-30 60 70)"/><ellipse cx="140" cy="70" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(30 140 70)"/><ellipse cx="60" cy="150" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(30 60 150)"/><ellipse cx="140" cy="150" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(-30 140 150)"/><circle cx="100" cy="110" r="6" fill="currentColor" opacity="0.7"/></svg>'),
  ('Olas', '<svg viewBox="0 0 200 220" fill="none"><path d="M10 160Q30 120 50 140Q70 160 90 130Q110 100 130 120Q150 140 170 110Q190 80 190 80" stroke="currentColor" stroke-width="3" opacity="0.6" fill="none" stroke-linecap="round"/><path d="M10 140Q30 100 50 120Q70 140 90 110Q110 80 130 100Q150 120 170 90Q190 60 190 60" stroke="currentColor" stroke-width="2" opacity="0.3" fill="none" stroke-linecap="round"/><path d="M10 180Q30 140 50 160Q70 180 90 150Q110 120 130 140Q150 160 170 130Q190 100 190 100" stroke="currentColor" stroke-width="1.5" opacity="0.2" fill="none" stroke-linecap="round"/></svg>'),
  ('Tipográfico', '<svg viewBox="0 0 200 220" fill="none"><text x="100" y="100" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.9" font-family="''Bebas Neue'',Impact,sans-serif" font-size="90" letter-spacing="8">RAW</text><text x="100" y="145" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.4" font-family="system-ui,sans-serif" font-size="13" letter-spacing="6">EST. 2026</text><line x1="40" y1="162" x2="160" y2="162" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>'),
  ('Silueta', '<svg viewBox="0 0 200 220" fill="none"><path d="M0 200L40 120L80 160L120 90L160 140L200 100L200 220L0 220Z" fill="currentColor" opacity="0.4"/><path d="M0 200L30 150L70 180L110 120L150 160L200 130L200 220L0 220Z" fill="currentColor" opacity="0.2"/><circle cx="160" cy="80" r="22" fill="currentColor" opacity="0.5"/><circle cx="160" cy="80" r="14" fill="currentColor" opacity="0.7"/><circle cx="160" cy="80" r="6" fill="currentColor" opacity="0.9"/></svg>'),
  ('Mandala', '<svg viewBox="0 0 200 220" fill="none"><circle cx="100" cy="110" r="85" stroke="currentColor" stroke-width="1" opacity="0.2"/><circle cx="100" cy="110" r="65" stroke="currentColor" stroke-width="1" opacity="0.25"/><circle cx="100" cy="110" r="45" stroke="currentColor" stroke-width="1" opacity="0.3"/><circle cx="100" cy="110" r="25" stroke="currentColor" stroke-width="1" opacity="0.35"/><circle cx="100" cy="110" r="10" fill="currentColor" opacity="0.15"/><circle cx="100" cy="110" r="4" fill="currentColor" opacity="0.4"/></svg>');

-- Enable row-level security (optional)
alter table garments enable row level security;
alter table garment_colors enable row level security;
alter table garment_sizes enable row level security;
alter table designs enable row level security;

-- Allow public read access (the catalog is public)
create policy "Public read" on garments for select using (true);
create policy "Public read" on garment_colors for select using (true);
create policy "Public read" on garment_sizes for select using (true);
create policy "Public read" on designs for select using (true);

-- Allow authenticated users (admin) to write
create policy "Admin insert" on garments for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on garments for update using (auth.role() = 'authenticated');
create policy "Admin delete" on garments for delete using (auth.role() = 'authenticated');

create policy "Admin insert" on garment_colors for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on garment_colors for update using (auth.role() = 'authenticated');
create policy "Admin delete" on garment_colors for delete using (auth.role() = 'authenticated');

create policy "Admin insert" on garment_sizes for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on garment_sizes for update using (auth.role() = 'authenticated');
create policy "Admin delete" on garment_sizes for delete using (auth.role() = 'authenticated');

create policy "Admin insert" on designs for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on designs for update using (auth.role() = 'authenticated');
create policy "Admin delete" on designs for delete using (auth.role() = 'authenticated');

-- ============================================
-- SITE SETTINGS
-- ============================================

create table site_settings (
  id bigint primary key generated always as identity,
  store_title text not null default '',
  store_subtitle text not null default '',
  logo_url text not null default '',
  collections_title text not null default 'COLECCIONES',
  collections_subtitle text not null default 'Elegí tu prenda y personalizala a tu gusto',
  color_bg text not null default '#131518',
  color_surface text not null default '#1c1f24',
  color_text text not null default '#f2f4f7',
  color_accent text not null default '#f97316',
  updated_at timestamptz default now()
);

create table carousel_slides (
  id bigint primary key generated always as identity,
  sort_order int not null default 0,
  layout text not null default 'full' check (layout in ('full', 'double')),
  image_1_url text not null default '',
  image_2_url text default '',
  text_overlay text not null default '',
  subtitle text not null default ''
);

-- Seed default settings
insert into site_settings (store_title, store_subtitle) values
  ('STORE', 'DISEÑO PROPIO · ALGODÓN ORGÁNICO');

-- Seed default carousel slides
insert into carousel_slides (sort_order, layout, text_overlay, subtitle) values
  (1, 'full', 'NUEVA\nCOLECCIÓN', 'DISEÑO PROPIO · ALGODÓN ORGÁNICO'),
  (2, 'double', 'TU ESTILO\nTU FIRMA', 'ESTAMPADOS EXCLUSIVOS · EDICIÓN LIMITADA'),
  (3, 'full', 'PUREZA\nY FORMA', 'PRENDAS OVERSIZE · CORTE PERFECTO'),
  (4, 'double', 'EDICIÓN\nLIMITADA', 'SOLO POR TIEMPO LIMITADO');

alter table site_settings enable row level security;
alter table carousel_slides enable row level security;

create policy "Public read" on site_settings for select using (true);
create policy "Admin insert" on site_settings for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on site_settings for update using (auth.role() = 'authenticated');
create policy "Admin delete" on site_settings for delete using (auth.role() = 'authenticated');

create policy "Public read" on carousel_slides for select using (true);
create policy "Admin insert" on carousel_slides for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on carousel_slides for update using (auth.role() = 'authenticated');
create policy "Admin delete" on carousel_slides for delete using (auth.role() = 'authenticated');

-- ============================================
-- STORAGE
-- ============================================

-- Run this separately in Supabase SQL Editor:
-- insert into storage.buckets (id, name, public) values ('store-images', 'store-images', true);
-- create policy "Public read" on storage.objects for select using (bucket_id = 'store-images');
-- create policy "Admin upload" on storage.objects for insert with check (bucket_id = 'store-images' and auth.role() = 'authenticated');
-- create policy "Admin update" on storage.objects for update using (bucket_id = 'store-images' and auth.role() = 'authenticated');
-- create policy "Admin delete" on storage.objects for delete using (bucket_id = 'store-images' and auth.role() = 'authenticated');

-- ============================================
-- DESIGN OPTIONS (replaces 'designs' as parent)
-- ============================================

create table if not exists design_options (
  id bigint primary key generated always as identity,
  name text not null,
  description text not null default '',
  base_price numeric(10,2) not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz default now()
);

create table if not exists design_variants (
  id bigint primary key generated always as identity,
  design_option_id bigint references design_options(id) on delete cascade,
  name text not null,
  svg_content text not null default '',
  image_url text not null default '',
  additional_price numeric(10,2) not null default 0,
  positions jsonb not null default '["small_front","large_front","small_back","large_back"]',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table garments add column if not exists svg_mock_back text not null default '';
alter table garments add column if not exists tags text[] not null default '{}';

alter table design_options enable row level security;
alter table design_variants enable row level security;

create policy "Public read" on design_options for select using (true);
create policy "Admin insert" on design_options for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on design_options for update using (auth.role() = 'authenticated');
create policy "Admin delete" on design_options for delete using (auth.role() = 'authenticated');

create policy "Public read" on design_variants for select using (true);
create policy "Admin insert" on design_variants for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on design_variants for update using (auth.role() = 'authenticated');
create policy "Admin delete" on design_variants for delete using (auth.role() = 'authenticated');

-- ============================================
-- ESTAMPADOS (standalone designs for clothing)
-- ============================================

create table if not exists estampados (
  id bigint primary key generated always as identity,
  name text not null,
  description text not null default '',
  svg_content text not null default '',
  image_url text not null default '',
  active boolean not null default true,
  tags text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists estampado_sizes (
  id bigint primary key generated always as identity,
  name text not null,
  slug text unique not null,
  description text not null default '',
  width_percent numeric(5,2) not null default 100,
  price_increment numeric(10,2) not null default 0,
  sort_order int not null default 0
);

create table if not exists estampado_locations (
  id bigint primary key generated always as identity,
  name text not null,
  slug text unique not null,
  description text not null default '',
  position_key text not null,
  price_increment numeric(10,2) not null default 0,
  sort_order int not null default 0
);

alter table estampados enable row level security;
alter table estampado_sizes enable row level security;
alter table estampado_locations enable row level security;

create policy "Public read" on estampados for select using (true);
create policy "Admin insert" on estampados for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on estampados for update using (auth.role() = 'authenticated');
create policy "Admin delete" on estampados for delete using (auth.role() = 'authenticated');

create policy "Public read" on estampado_sizes for select using (true);
create policy "Admin insert" on estampado_sizes for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on estampado_sizes for update using (auth.role() = 'authenticated');
create policy "Admin delete" on estampado_sizes for delete using (auth.role() = 'authenticated');

create policy "Public read" on estampado_locations for select using (true);
create policy "Admin insert" on estampado_locations for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on estampado_locations for update using (auth.role() = 'authenticated');
create policy "Admin delete" on estampado_locations for delete using (auth.role() = 'authenticated');

-- ============================================
-- ESTAMPADOS - SEED DATA
-- ============================================

-- Sizes (level + price increment scale)
insert into estampado_sizes (name, slug, description, width_percent, price_increment, sort_order) values
  ('Pequeño', 'pequeno', 'Diseño pequeño, discreto', 20, 0, 1),
  ('Mediano', 'mediano', 'Tamaño equilibrado', 35, 500, 2),
  ('Grande', 'grande', 'Diseño que se nota', 50, 1000, 3),
  ('XL', 'xl', 'Cubre buena parte de la prenda', 70, 2000, 4),
  ('Full', 'full', 'Diseño que cubre toda la superficie', 95, 3500, 5)
on conflict (slug) do nothing;

-- Locations
insert into estampado_locations (name, slug, description, position_key, price_increment, sort_order) values
  ('Pecho Izquierdo', 'pecho-izq', 'Sobre el lado izquierdo del pecho', 'small_front', 0, 1),
  ('Pecho Derecho', 'pecho-der', 'Sobre el lado derecho del pecho', 'small_front_right', 0, 2),
  ('Centro Pecho', 'centro-pecho', 'Al centro del pecho, tamaño completo', 'large_front', 500, 3),
  ('Centro Espalda', 'centro-espalda', 'Al centro de la espalda, tamaño completo', 'large_back', 500, 4),
  ('Manga', 'manga', 'Sobre la manga izquierda', 'sleeve', 300, 5)
on conflict (slug) do nothing;

-- Designs (estampados)
insert into estampados (name, description, svg_content, tags, sort_order) values
  ('Geométrico', 'Triángulos superpuestos en degradado', '<svg viewBox="0 0 200 220" fill="none"><polygon points="100,10 190,80 150,200 50,200 10,80" fill="currentColor" opacity="0.9"/><polygon points="100,40 155,85 130,160 70,160 45,85" fill="currentColor" opacity="0.6"/><polygon points="100,65 130,92 115,130 85,130 70,92" fill="currentColor" opacity="0.4"/><line x1="100" y1="10" x2="100" y2="200" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><line x1="10" y1="80" x2="190" y2="80" stroke="currentColor" stroke-width="1.5" opacity="0.3"/></svg>', ARRAY['geométrico','abstracto'], 1),
  ('Floral', 'Pétalos concéntricos con centro sólido', '<svg viewBox="0 0 200 220" fill="none"><circle cx="100" cy="110" r="60" fill="currentColor" opacity="0.15"/><circle cx="100" cy="110" r="40" fill="currentColor" opacity="0.25"/><circle cx="100" cy="110" r="20" fill="currentColor" opacity="0.5"/><ellipse cx="60" cy="70" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(-30 60 70)"/><ellipse cx="140" cy="70" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(30 140 70)"/><ellipse cx="60" cy="150" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(30 60 150)"/><ellipse cx="140" cy="150" rx="25" ry="15" fill="currentColor" opacity="0.2" transform="rotate(-30 140 150)"/><circle cx="100" cy="110" r="6" fill="currentColor" opacity="0.7"/></svg>', ARRAY['floral','naturaleza'], 2),
  ('Olas', 'Líneas onduladas paralelas', '<svg viewBox="0 0 200 220" fill="none"><path d="M10 160Q30 120 50 140Q70 160 90 130Q110 100 130 120Q150 140 170 110Q190 80 190 80" stroke="currentColor" stroke-width="3" opacity="0.6" fill="none" stroke-linecap="round"/><path d="M10 140Q30 100 50 120Q70 140 90 110Q110 80 130 100Q150 120 170 90Q190 60 190 60" stroke="currentColor" stroke-width="2" opacity="0.3" fill="none" stroke-linecap="round"/><path d="M10 180Q30 140 50 160Q70 180 90 150Q110 120 130 140Q150 160 170 130Q190 100 190 100" stroke="currentColor" stroke-width="1.5" opacity="0.2" fill="none" stroke-linecap="round"/></svg>', ARRAY['ondas','abstracto','minimalista'], 3),
  ('Tipográfico', 'Letras bold con línea divisoria', '<svg viewBox="0 0 200 220" fill="none"><text x="100" y="100" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.9" font-family="''Bebas Neue'',Impact,sans-serif" font-size="90" letter-spacing="8">RAW</text><text x="100" y="145" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.4" font-family="system-ui,sans-serif" font-size="13" letter-spacing="6">EST. 2026</text><line x1="40" y1="162" x2="160" y2="162" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>', ARRAY['tipográfico','texto'], 4),
  ('Silueta', 'Montañas y astro en capas', '<svg viewBox="0 0 200 220" fill="none"><path d="M0 200L40 120L80 160L120 90L160 140L200 100L200 220L0 220Z" fill="currentColor" opacity="0.4"/><path d="M0 200L30 150L70 180L110 120L150 160L200 130L200 220L0 220Z" fill="currentColor" opacity="0.2"/><circle cx="160" cy="80" r="22" fill="currentColor" opacity="0.5"/><circle cx="160" cy="80" r="14" fill="currentColor" opacity="0.7"/><circle cx="160" cy="80" r="6" fill="currentColor" opacity="0.9"/></svg>', ARRAY['silueta','naturaleza'], 5),
  ('Mandala', 'Círculos concéntricos punteados', '<svg viewBox="0 0 200 220" fill="none"><circle cx="100" cy="110" r="85" stroke="currentColor" stroke-width="1" opacity="0.2"/><circle cx="100" cy="110" r="65" stroke="currentColor" stroke-width="1" opacity="0.25"/><circle cx="100" cy="110" r="45" stroke="currentColor" stroke-width="1" opacity="0.3"/><circle cx="100" cy="110" r="25" stroke="currentColor" stroke-width="1" opacity="0.35"/><circle cx="100" cy="110" r="10" fill="currentColor" opacity="0.15"/><circle cx="100" cy="110" r="4" fill="currentColor" opacity="0.4"/></svg>', ARRAY['mandala','abstracto'], 6)
on conflict (name) do nothing;
