# AI_CONTEXT.md

## Estado del proyecto

- **Arquitectura**: React + Supabase + Vercel (sin backend propio, sin Docker)
- **Base de datos**: PostgreSQL en Supabase con tablas `garments`, `garment_colors`, `garment_sizes`, `estampados`, `diseno_tipos`, `estampado_sizes`, `estampado_locations`, `garment_estampado_sizes`, `garment_estampado_locations`, `site_settings`, `carousel_slides`
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
| `/` | Home con carrusel (slides desde DB) + StoreBanner con logo/título + grilla de categorías (clic → va directo a personalización) |
| `/producto/:garmentId` | Configurador interactivo (color/talle/diseño) con mock SVG + breadcrumb |

### Rutas admin
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login con Supabase Auth |
| `/admin` | Dashboard unificado con 5 tabs: Productos, Diseños, Tienda, Carrusel, Colores |
| `/admin/garments/:id` | Crear/editar prenda (colores, talles, precio) con validación inline |
| `/admin/designs/:id` | Crear/editar diseño SVG |

### Características
- SVGs de prendas (Remera, Pantaloneta, Buzo) con fill dinámico para cambio de color
- Diseños almacenados como SVG text en Supabase, se renderizan inline sobre el mock
- Selector de color (swatches), talle (chips), diseño (thumbnails con preview)
- Carrusel editorial full-viewport con slides desde DB (layout full/double, imágenes)
- StoreBanner: barra superior con glass effect sobre el carrusel, muestra logo + título + subtítulo
- Colores aplicados como CSS variables desde `site_settings`, editables con live preview
- Consulta por WhatsApp con resumen del producto configurado
- Admin con 5 tabs: Productos, Diseños, Tienda, Carrusel, Colores
- Mobile-first, responsive, safe areas
- Quick View modal eliminado: el clic en una tarjeta de categoría navega directo a la personalización (`/producto/:slug`)
- Onboarding modal para primeros visitantes (una vez, con localStorage)
- FAB flotante del carrito en móvil con badge dinámico
- Breadcrumb de navegación en página de producto
- Validación inline en formularios admin con errores visuales
- Notificaciones toast en acciones de admin (guardar, eliminar)
- Animaciones de entrada en tarjetas de categoría (stagger)
- Micro-animaciones en botones (scale on active, hover lift)
- Skeleton shimmer animation (reemplaza pulse básico)
- Sistema de sombras y profundidad (shadow scale)
- Escala de espaciado y border-radius consistente
- Glass utility class para efectos de vidrio unificados

## Estampado system

- `estampados` = clases de diseño (ej: Animal Print, Geométricos)
- `diseno_tipos` = sub-diseños dentro de una clase (ej: Leopardo dentro de Animal Print), cada uno con su propio SVG
- `estampado_sizes` = escala del diseño (Pequeño 25% → Full 100% del ancho), controla qué % del área de la prenda ocupa
- `estampado_locations` = posición fija (Pecho Izq, Centro Espalda, etc.) — **ya NO se usa en el flujo de compra**, solo queda el CRUD del admin
- `garment_estampado_sizes`/`garment_estampado_locations` = junction tables: qué sizes/locations están disponibles por prenda
- Flujo en frontend: usuario elige clase → tipo → tamaño → arrastra el diseño sobre el mock (ubicación libre) → confirma
- La ubicación es SIEMPRE libre (drag sobre el mock): `customPosition {x,y}` + `side ("front"|"back")`; `locations: []` siempre
- El estado del drag vive en `ProductPage` (`customMode`, `customPos`, `customSide`) y se pasa a `DesignFlow` como props controladas

## Admin reciente

- Tabla prendas: sin columna Etiquetas
- Tamaños estampado: editables in-line con botón + Agregar (Nombre, Tamaño %, Incremento $, Orden)
- Ubicaciones estampado: editables in-line con botón + Agregar (Nombre, Position key, Incremento $, Orden)
- Diseños: expandible por clase para ver/crear/editar/borrar tipos, muestra error si falla el guardado

## Deploy

