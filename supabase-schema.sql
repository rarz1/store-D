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
