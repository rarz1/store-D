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

## Notas

- Todo el código está en inglés, siguiendo la convención del proyecto.
- No hay backend NestJS ni Docker — eliminados en la migración a Supabase.
- Los diseños SVG deben usar `currentColor` para heredar el color de contraste del mock.
- Los imports de solo tipos deben usar `import type`, no `import`.