- **URL**: https://store-d-psi.vercel.app
- **Vercel conectado a GitHub** (`rarz1/store-D`): cada push a `main` deploya automático
- **Variables en Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Archivo clave**: `client/vercel.json` con rewrites para SPA routing
- **Último push**: fix de errores reales de Supabase en upload (uploadImage devuelve `{url, error}` y se muestra en UI) + AI_CONTEXT actualizado

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
| `AppHeader` | `components/AppHeader.tsx` | Header persistente con logo, badge de carrito, FAB flotante en móvil |
| `QuickViewModal` | `components/QuickViewModal.tsx` | Modal de vista rápida de productos — **ya no se usa** (las cards navegan directo) |
| `OnboardingModal` | `components/OnboardingModal.tsx` | Modal de bienvenida para primeros visitantes |
| `GarmentMock` | `components/GarmentMock.tsx` | Mock SVG de prenda con color dinámico, flip front/back, placement de diseños |
| `DesignFlow` | `components/DesignFlow.tsx` | Configurador de estampados con stepper de 4 pasos; paso "location" activa el drag controlado desde ProductPage |
| `EstampadoSelector` | `components/EstampadoSelector.tsx` | Selector de clase de estampado con filtro por tags |
| `SizeSelector` | `components/SizeSelector.tsx` | Selector de tamaño de estampado |
| `SizeGuideModal` | `components/SizeGuideModal.tsx` | Guía de talles con medidas reales en cm por tipo de prenda |
| `ConfirmModal` | `components/ConfirmModal.tsx` | Modal de confirmación reutilizable |
| `HelpModal` | `components/HelpModal.tsx` | Modal de ayuda con pasos de personalización |

## Notas

- Todo el código está en inglés, siguiendo la convención del proyecto.
- Los mockups de prenda (`svg_mock`/`svg_mock_back`) deben tener el cuerpo en BLANCO (fills cercanos a blanco) y las costuras/detalles en NEGRO/GRIS. El tintado lo hace `lib/recolorMock.ts` (helper `recolorMockSvg`): si el SVG usa `currentColor` lo reemplaza; si no, tiñe TODOS los fills casi-blancos (luma > 220) conservando los detalles oscuros. NO usar solo `currentColor` en los mockups (los templates de vecteezy no lo usan y quedaban en gris/blanco).
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

### Sesión 3 - 2026-07-25
- Sistema de carrito completo: CartContext + CartProvider + CartDrawer + useCart con persistencia localStorage
- Toast system: ToastProvider + useToast hook
- React Query hooks: 6 hooks (garment, colors, sizes, estampados, sizes, locations)
- Estampado system: tablas `estampados`, `estampado_sizes`, `estampado_locations`, `diseno_tipos`, `garment_estampado_sizes`, `garment_estampado_locations`
- Two-level selection en frontend: clase → tipo → size → location
- Admin Diseños tab: CRUD de clases + tipos expandibles por clase
- Admin Productos tab: sizes/locations editables inline con botones +Agregar
- Admin tipos form: tags + active checkbox + error visible en UI
- Garment list: columna Etiquetas eliminada
- AdminGarmentForm: estampado size/location chip selector + guardado en junction tables
- CartItem incluye `tipo: DisenoTipoRow`
- Fix: build errors (CSS custom property cast, unused vars, missing type)
- Fix: saving now checks `{error}` and shows user-visible message
- Pendientes: probar admin en producción (correr SQL en Supabase SQL Editor)

