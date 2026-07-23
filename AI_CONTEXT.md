# AI_CONTEXT.md

## Estado del proyecto

- **Arquitectura**: React + Supabase + Vercel (sin backend propio, sin Docker)
- **Base de datos**: PostgreSQL en Supabase con tablas `garments`, `garment_colors`, `garment_sizes`, `designs`, `site_settings`, `carousel_slides`
- **Storage**: Bucket `store-images` (público) para logo y carrusel
- **Autenticación admin**: Supabase Auth (email/password)
- **Deploy**: Frontend en Vercel (`store-d-psi.vercel.app`), datos en Supabase

## Frontend (client/)

- **Stack**: React 19 + Vite + react-router-dom + @supabase/supabase-js
- **Tipografía**: Bebas Neue (display) + Inter (body), Google Fonts
- **Paleta editable**: Fondo, superficie, texto, acento — configurables desde admin

### Rutas públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Home con carrusel (slides desde DB) + StoreBanner con logo/título + grilla de categorías |
| `/producto/:garmentId` | Configurador interactivo (color/talle/diseño) con mock SVG |

### Rutas admin
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login con Supabase Auth |
| `/admin` | Dashboard unificado con 4 tabs: Productos, Tienda, Carrusel, Colores |
| `/admin/garments/:id` | Crear/editar prenda (colores, talles, precio) |
| `/admin/designs/:id` | Crear/editar diseño SVG |

### Características
- SVGs de prendas (Remera, Pantaloneta, Buzo) con fill dinámico para cambio de color
- Diseños almacenados como SVG text en Supabase, se renderizan inline sobre el mock
- Selector de color (swatches), talle (chips), diseño (thumbnails con preview)
- Carrusel editorial full-viewport con slides desde DB (layout full/double, imágenes)
- StoreBanner: barra superior con glass effect sobre el carrusel, muestra logo + título + subtítulo
- Colores aplicados como CSS variables desde `site_settings`, editables con live preview
- Consulta por WhatsApp con resumen del producto configurado
- Admin con 4 tabs: Productos (prendas + diseños), Tienda (info + logo), Carrusel (slides), Colores (pick + preview)
- Mobile-first, responsive, safe areas

## Deploy

- **URL**: https://store-d-psi.vercel.app
- **Vercel conectado a GitHub** (`rarz1/store-D`): cada push a `main` deploya automático
- **Variables en Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Archivo clave**: `client/vercel.json` con rewrites para SPA routing

## Variables de entorno

| Variable | Ejemplo | Dónde se usa |
|----------|---------|--------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | `lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | `lib/supabase.ts` |
| `VITE_WHATSAPP_PHONE` | `54123456789` | `pages/ProductPage.tsx` |

## Librería de settings

Archivo: `client/src/lib/settings.ts`
- Tipos: `SiteSettings`, `CarouselSlide`
- Funciones: `getSettings()`, `saveSettings()`, `getSlides()`, `saveSlide()`, `uploadImage()`
- Helpers: `applyColors()`, `hexToRgba()`, `lightenHex()`

## Componentes clave

| Componente | Ruta | Descripción |
|------------|------|-------------|
| `Carousel` | `components/Carousel.tsx` | Carrusel full-viewport, slides desde `carousel_slides` |
| `StoreBanner` | `components/StoreBanner.tsx` | Header con glass effect sobre carrusel, logo + título + subtítulo |

## Notas

- Todo el código está en inglés, siguiendo la convención del proyecto.
- Los diseños SVG deben usar `currentColor` para heredar el color de contraste del mock.
- Los imports de solo tipos deben usar `import type`, no `import`.
- `saveSettings()` excluye `id` y `updated_at` del payload para evitar errores con columnas identity.
- Renombrar `.env.example` a `.env` y completar las variables antes de desarrollar.

### Sesión 1 - 2026-07-23
- WhatsApp phone movido a `VITE_WHATSAPP_PHONE` env var
- Queries paralelizadas con `Promise.all` en ProductPage
- Manejo de errores agregado a todos los calls a Supabase (.catch / try-catch)
- Meta tags + Open Graph + JSON-LD en index.html
- `setMeta()` helper para SEO dinámico por página
- Skeleton loading states en HomePage y ProductPage
- `ConfirmModal` component reemplazando `confirm()` nativo
- Slug warning en AdminGarmentForm al editarlo
- Tipos muertos eliminados de `types.ts`
- Backend NestJS + admin/ legacy eliminados del repo
- `docker-compose.yml` simplificado (solo client)
- Errores: tsc y oxlint pasan sin errores
- Pendientes: carrito/compras (dejado para futuro)

### Sesión 2 - 2026-07-23
- Tablas `site_settings` + `carousel_slides` + bucket `store-images` en schema SQL
- `lib/settings.ts` con tipos, queries, helpers de color
- Admin Settings page con 3 tabs (Tienda, Carrusel, Colores)
- Carousel modificado para leer slides desde DB
- HomePage con título/subtítulo dinámicos desde settings
- `applyColors()` aplica colores como CSS variables on save + on app mount
- StoreBanner: header full-width con glass effect (backdrop-filter) sobre carrusel
- Fix: identity column en seed SQL (GENERATED ALWAYS)
- Fix: `saveSettings()` excluye `id` y `updated_at`
- AdminDashboard unificado con 4 tabs premium: Productos (default), Tienda, Carrusel, Colores
- Ruta `/admin/settings` eliminada (todo en dashboard)
- Tabs con underline animado + hover/active states premium
