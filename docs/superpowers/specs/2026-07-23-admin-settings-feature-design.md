# Admin Settings Feature — Design Spec

## Schema

### `site_settings` table (single row)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | bigint PK | auto | |
| store_title | text | '' | Título de la tienda |
| store_subtitle | text | '' | Subtítulo de la tienda |
| logo_url | text | '' | URL del logo en Supabase Storage |
| collections_title | text | 'COLECCIONES' | Título de la sección colecciones |
| collections_subtitle | text | 'Elegí tu prenda y personalizala a tu gusto' | Subtítulo colecciones |
| color_bg | text | '#131518' | Fondo general |
| color_surface | text | '#1c1f24' | Fondo de tarjetas |
| color_text | text | '#f2f4f7' | Texto principal |
| color_accent | text | '#f97316' | Color acento |
| updated_at | timestamptz | now() | |

### `carousel_slides` table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | bigint PK | auto | |
| sort_order | int | 0 | Posición 1-4 |
| layout | text | 'full' | 'full' o 'double' |
| image_1_url | text | '' | Imagen principal |
| image_2_url | text | '' | Segunda imagen (solo double) |
| text_overlay | text | '' | Título overlay |
| subtitle | text | '' | Subtítulo overlay |

### Storage

Bucket: `store-images`
- Public: SELECT
- Authenticated: INSERT, UPDATE, DELETE

Paths: `logo/*`, `carousel/*`

## Admin UI

New route: `/admin/settings` — tabbed page with 3 tabs.

### Tab: Tienda
- Store title (text input)
- Store subtitle (text input)
- Logo upload (file picker + preview)
- Collections title (text input)
- Collections subtitle (text input)

### Tab: Carrusel
- 4 slide editors, each with:
  - Layout selector: "Completa" / "Doble"
  - Image 1 upload (file picker + preview)
  - Image 2 upload (visible only if layout = "Doble")
  - Text overlay input
  - Subtitle input

### Tab: Colores
- 5 color inputs (type="color"):
  - Fondo
  - Superficie
  - Texto
  - Acento
- Live preview rectangle showing combined result

## Frontend Changes

### New file: `lib/settings.ts`
- Types: `SiteSettings`, `CarouselSlide`
- Functions: `getSettings()`, `saveSettings()`, `getSlides()`, `saveSlides()`, `uploadImage()`

### Modified: `App.tsx`
- On mount, fetch `site_settings` once
- Apply colors as CSS variables on `document.documentElement`
- Accent-glow derived from accent at 20% opacity

### Modified: `Carousel.tsx`
- Fetch slides from `carousel_slides` table ordered by `sort_order`
- Render images as background instead of gradient fallback
- Full layout: 1 image covers slide
- Double layout: 2 images side by side
- Text overlay on top

### Modified: `HomePage.tsx`
- Collections title/subtitle from settings instead of hardcoded

### Modified: `App.tsx` (routes)
- Add route `/admin/settings` behind AuthGuard

### Modified: `AdminDashboard.tsx`
- Add "Configuración" link/button

## Color Derivation
- `--accent-hover`: lighten accent by 10% (JS)
- `--accent-glow`: accent + 20% opacity (JS)
- `--surface-hover`: lighten surface by 5% (JS)
- `--text-secondary`: lighten bg-dark by ~50% (fixed approximation)
- `--text-muted`: lighten bg-dark by ~40%
- `--border`: lighten surface by 5%

## RLS Policies
- `site_settings`: SELECT public, INSERT/UPDATE/DELETE authenticated
- `carousel_slides`: SELECT public, INSERT/UPDATE/DELETE authenticated