### Sesión 4 - 2026-08-04 / 2026-08-05
- **M4 — Validación de talle**: Se requiere talle para agregar al carrito; de lo contrario abre modal/advierte vía Toast.
- **M13 — Botones y colores semánticos**: `btn-primary` usa `var(--accent)`, `btn-whatsapp` usa verde específico (`#25d366`), `btn-danger` usa rojo (`#ef4444`). `CartDrawer` botón "Vaciar carrito" pasa a `btn-danger`.
- **M9 — Header persistente (`AppHeader`)**: Creado componente `AppHeader.tsx` unificado con logo/título, badge dinámico de carrito en tiempo real, y soporte para navegación contextual (`showBack` / `title`). Reemplazó `StoreBanner` en HomePage y el header manual en ProductPage.
- **M5 — SVG real en categorías**: HomePage reemplazó los paths SVG hardcodeados por la renderización dinámica del `svg_mock` real almacenado en Supabase para cada prenda.
- **M14 — Estado vacío en HomePage**: Si no hay prendas cargadas, muestra pantalla minimalista de "PRÓXIMAMENTE" en lugar de un área vacía o rota.
- **M11 — Ancho máximo en Desktop**: Ampliado `.categories` de 640px a 960px para aprovechar mejor pantallas grandes.
- **M2 — Stepper de progreso en DesignFlow**: Agregado Stepper interactivo (`Categoría` ➔ `Diseño` ➔ `Escala` ➔ `Ubicación`) en la parte superior del configurador de estampados, permitiendo volver a pasos completados.
- **M3 — Preview de estampado en tiempo real**: Transmisión dinámica del estampado seleccionado a `GarmentMock` con animación `preview-pulse` y resplandor `accent-glow` antes de confirmar la ubicación.
- **M6 — Controles de Color y Talle Inline**: Reemplazados los botones que abrían modales obligatorios por swatches de color y chips de talle directos en `ProductPage`, mejorando la usabilidad.
- **M10 — Microanimaciones y Estilos**: Transición `step-slide-in` para los pasos de `DesignFlow` y rebote sutil `btn-enable` en el botón de confirmación.
- **M8 — Carrito con gestión de cantidades y WhatsApp multi-ítem**:
  - `CartItem` soporta propiedad `quantity`. Si se vuelve a agregar el mismo ítem con idéntica configuración (prenda + color + talle + estampados), incrementa la cantidad automáticamente.
  - El `CartDrawer` incluye controles de incremento/decrecimiento (`−` / `+`) por ítem.
  - Al presionar "Consultar carrito por WhatsApp" en el `CartDrawer`, genera un mensaje formateado con todos los productos del carrito, sus opciones, precios unitarios, subtotales y total general.
- **M7 — Guía de Talles y Medidas Interactiva (`SizeGuideModal`)**:
  - Creado modal dedicado `<SizeGuideModal>` con solapas interactivas por prenda (`Remeras`, `Buzos`, `Pantalones`).
  - Muestra medidas reales expresadas en centímetros sobre prenda plana (Pecho/Sisa, Largo, Hombros/Manga/Cadera) para talles S al XXL, con recomendación de calce *oversize*.
  - Detecta automáticamente el tipo de prenda actual (`garmentSlug`) para abrir la solapa correspondiente al hacer clic en "Guía de talles".
- **Verificación**: `npx tsc --noEmit` verificado sin errores.

### Sesión 5 — 2026-08-04 (Premium Upgrade)

#### Fase 1 — Quick Wins (Visual Polish)
- **Sistema de diseño CSS**: Escala de espaciado (`--space-1` a `--space-8`), sistema de sombras (`--shadow-sm` a `--shadow-xl`), escala de border-radius (`--radius-xs` a `--radius-xl`)
- **Skeleton shimmer**: Reemplazó la animación `pulse` básica por un shimmer con gradiente moviente
- **Micro-animaciones en botones**: Scale down on `:active`, lift on hover con shadow
- **Cart drawer backdrop blur**: Overlay del carrito ahora tiene `backdrop-filter: blur(4px)` y drawer tiene `box-shadow: var(--shadow-xl)`
- **Toast exit animation**: Toasts ahora tienen animación de salida `toast-out` al cerrarse
- **Category card stagger**: Tarjetas de categoría entran con animación escalonada (`card-fade-in`)
- **Garment mock hover glow**: Mock de prenda tiene glow sutil con `var(--accent-glow)` al hacer hover
- **FAB flotante del carrito**: Botón flotante fijo en bottom-right en móvil, aparece solo cuando hay items en el carrito
- **Glass utility class**: Clase `.glass` unificada para efectos de vidrio con backdrop-filter
- **Page transition**: Clase `.page-enter` con animación `fade-in` en todas las páginas
- **Header glass**: `AppHeader` ahora usa la clase `.glass` para efecto de vidrio consistente
- **Admin toast notifications**: `AdminDashboard` y `AdminSettings` muestran toasts de éxito/error al guardar/eliminar
- **Empty state mejorado**: Carrito vacío muestra icono 🛒 + mensaje descriptivo + CTA
- **Empty state con CTA**: Homepage "PRÓXIMAMENTE" ahora tiene botón "Volver al inicio"

