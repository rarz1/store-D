# AI_CONTEXT.md

## Estado del proyecto

- **Arquitectura**: React + Supabase + Vercel (sin backend propio, sin Docker)
- **Base de datos**: PostgreSQL en Supabase con tablas `garments`, `garment_colors`, `garment_sizes`, `designs`
- **Autenticación admin**: Supabase Auth (email/password)
- **Deploy**: Frontend en Vercel (`store-d-psi.vercel.app`), datos en Supabase

## Frontend (client/)

- **Stack**: React 19 + Vite + react-router-dom + @supabase/supabase-js
- **Tipografía**: Bebas Neue (display) + Inter (body), Google Fonts
- **Paleta**: Fondo `#131518`, superficie `#1c1f24`, acento `#f97316`

### Rutas públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Home con carrusel editorial + grilla de categorías desde Supabase |
| `/producto/:garmentId` | Configurador interactivo (color/talle/diseño) con mock SVG |

### Rutas admin
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login con Supabase Auth |
| `/admin` | Dashboard: lista prendas + diseños, editar/borrar |
| `/admin/garments/:id` | Crear/editar prenda (colores, talles, precio) |
| `/admin/designs/:id` | Crear/editar diseño SVG |

### Características
- SVGs de prendas (Remera, Pantaloneta, Buzo) con fill dinámico para cambio de color
- Diseños almacenados como SVG text en Supabase, se renderizan inline sobre el mock
- Selector de color (swatches), talle (chips), diseño (thumbnails con preview)
- Carrusel editorial full-viewport con autoplay
- Consulta por WhatsApp con resumen del producto configurado
- Mini admin embebido para gestionar productos y diseños
- Mobile-first, responsive, safe areas

## Deploy

- **URL**: https://store-d-psi.vercel.app
- **Variables en Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Archivo clave**: `client/vercel.json` con rewrites para SPA routing

## Variables de entorno

| Variable | Ejemplo | Dónde se usa |
|----------|---------|--------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | `lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | `lib/supabase.ts` |
| `VITE_WHATSAPP_PHONE` | `54123456789` | `pages/ProductPage.tsx` |

## Notas

- Todo el código está en inglés, siguiendo la convención del proyecto.
- Los diseños SVG deben usar `currentColor` para heredar el color de contraste del mock.
- Los imports de solo tipos deben usar `import type`, no `import`.
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