#### Fase 2 — Usability
- **Quick View modal**: Nuevo componente `QuickViewModal` que muestra preview de productos desde el homepage sin navegar
- **Onboarding modal**: Nuevo componente `OnboardingModal` para primeros visitantes (3 pasos: personalizar, preview, WhatsApp), se muestra una vez con localStorage
- **Breadcrumb navigation**: Página de producto ahora muestra `Inicio > Nombre de prenda`
- **Validación inline en AdminGarmentForm**: Campos con errores visuales (borde rojo) + mensajes de error debajo de cada campo
- **Validación de formulario**: Se validan nombre, slug, precio, colores y talles antes de guardar
- **Touch targets**: Todos los elementos interactivos tienen `min-height: 44px` para cumplir con estándares de accesibilidad móvil
- **Focus rings visibles**: Todos los elementos interactivos tienen `outline: 2px solid var(--accent)` en `:focus-visible`
- **Quick View en tarjetas de categoría**: Clic en tarjeta abre Quick View en lugar de navegar directamente
- **Animación de entrada en tarjetas**: `animationDelay` escalonado para cada tarjeta de categoría

#### Nuevos archivos
- `client/src/components/QuickViewModal.tsx` — Modal de vista rápida de productos
- `client/src/components/OnboardingModal.tsx` — Modal de bienvenida para primeros visitantes

#### Plan de mejora premium
- Plan completo documentado en `docs/superpowers/plans/2026-08-04-premium-app-improvement-plan.md`
- 38 mejoras divididas en 4 fases: Quick Wins, Usability, Premium Features, Polish & Scale
- Fases 3 y 4 pendientes de implementación

### Sesión 6 — 2026-08-05 (Fases 3 y 4 completadas)

#### Fase 3 — Premium Features
- **UI de historial de pedidos (4.2)**: `CartDrawer` ahora muestra "Pedidos recientes" colapsable (últimos 10 en localStorage) con total, fecha e ítems, y botón "Repetir pedido" que re-agrega al carrito vía `reorder` (respeta dedupe por configuración y suma cantidades). Contexto nuevo: `orders`, `reorder`, `placeOrder`.
- **Bulk actions (5.3)**: Checkboxes en tablas de Prendas y Clases de diseño + toolbar `admin-bulk-bar` con "Eliminar seleccionadas" y "Activar/Desactivar" (solo clases). `confirmTarget` ampliado con tipos `bulk-garments`/`bulk-estampados`.
- **Drag-and-drop reordering (5.2)**: Tablas de Tamaños y Ubicaciones de estampado ahora son draggable (HTML5 Drag API) con handle `⋮⋮`; al soltar reordena la lista, reasigna `sort_order` 0-based y persiste por fila en Supabase.

#### Fase 4 — Polish & Scale
- **ErrorBoundary (6.3)**: Nuevo `components/ErrorBoundary.tsx` (class component) envolviendo las rutas en `App.tsx`, con fallback + "Reintentar" y "Volver al inicio".
- **Gradient animado de fondo (1.5)**: Pseudo-elemento fixed detrás de `.categories` con dos radial-gradients de `var(--accent-glow)` animados lentamente (`bg-mesh`).
- **Recomendaciones (4.4)**: Sección "QUIZÁS TAMBIÉN TE GUSTE" en ProductPage con hasta 3 prendas (ranked por tags compartidos), cards con mock SVG que navegan al producto.
- **SEO dinámico por producto (6.5)**: `seo.ts` ganó `setCanonical`, `setJsonLd`, `clearJsonLd`; ProductPage emite canonical + JSON-LD `Product` con Offer (ARS) y lo limpia al desmontar.
- **Lazy-loading (4.8)**: `loading="lazy" decoding="async"` en `<img>` de catálogo (DesignFlow, EstampadoSelector).

#### Descartado por redundancia
- **Theme toggle light/dark (4.6)**: El editor de colores del admin (bg/surface/text/accent) ya permite cualquier paleta; un toggle duplicaría esa función sin valor.

#### Bugfixes críticos (bloqueaban build de producción en Vercel)
- `tsc --noEmit` es NO-OP con tsconfig de solución (files vacíos + references): no chequeaba nada. El chequeo real es `npx tsc -b` o `npm run build`. **Regla: siempre validar con `npm run build`.**
- `client/src/lib/cart.tsx`: `whatsappUrl` estaba indefinido (ReferenceError en runtime al renderizar el botón WhatsApp del drawer). Ahora usa `buildWhatsAppCartMessage()`.
- `App.css`: se había perdido el selector de `.toast-container` (CSS inválido → vite/lightningcss fallaba). Restaurado.
- `favorites.tsx`: `addFavorite` pedía `addedAt` al caller; ahora `Omit<FavoriteItem, "addedAt">` (lo setea el provider).
- Limpieza de vars sin uso: `isFavorite`/`removeFavorite` (AppHeader), `useRef`/`toast` (AdminDashboard), `favorites` (ProductPage), prop `style` duplicado (AdminGarmentForm).
- **Verificación**: `npm run build` (tsc -b + vite) pasa sin errores. Oxlint: solo warnings preexistentes (fast-refresh, exhaustive-deps, vars en settings.ts/sw.js).

#### Deploy
- Commit `ad3a55c` (27 archivos, +3078/−225) pusheado a `main` → Vercel auto-deploy en `store-d-psi.vercel.app`.
- **Sin cambios en Supabase**: todo el upgrade es frontend; pedidos/wishlist usan localStorage, el resto lee/escribe tablas ya existentes.
- Limpieza previa al commit: 5 scaffolds vacíos `Admin*Tab.tsx` eliminados (código muerto de la refactor de admin) y `.codegraph/` agregado a `.gitignore`.
- Regla de caché PWA: `sw.js` es stale-while-revalidate; para invalidar caché en futuros releases, cambiar `CACHE_NAME` (ej: `store-v2`).

### Sesión 8 — 2026-08-06 (Bugfix: pantalla en blanco por caché PWA)

- Síntoma: `store-d-psi.vercel.app` en blanco en TODAS las rutas (cliente y admin); las previews de Vercel (`store-d-git-main-...`) cargaban bien.
- Causa raíz: `client/public/sw.js` usaba `CACHE_NAME "store-v1"` con stale-while-revalidate **cache-first para todo, incluido el HTML**. Tras múltiples deploys, el navegador servía un HTML viejo cacheado que referencia assets ya purgados de Vercel → el JS no cargaba (`Failed to load module script ... MIME text/html`) → blanco. Las previews funcionaban porque son orígenes distintos sin la caché envenenada.
- Fix (commit `d4dcaf1`): `CACHE_NAME` → `store-v2` (el `activate` borra la caché vieja) + navegación **network-first** (nunca servir HTML stale si hay red).
- Verificado: reproducción en Playwright (HTML stale + asset 404 → `BODY=''`) y contra-fix (con el mismo HTML stale, la app carga completa).
- **Importante**: en el navegador del usuario el SW nuevo se activa con skipWaiting + claim; si persiste blanco tras el deploy, hacer hard reload una vez.

### Sesión 7 — 2026-08-05 (Diseños PNG + ubicación libre)

#### Admin Diseños reescrito
- Tab Diseños reescrito: clases y tipos con subida de PNG a Supabase (bucket `store-images`, campo `image_url`), además de SVG text.
- Etiquetas por chips reutilizables (`TagInput`): alta/edición de tags sin commit de draft al quitar un chip.
- Paneles de alta/edición con botón de cierre ✕ + Cancelar.
- Errores visibles en UI: fix del "3er tipo no se guarda" (falta de propagación de estado de guardado + errores ocultos). Se maneja la race en la subida y se sumó resiliencia de errores y mejoras de a11y.

#### GarmentMock: imágenes y posición custom
- `GarmentMock` soporta imágenes PNG además de SVG text.
- Posición custom `{x, y}` en % sobre la prenda.
- Modo drag con pointer capture (clamp 5–95) sin fugas de eventos.

#### DesignFlow: ubicación libre
- Modo "Ubicación libre": el cliente arrastra el diseño sobre la prenda en lugar de elegir una ubicación fija.
- El carrito persiste `customPosition` y el mensaje de WhatsApp muestra "Ubicación libre".
- Fix: se preserva el size del diseño al cambiar a custom placement.

#### Feedback del cliente (2026-08-05)
- **Precio**: la "Ubicación libre" es GRATIS (no suma). Lo que suma es cantidad de diseños × `size.price_increment`. Verificado sin cambios de código (`locations: []` → incremento 0).
- **Drag en frente y posterior**: `DesignFlow` gana estado `customSide` ("front" | "back") reseteado en todos los handlers; el drag del `GarmentMock` conmuta frente/posterior. `ProductPage` propaga `side` a `placedDesigns`/`previewDesigns` (`p.side ?? "front"`) y el dedupe del carrito compara lado. WhatsApp muestra "Ubicación libre (frente)/(posterior)".
- **Contadores en vivo**: `AdminDesignsTab` reporta su conteo vía prop `onStatsChange`; `AdminDashboard` reemplazó su array `estampados` (estaba congelado del mount) por `disenosCount`, consulta solo el conteo al montar y evita el flash de 0 con `statsLoadedRef`. Los contadores reflejan la cuenta real de elementos, no son decorativos.

#### Notas técnicas
- `tsc --noEmit` es NO-OP con tsconfig de solución; el chequeo real es `npm run build` (tsc -b + vite).
- Trabajamos directo en `main` (con consentimiento del usuario).
- Verificación: `npm run lint` y `npm run build` pasan; oxlint solo con warnings preexistentes y build solo con el warning de chunk-size.

### Sesión 9 — 2026-08-06 (Fix: upload PNG a Supabase + imágenes PNG en vista cliente)

#### Problema 1: "Error al subir la imagen a Supabase" en tipos de diseño
- Causa raíz: el bucket `store-images` **no existía** en Supabase (`listBuckets()` vacío, upload con `Bucket not found` 404). El SQL del bucket en `supabase-schema.sql` estaba comentado ("Run this separately") y nunca se había ejecutado.
- Fix (SQL Editor de Supabase): `insert` del bucket `store-images` (public) + políticas RLS: "Public read" (select), "Admin upload" (insert con `auth.role()='authenticated'`), "Admin update", "Admin delete`.
- Fix de código: `uploadImage()` en `client/src/lib/settings.ts` ahora devuelve `{ url, error }` con el **mensaje real de Supabase** (antes devolvía `null` y el error solo iba a consola). `AdminDesignsTab` muestra `tipoError` con ese mensaje en la UI. Callers de `AdminDashboard.tsx` y `AdminSettings.tsx` actualizados.
- Nota: `AdminSettings.tsx` es código muerto (no se importa) pero se compila, por eso se actualizó igual.

#### Problema 2: no aparecían los PNG de los tipos en la vista cliente
- Causa raíz: las tablas junction `garment_estampado_sizes` y `garment_estampado_locations` **no existían** en Supabase (PGRST205). `useGarmentEstampadoSizes`/`useGarmentEstampadoLocations` en `client/src/lib/hooks.ts` fallaban con 404 → sin sizes/locations, el DesignFlow no llegaba a renderizar los tipos.
- Fix (SQL Editor de Supabase): crear ambas tablas (PK compuesta, sin columna `id`), RLS + policies, y seed: todos los garments × todos los sizes/locations (`on conflict do nothing`).
- Verificado con Playwright en producción: los 5 tipos de Calaveras renderizan `<img>` y cargan 5/5.
- Diagnóstico: PGRST205 = tabla no existe; 42703 en `select("id")` sobre junction tables = PK compuesta sin columna `id` (esperado).

#### Deploy
- Commit con `uploadImage` + AI_CONTEXT pusheado a `main` → auto-deploy en Vercel.

### Sesión 10 — 2026-08-10 (Ubicación fija eliminada del flujo de compra)

- Concepto del cliente: eliminar el selector de ubicaciones fijas de la vista cliente; el diseño se arrastra SIEMPRE directo sobre el mock real de la prenda (ubicación libre).
- `DesignFlow` deja de renderizar su propio `GarmentMock` y de usar `LocationSelector`/`stampLocations`. Las props `stampLocations`, `garmentId`, `color`, `svgMock`, `svgMockBack` se eliminaron del componente.
- El estado del drag (`customMode`, `customPos`, `customSide`) se levantó a `ProductPage` y se pasa a `DesignFlow` como props controladas (`onCustomModeChange`, `onCustomPosChange`, `onCustomSideChange`).
- Ambos mocks (frente + posterior) en `ProductPage` son `draggable` en modo custom; el `dragDesign` solo se renderiza en el lado activo (`customSide`).
- Se eliminó la duplicación `previewDesigns`: `allMockDesigns = placedDesigns`, y el preview en vivo es el propio `dragDesign` construido desde `previewStamp` + `customPos`.
- `placed-estampado-row__locs` muestra "Ubicación libre · Frente/Posterior".
- Limpieza de dead code: eliminados `LocationSelector.tsx`, hooks `useEstampadoLocations`/`useGarmentEstampadoLocations` de `lib/hooks.ts`, y CSS `.design-option-*` de `App.css`. El CRUD de `estampado_locations` en admin queda intacto.
- Verificación: `npm run build` pasa; oxlint solo con warnings preexistentes (exhaustive-deps en ProductPage).

### Sesión 10b — 2026-08-10 (Marco unificado de arrastre frente/posterior)

- Problema reportado: el diseño solo se ubicaba en la imagen superior. Causa raíz: en móvil el segundo mock estaba `display:none`, y el mock posterior solo se renderizaba si existía `svg_mock_back` (solo "Conjuntos" lo tiene). Nunca se llegaba a la vista posterior.
- Solución: `.mock-frame` envuelve ambos mocks con un único handler de drag (`handleFramePointerDown` en `ProductPage`). Usa `data-side` en `.garment-mock__svg` para detectar qué imagen está bajo el cursor y setea `customPos` + `customSide`.
- En modo custom ambos mocks se muestran siempre (incluso en móvil y sin `svg_mock_back`, el back mock hace fallback al SVG frontal).
- `.mock-frame--drag` da outline de acento al marco durante el drag. Verificado con Playwright (desktop + mobile 390px): arrastrando sobre el mock posterior el diseño queda en la vista back.

### Sesión 10c — 2026-08-10 (Fix móvil: drag no pasaba al mock inferior)

- Bug: en móvil el diseño "solo se movía en la imagen superior" y no pasaba a la inferior. Causa: con los mocks apilados en columna y `touch-action: none` en todo el marco, la página no scrolleaba y el mock de abajo quedaba fuera del viewport → imposible arrastrar hasta él.
- Fix CSS en `App.css`: en modo drag (`.mock-frame--drag`) el `.mock-duo` pasa a `flex-direction: row` con `align-items: flex-start` y cada mock `flex: 1; max-width: 48%` — así ambos mocks quedan lado a lado como un solo marco, incluso en móvil, y el diseño se arrastra de una imagen a la otra sin scroll.

### Sesión 10d — 2026-08-10 (UI de personalización premium: labels, stepper, botón "Elegí diseño")
- Título de sección `.personalize-title` ("Personaliza tu prenda" sin tilde) sobre el selector de color en `ProductPage`; labels de control pasan a "ELEGÍ COLOR" y "ELEGÍ TALLA".
- "Talle" → "talla" en toda la app (ProductPage, cart.tsx, SizeGuideModal, OnboardingModal, AdminGarmentForm, AdminDashboard).
- Eliminado `HelpModal.tsx` (botón de ayuda y modal "¿Cómo funciona?") y su CSS (`.btn-small--help`, `.help-steps`).
- `DesignFlow`: el header clickeable pasó a un botón `.choice-btn` "Elegí diseño". El antiguo botón "Diseño/Elegir diseño" que cerraba el flujo se reemplazó por un icono `.design-flow__back` (flecha atrás) al lado del botón, visible solo cuando el flujo está abierto. Se eliminó la prop `onOpenHelp`.
- Stepper renombrado: "Elegí categoría", "Elegí diseño", "Elegí tamaño", "Elegí ubicación". Responsive con container query (`container-type: inline-size` en `.design-flow` + `@container (max-width: 480px)`): si el `.design-flow` mide ≤480px los pasos se apilan en grilla 2×2 (dot arriba, label abajo) y se ocultan los conectores; con más ancho van en fila con conectores. Sin overflow en móvil (390px) ni desktop (columna de 280px).
- Verificado con Playwright: labels nuevos renderizan, sin "talle" en la UI, botón volver cierra/reabre el flujo, stepper 2×2 sin overflow, y el drag de ubicación sigue funcionando.
- En modo normal (sin drag) todo queda igual en móvil: segundo mock `display: none`, botón flip visible.
- Verificación Playwright (touch CDP, iPhone 13): cruce front→back confirmado en móvil con los dos mocks visibles lado a lado; el drag queda en `back` al soltar sobre el mock posterior.

### Sesión 10e — 2026-08-10 (Colecciones directo a personalización + acciones del carrito)

- **HomePage**: eliminado `QuickViewModal` (import, estado, handler y JSX). El clic en una tarjeta de categoría ahora navega directo a la personalización: `onClick={() => handleConfigure(g.slug)}` → `/producto/:slug`.
- **Descripción en colecciones**: las cards de categoría ahora muestran `g.description` en `.category-card__desc` (clamp de 2 líneas).
- **Carrito (`cart.tsx`)**: el drawer ahora siempre muestra "Continuar comprando" (btn-outline) que cierra el drawer y navega a `/` (colecciones). "Vaciar carrito" (btn-danger) limpia el carrito **y** cierra el drawer (vuelve a donde estaba el usuario al agregar). `CartDrawer` usa `useNavigate`.
- **Botón "Elegir diseño" (`DesignFlow.tsx` + `App.css`)**: se eliminó la frase duplicada — el `.choice-btn__label` "Elegí diseño" desaparece y queda solo el value "Elegir diseño" (o el diseño seleccionado). El botón ahora es salmón: clase `.choice-btn--salmon` (bg `#fa8072`, hover `#f96c5c`, texto y flecha blancos).
- Verificación: `npx tsc -b` sin errores; oxlint solo con warnings preexistentes. Commit `d22938a` pusheado a `main`.

### Sesión 10f — 2026-08-10 (Thumbnail de la prenda personalizada en el carrito)

- El drawer del carrito ahora muestra una miniatura de la prenda personalizada por ítem (render en vivo con `GarmentMock`, opción A — sin captura PNG).
- `CartItem` gana `garmentSvgMock?` y `garmentSvgMockBack?` (opcionales), guardados desde `ProductPage.handleAddToCart`.
- `cart.tsx`: helper `buildCartMockDesigns()` replica la lógica `placedDesigns` de ProductPage (variantId, svgContent, imageUrl, position desde `location.position_key`, customPosition + widthPercent + side). Componente `CartItemThumb` renderiza el frente y, si hay diseños en back (`side === "back"` o position con "back"), también el dorso.
- CSS: `.cart-drawer__item-thumb` (4.5rem, `--surface-hover` bg) con override del `max-width: 380px` de `.garment-mock__custom` para que el SVG ocupe el thumb.
- Items viejos en `localStorage` sin los SVG guardados caen al mock genérico por slug (`remeras`/`pantalones`/`buzos`) — siguen visibles.
- Gotcha: TS2339 al acceder `d.side` sobre la unión de returns → cast `(d as { side?: string })`. Verificación: `npx tsc -b` y oxlint pasan. Commit `ae76a9b` pusheado a `main`.

### Sesión 12 — 2026-08-12 (Fix: mockups de prenda no se teñían con el color elegido)

- Síntoma reportado: al cambiar el color de la prenda (ProductPage, o el acento de la home), el mock quedaba SIEMPRE en gris/blanco/negro — el color no se aplicaba.
- Causa raíz (verificada contra datos reales): los 6 `svg_mock`/`svg_mock_back` en Supabase son templates vecteezy/Inkscape (100–270 KB) que NO contienen `currentColor`; el cuerpo es blanco real (`#ffffff`/`#f2f2f2`, 62–81% del render, sin rect de fondo, bordes del viewBox transparentes) y los detalles/costuras son negros/grises (`#000000`, `#231f20`, `#cccccc`, `#7f7f7f`). El código solo hacía `.replace(/currentColor/gi, color)` → nunca pintaba nada.
- Fix: nuevo `client/src/lib/recolorMock.ts` con `recolorMockSvg(svg, color)`. Si el SVG tiene `currentColor` lo reemplaza; si no, detecta todos los fills casi-blancos (luma > 220, excluye `#cccccc`=204) y los reemplaza por el color en `fill`/`stroke`/`stop-color`/`color` (regex con UNION de hexs, flags `gi`). No usa "más frecuente" (fallaba en g5/polo: `#ffffff`=5 cuerpo vs `#f2f2f2`=6 sombreado → elegía el equivocado); tiñe TODOS los casi-blancos).
- Integrado en 4 puntos: `GarmentMock.tsx` (`coloredMock` del mock frente/post con el color real), `HomePage.tsx` (cards con `var(--accent)`), `ProductPage.tsx` (recomendaciones con `var(--accent)`), `AdminGarmentForm.tsx` (preview admin front+back con `var(--text)`).
- Validación con Playwright + muestreo de píxeles: los 12 SVGs (6 prendas × front/back) quedan teñidos 78–97% en navy, 86–100% en negro, 77–95% en blanco; los detalles negros quedan visibles. Ejemplo: con navy `#1e3a5f`, g4/jogger 81% y g2/pantaloneta 88–94%.
- Entorno: se trabajó en el clon `C:\STORE` (fuera de OneDrive, que bloquea escritura con placeholders). Repo `rarz1/store-D`, branch `main`, commit `2a7b1a7` pusheado → auto-deploy Vercel.
- Verificación: `npm run build` OK (solo warning preexistente de chunk-size), oxlint solo warnings preexistentes. Gotcha: el tinte con `var(--text)` en el replacement `$1="${color}"` es seguro (no contiene `$`).
