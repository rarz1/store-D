# AI_CONTEXT.md

## Estado del proyecto

- **Arquitectura**: React + Supabase + Vercel (sin backend propio, sin Docker)
- **Base de datos**: PostgreSQL en Supabase con tablas `garments`, `garment_colors`, `garment_sizes`, `estampados`, `diseno_tipos`, `estampado_sizes`, `estampado_locations`, `garment_estampado_sizes`, `garment_estampado_locations`, `site_settings`, `carousel_slides`
- **Storage**: Bucket `store-images` (público) para logo y carrusel
- **Autenticación admin**: Supabase Auth (email/password)
- **Deploy**: Frontend en Vercel (`store-d-psi.vercel.app`), datos en Supabase

## Frontend (client/)

- **Stack**: React 19 + Vite + react-router-dom + @supabase/supabase-js
- **Tipografía**: Oswald (display) + Inter (body), Google Fonts
- **Paleta editable**: Fondo, superficie, texto, acento — configurables desde admin

### Rutas públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Onboarding full-screen (carrusel editorial + "Let's Start" → `/colecciones`), siempre al entrar |
| `/colecciones` | Colección: banner card negro + pills de categoría (desde tags) + grilla de prendas (clic → personalización) |
| `/producto/:garmentId` | Detalle con mock ~50% + hoja de detalles (precio negro, color, talla, "CREA TU DISEÑO" verde, corazón favorito); FAB verde redondo = Agregar al carrito; "Elegí diseño" abre DesignFlow full-screen (mock interno + 2 steppers guiados) |
| `/carrito` | Carrito full-page: checkboxes redondos, contador `−/+` con divisores, breakdown de personalización, resumen ESTÁTICO al final (Artículos seleccionados / Subtotal / Descuento $0 / Total de esta compra, sin envío), Checkout por WhatsApp, grilla 3 botones (Volver / Seguir comprando / Vaciar carrito), Pedidos recientes |
| `/favoritos` | Favoritos del usuario (localStorage): miniaturas con GarmentMock, "Ver prenda", quitar |

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
- Selector de color (swatches), talla (chips), diseño (thumbnails con preview)
- Carrusel editorial full-viewport con Ken Burns (12s), auto-play 5.2s con barra de progreso en los dots, parallax/title stagger, swipe por pointer, variante `hero`/`onboarding`, respeta `prefers-reduced-motion`
- Tema CLARO urbano en producción (DB `site_settings` con `color_bg #f4f4f5`, `color_surface #ffffff`, `color_text #000000`, `color_accent #84cc16`). Seed de `supabase-schema.sql` en esta paleta.
- Colores aplicados como CSS variables desde `site_settings` (applyColors fija `--surface-hover #fafafa`, `--text-secondary #52525b`, `--border #e4e4e7` como constantes), editables con live preview
- Consulta por WhatsApp con resumen del carrito seleccionado (botón SOLO en `/carrito`, no en personalización)
- Envío configurable sin monto fijo: chips "Retiro" (`$0.0`) / "Envío" (`a convenir según distancia`); solo signo `$`
- Admin con 5 tabs: Productos, Diseños, Tienda, Carrusel, Colores
- Mobile-first, responsive, safe areas
- FAB flotante del carrito en móvil con badge dinámico → `/carrito`
- Validación inline en formularios admin con errores visuales
- Notificaciones toast en acciones (agregar al carrito, admin, WhatsApp)
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
- Flujo en frontend: DesignFlow full-screen guiado por 2 steppers — selección (Elegí categoría → Elegí diseño) y placement (Elegí tamaño → Elegí ubicación); el mock de la prenda (frente arriba / espalda abajo apiladas) vive DENTRO del flow y el usuario arrastra el diseño (ubicación libre) y confirma
- La ubicación es SIEMPRE libre (drag sobre el mock): `customPosition {x,y}` + `side ("front"|"back")`; `locations: []` siempre
- El estado del drag es INTERNO a `DesignFlow` (self-contained); ProductPage solo recibe `onAdd(designs)` con los confirmados

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
| `VITE_WHATSAPP_PHONE` | `54123456789` | `pages/CartPage.tsx` |

## Librería de settings

Archivo: `client/src/lib/settings.ts`
- Tipos: `SiteSettings`, `CarouselSlide`
- Funciones: `getSettings()`, `saveSettings()`, `getSlides()`, `saveSlide()`, `uploadImage()`
- Helpers: `applyColors()`, `hexToRgba()`, `lightenHex()`

## Componentes clave

| Componente | Ruta | Descripción |
|------------|------|-------------|
| `Carousel` | `components/Carousel.tsx` | Carrusel full-viewport (Ken Burns, auto-play, swipe), slides desde `carousel_slides`; prop `variant` "hero" \| "onboarding" |
| `AppHeader` | `components/AppHeader.tsx` | Header sticky con logo, corazón con badge de favoritos → `/favoritos`, badge de carrito → `/carrito`, FAB flotante en móvil; prop `variant` "default" \| "transparent" |
| `OnboardingScreen` | `pages/OnboardingScreen.tsx` | Pantalla de bienvenida en `/` con título/subtítulo desde settings y CTA "Let's Start" |
| `CartPage` | `pages/CartPage.tsx` | Carrito full-page en `/carrito` con selección, checkout WhatsApp y pedidos recientes (sin envío) |
| `GarmentMock` | `components/GarmentMock.tsx` | Mock SVG de prenda con color dinámico, flip front/back (uncontrolled si no hay `onToggleSide`), placement de diseños |
| `GarmentCanvas` | `components/GarmentCanvas.tsx` | Canvas vertical único (frente+espalda apilados) para el editor: drag libre sin fronteras, diseños activos/fijados |
| `DesignFlow` | `components/DesignFlow.tsx` | 2 fases: "Personalizá tu diseño" (pills + canvas + clonar/tamaño/fijar) y "Crea tu diseño" (stepper Categoría→Clase→Diseño); `onConfirm(designs)` → carrito |
| `EstampadoSelector` | `components/EstampadoSelector.tsx` | Selector de clase de estampado con filtro por tags |
| `SizeSelector` | `components/SizeSelector.tsx` | Selector de tamaño de estampado |
| `SizeGuideModal` | `components/SizeGuideModal.tsx` | Guía de talles con medidas reales en cm por tipo de prenda |
| `ConfirmModal` | `components/ConfirmModal.tsx` | Modal de confirmación reutilizable |

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

### Sesión 11 — 2026-08-18 (Rediseño mobile-first tema claro según referencias)

- Spec + plan aprobados por el usuario: `docs/superpowers/specs/2026-08-18-mobile-redesign-light-theme-design.md` (commit `4cb14d3`) y `docs/superpowers/plans/2026-08-18-mobile-redesign-light-theme.md` (commit `4888a69`, 11 tareas). El agente NO puede leer imágenes; el usuario describió las referencias de `DISEÑO MOVIL/` por texto.
- **Tokens**: `index.css` `:root` → tema claro (`--bg #f8f9fa`, `--surface #ffffff`, `--text #1e2230`, `--accent #fa6e71`, `--radius-pill 999px`, sombras claras). `applyColors()` en `settings.ts` extiende `--surface-hover` (lightenHex 0.02), `--text-secondary` (lightenHex text 0.05), `--border` (lightenHex surface 0.06). Seed `site_settings` en `supabase-schema.sql` actualizado a colores claros.
- **Carousel** reescrito: `AUTOPLAY_MS=5200`, prop `variant "hero"|"onboarding"`, Ken Burns 12s (scale 1→1.12), dots con barra de progreso animada (`carousel-dot-fill`, key `progressKey`), swipe por pointer (delta 50px), shade gradiente, título multilínea con stagger (`title-rise`), `prefers-reduced-motion` desactiva animaciones.
- **OnboardingScreen** (`pages/OnboardingScreen.tsx`): ruta `/` siempre al entrar; título/subtítulo desde `store_title`/`store_subtitle` (fallbacks "STORE" / "Personalizá tu estilo…"); CTA "Let's Start" (pill blanca) → `/colecciones` y setea `localStorage.onboarding_seen`. Rutas: `/colecciones` (HomePage), `/carrito` (CartPage).
- **HomePage**: banner card navy (#1e2230, radio 20px) con título/subtítulo de settings, mock SVG de `garments[0]` (currentColor→accent) sobresaliendo arriba y botón "Explorar" (scroll a pills); pills de categorías derivadas de `g.tags` (pill activa = `--text`); grilla filtra por categoría. Eliminado carrusel + `OnboardingModal` de HomePage.
- **AppHeader**: prop `variant "default"|"transparent"` (transparent = `app-header--floating`); botón carrito y FAB → `navigate("/carrito")`; logo → `/colecciones`; back → `navigate(-1)`; `.app-header__store-name` usa `--text` salvo en floating (blanco). Botón de favoritos eliminado del header (commit `89ed2d0`): navegaba a `/favoritos`, ruta inexistente → página en blanco; el corazón queda en cards y hoja de producto.
- **ProductPage**: sin WhatsApp (eliminados `ADMIN_PHONE`, `buildWhatsAppMessage`, anchor); `handleAddToCart` → `toast.success("Agregado al carrito")` (sin abrir drawer); layout `product-sheet`: mock ~45% arriba + `product-sheet__body` (radius 20px top, sombra) con precio coral, base tachado, corazón favorito, share, descripción, swatches color, chips talla + guía, breakdown `placed-estampados` y botón "Elegí diseño" → abre bottom sheet (`sheet-overlay` + `sheet-panel`, max-height 60dvh, mock queda visible arriba para el drag). `AppHeader variant="transparent"` con back. Cierre del sheet al confirmar diseño (`setDesignFlowOpen(false)` en onAdd).
- **DesignFlow**: refactor a 3 solapas (`.design-flow__tabs`: Diseño/Tamaño/Ubicación, check coral en las completadas); solapa Diseño = clase + tipos en la misma vista; solapa Ubicación activa customMode (drag) y confirma; confirm limpia selección y vuelve a "diseno". Props intactas (customMode se recibe pero ya no se destructurea). Eliminado stepper/choice-btn (CSS muerto borrado).
- **CartPage** (`pages/CartPage.tsx`): carrito full-page. `selected Set<number>` (checkbox redondos, coral activo, "Seleccionar todo"), thumb render en vivo (GarmentMock front + back), breakdown de estampados, stepper cápsula `[− n +]`, borrar por ítem. Summary sticky: chips Retiro `$0.0` / Envío `a convenir`, filas Artículos seleccionados / Envío / Subtotal (solo ítems seleccionados), `btn-checkout` navy pill → WhatsApp (mensaje con desglose + total + envío; `placeOrder` al click), "Seguir comprando" → `/colecciones`, Volver (`navigate(-1)`) + Vaciar (btn-ghost). Pedidos recientes colapsable con `reorder`.
- **cart.tsx**: eliminados del contexto `isOpen/openCart/closeCart`; eliminado `CartDrawer`, `CartItemThumb`, `buildCartMockDesigns`, imports de GarmentMock/useNavigate (movidos a CartPage). Siguen `items/orders/reorder/placeOrder`.
- **Limpieza**: eliminados `OnboardingModal.tsx`, `QuickViewModal.tsx`, `StoreBanner.tsx` (dead code); CSS muerto borrado (cart-drawer/cart-overlay, breadcrumb, quick-view, stepper, choice-btn--salmon, design-flow__header). PWA: `index.html` theme-color `#f8f9fa`, `manifest.json` background/theme `#f8f9fa`, `sw.js` `CACHE_NAME store-v2 → store-v3`.
- **Verificación**: `npm run build` y `npm run lint` pasan (solo warnings preexistentes). No hay Playwright configurado en el repo (no existe `playwright.config.ts`), así que la verificación visual quedó pendiente: revisar en `store-d-psi.vercel.app` (o `npm run dev`) el onboarding, colecciones, producto y carrito en móvil 390px.
- Commits: `506303b` (tokens), `0d43c22` (sweep App.css), `3e7bf5e` (carousel), `6914d01` (onboarding+rutas), `0bc0fb9` (colecciones), `95b5dae` (header), `7d2396c` (product sheet), `155c807` (design flow tabs), `c9c918a` (cart page), `faf5317` (cleanup+PWA). Todo pusheado a `main` → Vercel auto-deploy.
- **Merge de línea paralela**: `main` divergió de `origin/main` (otra línea con sesiones 12-14c que refinaba el diseño viejo). Se unificó tomando el rediseño como base y **portando** `client/src/lib/recolorMock.ts` (reglas de tinting: fills casi blancos → color elegido, negros se repintan a `#272727` si el color elegido es negro) + su uso en `GarmentMock.tsx` y `AdminGarmentForm.tsx`. Los fixes del layout viejo (ProductPage/HomePage/App.css/DesignFlow de esa línea) quedaron superados y descartados. `recolorMockSvg()` hace el strip de width/height + replace de `currentColor` que antes era inline.

### Sesión 11b — 2026-08-18 (Correcciones de UI en paleta oscura, commit `63ed132`)

- **Causa raíz de letras blancas sobre blanco**: la DB `site_settings` mantiene la paleta OSCURA (`color_text #f2f4f7`) y varios componentes asumían tema claro. El usuario pidió **seguir con colores oscuros** (NO aplicar el seed claro). Se corrigieron los componentes, no la paleta. `supabase-schema.sql` actualizado a defaults oscuros (`#131518`/`#1c1f24`/`#f2f4f7`/`#f97316`) para consistencia.
- **Onboarding**: `.onboarding__overlay` movido al centro-superior (`top: 45%`, `translateY(-50%)`, texto centrado) para que el CTA "Let's Start" no quede sobre los dots del carrusel; CTA más fino (`padding 0.65rem 2.25rem`) y con `color: #1e2230` hardcodeado (antes `var(--text)` = blanco → invisible sobre la pill blanca).
- **AppHeader**: `.app-header` pasa de `rgba(255,255,255,0.9)` a `color-mix(in srgb, var(--surface) 92%, transparent)` + blur → barra oscura donde las letras blancas (var(--text)) sí se ven. Aplica a colecciones, producto y carrito. Nueva prop `showHome` → botón home (→ `/`) para "volver a inicio" desde colecciones.
- **HomePage**: eliminados el botón "Explorar" y la imagen de la prenda del banner (y su CSS `.collections-banner__mock`/`__cta`); el banner ahora soporta **imagen de fondo** vía `settings.collections_banner_url` (dark overlay `rgba(19,21,24,0.6)` + cover, fallback navy `#1e2230`).
- **ProductPage**: header pasa de `variant="transparent"` (flotante, tapaba la prenda) a `default` (sticky); se eliminó la sección "QUIZÁS TAMBIÉN TE GUSTE" (estado, effect y JSX de recommendations + import `GarmentRow` + CSS `.recommendations`/`.recommendation-card`); `.product-sheet` reparte 60% mock / 40% body (antes 45/55 → el body tapaba la prenda); `.product-footer` sin padding horizontal → botón "Agregar al carrito" de ancho completo de pantalla.
- **Admin**: input "Imagen de fondo de colecciones" en la tab Tienda (upload a bucket `store-images`, campo `collections_banner_url`).
- **SQL aplicado por el usuario**: `alter table site_settings add column collections_banner_url text not null default '';` — ya ejecutado en Supabase (verificado: la columna existe). El guardado de settings desde admin funciona.

### Sesión 11c — 2026-08-18 (Producto con scroll de página completo, commit `43b7e53`)

- **Problema**: el botón "Elegí diseño" quedaba tapado por el `product-footer` fijo (el body tenía scroll interno de 40% de altura); además, al tener scroll interno, el navegador móvil no ocultaba su barra superior (a diferencia de colecciones) y el header (nombre + back + carrito) nunca desaparecía.
- **Fix**: `.product-page .app-header` → `position: static` (el header se va al hacer scroll hacia la personalización). `.product-sheet` pierde el `height: calc(100dvh - 56px)` (scroll de página normal → el navegador oculta su barra). `.product-sheet__mock` pasa a `height: 52dvh; min-height 320px; max-height 520px`. `.product-sheet__body` pierde el flex/overflow interno y gana `margin-top: -20px` (solapa al mock) + `padding-bottom: calc(7rem + safe)` para que el botón "Elegí diseño" quede por encima del footer fijo.
- **Drag preservado**: `useEffect` en ProductPage hace `scrollIntoView` del mock al abrir `designFlowOpen`, y `.product-sheet__mock--sticky` (clase activa cuando el flujo de diseño está abierto) fija el mock arriba con `z-index: 2001` (sobre el `sheet-overlay`), así la superficie de arrastre queda visible sobre el bottom sheet.
- Verificación: `npm run build` y `npm run lint` pasan. Push `54d8972..43b7e53`.
- Verificación: `npm run build` y `npm run lint` pasan (solo warnings preexistentes). Commit `63ed132` sin pushear.

### Sesión 12 — 2026-08-19 (Tema claro aplicado en producción)

- Usuario retomó el plan `2026-08-18-mobile-redesign-light-theme.md` (había sido rechazado en 11b para mantener oscuro). El código YA estaba en claro (tokens `index.css`, `applyColors`, barrido `App.css`, PWA `theme-color #f8f9fa`); lo que mantenían la app oscura eran la DB viva `site_settings` y el seed SQL.
- `supabase-schema.sql`: seed de `site_settings` revertido a claro (`#f8f9fa`/`#ffffff`/`#1e2230`/`#fa6e71`).
- Usuario corrió en SQL Editor de Supabase el `update site_settings set color_* = ... where id = 1;`. Verificado vía REST (`apikey` anon): `color_bg #f8f9fa`, `color_surface #ffffff`, `color_text #1e2230`, `color_accent #fa6e71`.
- Los 3 usos de `#1e2230` hardcodeado en `App.css` son intencionales (CTA onboarding, banner colecciones navy, checkout navy).
- Verificación: `npm run build` pasa. Sin deploy necesario (los colores se leen de la DB al montar).
- Pendientes: commitear el seed (`supabase-schema.sql`) si el usuario lo confirma.

### Sesión 13 — 2026-08-19 (Rediseño urbano claro: spec estricta "Estilo Urbano Claro")

- Spec del usuario (texto, sin imágenes): paleta exacta `bg #F4F4F5`, `text #000000`, `secondary #52525B`, `surface #FFFFFF`, `border 1.5px #E4E4E7`, `accent #84CC16` (verde lima), sin sombras; tarjetas radio 12px, botones de acción 8px; display Oswald (títulos/precios uppercase bold) + body Inter.
- **Tokens (`index.css`)**: `--bg #f4f4f5`, `--text #000000`, `--text-secondary #52525b`, `--border #e4e4e7`, `--accent #84cc16`, `--accent-hover #65a30d`, `--font-display Oswald`. Eliminado uso de sombras en cards/paneles (bordes sólidos 1.5px).
- **`settings.ts` `applyColors`**: `--surface-hover #fafafa`, `--text-secondary #52525b`, `--border #e4e4e7` ahora CONSTANTES (antes derivadas por lightenHex → con text negro/surface blanco darían valores inválidos). Acento sigue viniendo de la DB.
- **HomePage**: card de producto rediseñada — `div` (antes button anidado → HTML inválido, warning preexistente resuelto), media 1:1 con badge negro flotante "NUEVO" (texto blanco, Oswald), nombre uppercase, precio negro Oswald, botón `btn-buy-now` negro ("COMPRAR AHORA", hover `#27272a`, 8px). Favorito sigue como botón absoluto.
- **ProductPage**: `btn-elegir-diseno` → verde `#84cc16` texto negro 8px uppercase ("CREA TU DISEÑO"). `btn-primary` (Agregar al carrito) → negro texto blanco uppercase Oswald 8px hover `#27272a`. Precio de producto → negro Oswald (antes accent).
- **CartPage**: 3 botones en grilla (`cart-page__actions` grid 3 columnas): Volver / Seguir comprando / Vaciar carrito (blanco, borde 1.5px gris, texto `#52525B`). `btn-checkout` → negro uppercase Oswald 8px. `cart-qty` → compacto 8px, borde 1.5px, botones transparentes con divisores verticales. Precios de ítem y breakdown → negro.
- **Selectores**: `size-chip`, `estampado-card`, `collections-pill`, `tag-chip`, `size-guide-tab`, stepper: inactivos blancos borde 1.5px gris texto `#52525B`; activos NEGRO bg texto blanco (antes accent). `color-swatch--active` ring negro. FAB carrito → negro bg, icono blanco, badge verde `#84cc16` texto negro. Header badge verde/negro. App header → `--surface` sólido + borde 1.5px (sin blur/color-mix).
- **PWA**: `index.html` y `manifest.json` theme/background `#f4f4f5`. Carousel fallback gradient a `#f4f4f5/#000/#84cc16`. Banner colecciones fallback navy `#1e2230` → negro `#000`.
- **DB**: seed `supabase-schema.sql` → `#f4f4f5/#ffffff/#000000/#84cc16`. Pendiente: usuario corre el UPDATE en SQL Editor (agente no tiene acceso).
- Verificación: `npm run build` pasa; oxlint solo warnings preexistentes.

### Sesión 11d — 2026-08-18 (Fix lógica de diseño/tamaño/ubicación, commit `98e38a6`)

- **Feedback**: "dañastes la logica que tenia antes, con respecto a elegir el diseño, el tamaño, y la localizcion". Causa raíz doble:
  1. **Layout**: con el scroll de página (11c), el mock fijado (`.product-sheet__mock--sticky`, `z-index: 2001`, 52dvh) cubría el tope del `sheet-panel` (max-height 60dvh) → las solapas Diseño/Tamaño/Ubicación quedaban tapadas e inaccesibles (overlap ~100px en teléfono). Se podía elegir el diseño pero jamás llegar a tamaño ni ubicación.
  2. **Regresión de lógica** (commit `155c807`): el stepper guiado original fue reemplazado por 3 solapas libres que auto-seleccionaban el primer tamaño y no gateaban progresión.
- **Fix `DesignFlow.tsx`**: se restauró el stepper de 4 pasos (`.design-flow__stepper` + `.stepper-step` + `.stepper-connector`) — "Elegí categoría → Elegí diseño → Elegí tamaño → Elegí ubicación" — con auto-avance (elegir algo pasa al siguiente paso), gateo `canGoToStep` (pasos deshabilitados hasta cumplir prerequisito) y mensajes amables si una categoría/tamaño no tiene opciones. Paso inicial `"clase"` (el sheet se monta/desmonta con `designFlowOpen`, ya no hay estado "closed"). Header nuevo `.design-flow__header` con título + botón cerrar (prop `onClose`).
- **Fix layout (`App.css`)**: `.sheet-panel` pasa de `max-height: 60dvh` a `44dvh` → siempre queda por debajo del mock fijado (52dvh) y el stepper nunca queda tapado. Se eliminó el CSS de `.design-flow__tabs/.tab` y se agregó el del stepper + `@container (max-width: 480px)` que envuelve el stepper en grilla 2x2 en anchos chicos (era del CSS viejo).
- **ProductPage**: se pasa `onClose={() => setDesignFlowOpen(false)}` al DesignFlow.
- **Verificación e2e (Playwright, viewport 390x844, headless chromium)**: 15/15 checks OK — stepper de 4 pasos visible, auto-avance categoría→diseño→tamaño→ubicación, modo drag activo en el mock, confirm habilitado, estampado agregado y sheet cerrado. Geometría: mock y=0..439, panel y=473+ (gap 34px), stepper y=557 dentro del panel (sin overlap). Warning preexistente en consola: botón anidado en botón en la página de colecciones (no es de este cambio).
- Otras notas: las prendas 5-6 SÍ tienen 5 tamaños de estampado cada una en la DB viva (un dato viejo de memoria decía lo contrario). El dev server de vite arrancó en el puerto **5185** (no 5173) y se detuvo al terminar la prueba. Push `43b7e53..98e38a6`.

### Sesión 14 — 2026-08-19 (Ronda de UI: onboarding, colecciones, producto, design flow)

- **Decisión funcional (pregunta al usuario)**: al quitar la barra fija "Agregar al carrito", el botón flotante de la página de producto pasa a ser la acción **Agregar al carrito**; el carrito se accede desde el ícono del header. `AppHeader` ganó la prop `hideFab` (ProductPage la usa para no mostrar el FAB global de carrito).
- **Onboarding**: overlay movido de centro a **abajo-izquierda** (`bottom 3rem/left 1.5rem`, texto left, max-width 18rem); título y subtítulo **+3px** (clamp con `calc(... + 3px)`); subtítulo se renderiza **en líneas apiladas** (split por "·" → `onboarding__subtitle-line`, cada parte en su línea — con el seed "DISEÑO PROPIO · ALGODÓN ORGÁNICO" da 2 líneas); CTA a píldora (`--radius-pill`). Carrusel: dots **finos arriba-centro** (dot 4px, activo 20px×4px) escopetados a `.carousel--onboarding`; `touch-action: pan-y` en el carrusel de onboarding para swipe con el dedo (los handlers de pointer ya existían).
- **Colecciones**: `HomePage` header pasa de `showHome` a `showBack + title="COLECCIONES"` (flecha izquierda + título centrado + carrito derecha, una sola línea). `.app-header__title` sube a `calc(0.9rem + 2px)` (aplica a todas las páginas con título). Tarjetas: `.category-card` borde **negro `var(--text)` 1.5px siempre visible** (antes `--border`, solo negro en hover). `.collections-pill` y `.btn-buy-now` a píldora.
- **Producto**: eliminado `.product-footer` (JSX y CSS muerto borrado) → nuevo `.fab-add-cart` (pill verde `#84cc16`, texto negro, fijo abajo-derecha, `display:none` ≥768px, icono carrito). `.product-sheet__body` padding-bottom 7rem → 6rem. `.control-clear` ("Guía de tallas") deja de ser text-link y pasa a **píldora verde neón** (bg `#84cc16`, texto negro, hover `#65a30d`). `.btn-elegir-diseno` a píldora.
- **DesignFlow**: header "CREA TU DISEÑO"; stepper pasa de 4 a **3 pasos** (categoría → diseño → tamaño; se quitó "Elegí ubicación"); en la fase `location` el stepper se oculta y solo queda el área de confirmación. Sheet **full-screen** (`.sheet-panel` height 100dvh, radius 0). La prenda **se oculta durante los pasos** (`.product-sheet__mock--hidden`) y **aparece al llegar a location** con frente arriba / espalda abajo apiladas (`.mock-frame--drag .mock-duo` pasa de `row` a `column`, cada mock max-width 210px; `.product-sheet__mock--drag-full` height `clamp(520px, 76dvh, 640px)`; `.sheet-panel--with-mock` padding-top igual para dejar el botón Confirmar visible). Botón confirmar → **"Confirmar diseño"** con `.btn-primary--pill`. Tras confirmar aparece en el body de producto `.btn-seguir-disenando` (pill verde neón "SEGUIR DISEÑANDO") que reabre el flow. Efectos de DesignFlow ahora tienen cleanup (resetean customMode/customPos/customSide/preview al desmontar — cierra el leak si se cierra el sheet en location).
- Verificación: `npm run build` y `npm run lint` pasan (solo warnings preexistentes: unused en `settings.ts`, only-export-components, exhaustive-deps en ProductPage/CartPage). **Sin commit/push** (el usuario no lo pidió). Pendiente verificación visual en móvil (mock apilado en location, sheet full-screen).

### Sesión 15 — 2026-08-19 (Ronda 3: DesignFlow autocontenido, favoritos, carrito sin envío)

- **Decisión funcional (pregunta al usuario)**: al confirmar un diseño → "Agregar y actualizar (Recomendado)": la prenda con TODOS los diseños confirmados se agrega al carrito y se abre el carrito; si la prenda (color+talla) ya está, se **actualiza** (no duplica). Implementado con nuevo método `upsertItem` en `cart.tsx` (merge por `garmentId+colorHex+size`, reemplaza `estampados`, conserva `quantity`). Nota: cada visita fresca a la página de producto resetea `placedEstampados`, así que la acumulación multi-diseño solo persiste si no se abandona la página.
- **DesignFlow reescrito (self-contained)**: full-screen con 2 steppers según fase — selección (Elegí categoría → Elegí diseño) y placement (Elegí tamaño → Elegí ubicación); niveles `clase→tipo→diseno→size→location`. El mock de la prenda (frente arriba / espalda abajo apiladas) vive DENTRO del flow; drag activo en `location`, tamaño editable en `size` y `location`, elegir tamaño auto-avanza a ubicación con diseño centrado (50,50). Títulos "CREA TU DISEÑO" (selección) / "Personalizá tu diseño" (placement); back contextual (location/size→diseno, diseno→tipo, tipo→clase, clase→cierra). `onAdd(designs)` entrega los confirmados. ProductPage ya NO maneja `customMode/customPos/customSide/previewStamp/frameRef` (props simplificadas).
- **ProductPage**: FAB `.fab-add-cart` redondo (58x58, radius 50%, icono-only, `min-height: 0`) = Agregar al carrito (antes era "Elegir diseño"); `.btn-elegir-diseno` negro con texto blanco (antes verde); `.control-clear` font-weight 700; mock simplificado (sin sticky/hidden/drag-frame). `onAdd` construye CartItem con `next=[...placedEstampados, item]`, llama `upsertItem` y `navigate("/carrito")`.
- **Bug real corregido**: el efecto de URL compartible de ProductPage (`window.history.replaceState`) pisaba `navigate("/carrito")` tras confirmar (CartPage renderizada con URL de producto). Fix: guard en el efecto — solo `replaceState` si `window.location.pathname.startsWith(\`/producto/${garment.slug}\`)`.
- **Favoritos**: AppHeader gana corazón con badge verde neón (`useFavorites().totalCount`, "9+" si >9) → `/favoritos`. NUEVO `FavoritesPage.tsx` (ruta registrada en App.tsx): lista con miniaturas GarmentMock (vía `useGarment(fav.garmentSlug)`), "Ver prenda" (btn-small), quitar, empty state. `FavoriteItem` exportado desde `favorites.tsx`.
- **Carrito sin envío**: CartPage pierde `shipMode`, chips Retiro/Envío y fila Envío (incl. `buildWhatsAppMessage`); `.cart-summary` pasa de sticky a ESTÁTICO al final con filas Artículos seleccionados / Subtotal / Descuento $0 / Total de esta compra; "Seguir comprando" con `.btn-ghost--accent` (verde neón #84cc16).
- **CSS**: `.cart-checkbox` `min-height: 0` — **causa raíz de los checkboxes ovalados**: la regla global `button { min-height: 44px }` (TOUCH TARGETS, App.css ~3353) estiraba a 44px un checkbox de 22px. Eliminados CSS muertos (`.cart-ship*`, `.product-sheet__mock--sticky/--hidden/--drag-full`, `.sheet-panel--with-mock`, `.mock-frame--drag*`); nuevos `.design-flow__mock` (stack column, ambas mocks visibles, outline al drag) y `.design-flow__preview`; header del flow con título flex:1 centrado y back 34px.
- **Verificación**: `npm run build` y `npm run lint` pasan (solo warnings preexistentes). Playwright (390x844): FAB redondo; CREA TU DISEÑO negro; Guía de tallas 700; corazón+carrito en header; steppers por fase; 7 categorías→5 tipos→preview→confirm; 2 mocks apilados; drag en location; confirm→`/carrito` con 1 ítem ("Calaveras · CLVR 1 (Pequeño)"); 2º confirm distinto→1 ítem con diseño reemplazado (upsert); badge favoritos=1; carrito: filas summary correctas (1 / $8.500 / $0 / $8.500), sin chips ship, checkbox 22x22 radius 50%, "Seguir comprando" bg rgb(132,204,22). Onboarding OK (CTA es "Let's Start", no "Comenzar"). **Sin commit/push** (el usuario no lo pidió). Scripts de prueba en `%TEMP%\opencode\test_round3.py`, `test_cart.py`, `test_cart2.py`, `test_upsert.py`, `test_smoke.py`.

### Sesión 16 — 2026-08-21 (Flujo de diseño v2: 2 fases + canvas vertical único)

- **DesignFlow reescrito en 2 fases** (`phase: "personaliza" | "crea"`):
  - *Personalizá tu diseño*: pills `.df-pill` "Elige diseño" / "Confirma Diseño" (negro/letras blancas, activo verde neón #84cc16 texto negro). Canvas SIEMPRE visible (con o sin diseños). Confirmar → `onConfirm(designs)` → ProductPage hace `upsertItem` + `navigate("/carrito")` (sin dedupe: los clones son válidos, upsertItem ya reemplaza estampados).
  - *Crea tu diseño*: stepper de 3 pasos — "Elige Categoria / Elige Clase / Elige Diseño" — círculos negros, activos/done verde neón con ✓ negro. Secciones acumulativas con títulos "Categorías de Diseño" / "Clases de Diseños" / "Imágenes de Diseños". Categorías = tags únicos de `estampados`; Clases = estampados filtrados por tag; Imágenes = `diseno_tipos`. Cards SIN descripción (solo nombre). Botón final "Elige la Imagen".
- **GarmentCanvas.tsx (nuevo)**: canvas vertical ÚNICO con frente+espalda apilados (`.garment-canvas__half`) — sin frontera de arrastre entre vistas. Conversión coordenadas canvas↔carrito: `y<50%` = front (`y*2`), `y≥50%` = back (`(y-50)*2`) — mantiene compatibilidad con `customPosition + side` existente (thumbnails del carrito sin migración).
- **Editor por diseño activo**: borde verde si activo; toolbar flotante clonar `− n +` (contador por tipo) + fijar 📌; fijado = sin borde/bloqueado, tap lo reactiva. Rail vertical derecho `.df-size-btn` redondo 30px S/M/L/XL/FULL (mapea `estampado_sizes` ordenados por `width_percent`, conserva precio) con título "Elige Tamaño" a 2 líneas.
- **Scroll del editor**: `touch-action: pan-y` en `.garment-canvas` + `none` en `.df-design` — la página scrollea sobre la prenda, el drag de diseños no se afecta.
- **Fix "Ver posterior"**: ProductPage pasa `side="front"` fijo y GarmentMock hacía `props.side ?? localSide` → flip interno nunca aplicaba. Fix: sin `onToggleSide` usa solo `localSide` (init desde props.side).
- **Ronda de fixes móvil (misma sesión)**: header 48px (override `min-height:0` en `.app-header__cart`/`.btn-icon` — la regla global `button {min-height:44px}` era la causa); iconos en fila flex. Onboarding: título `store_d` (replace espacios→_), títulos +3px, CTA +50% (padding 1rem 3.4rem), dots discretos 3px/activo 16×2px top 1.1rem. Carrito: "Seguir comprando"/"Explorar colección" con `navigate(..., {replace:true})` (back desde colecciones ya no vuelve al carrito); botones píldora `.btn-pill-outline` (blanco/borde negro) y `.btn-pill-dark` (negro); checkout píldora verde neón "Checkout por Whatsapp"; mensaje WhatsApp detallado por diseño (tamaño %, lado Frente/Posterior, X%/Y%). Toast abajo-centro (`bottom 5.5rem+safe-area`, animación translateY) — ya auto-cierra a 4s.
- **Limitación WhatsApp**: `wa.me` NO soporta imágenes, solo texto. El "mensaje-imagen del carrito" se implementó como texto detallado. Imagen real requeriría WhatsApp Business API (pendiente futuro).
- **Verificación**: `npm run build` OK; oxlint solo warnings preexistentes (+2 fast-refresh por exports en GarmentMock). Playwright e2e: flujo completo 28/28, drag frente→espalda 2/2, ronda fixes 11/11. Scripts en `%TEMP%\opencode\test_flow_v2.py`, `test_flow_drag.py`, `test_round4b.py`.
- Commits: `d1d3965` (flujo v2) + ronda fixes → push a `main` → Vercel auto-deploy.

### Sesión 17 — 2026-08-21 (Ronda 5 UI: header unificado, carrito/favoritos 3 columnas, badge DB, guía de uso)

- **SQL APLICADO en Supabase (confirmado por el usuario, 2026-08-22)** (`docs/sql/2026-08-21-round5-badge-and-bg.sql`): `garments.badge_label text not null default 'Nuevo'` + `site_settings.collections_bg_url text not null default ''`. El badge editable por prenda (Admin → editar prenda → "Etiqueta de la tarjeta") y el fondo de página de colecciones (Admin → Tienda → "Imagen de fondo de la página") están operativos.
- **Header unificado**: `.app-header__title` ahora Oswald 700 1.05rem uppercase en todas las páginas; iconos unificados a 22px stroke 2 sin bordes (clase `.app-header__icon-btn`); icono del carrito reemplazado por carrito de supermercado. AppHeader gana props `storeName` y `bigStoreName` (usadas en `/carrito` para mostrar "store-d" grande y en negrilla).
- **Toast**: duración 2000ms, sin botón de cerrar, auto-dismiss con useEffect (exit anim 250ms).
- **Onboarding/carrusel**: título de tienda cambia a Inter 800 y +70% (`clamp(calc(4.4rem+10px), 18vw, calc(10rem+10px))`); dots del carrusel hero rediseñados como barras finas discretas (16×3px, activo 34×3px con barra de progreso).
- **Colecciones**: banner min-height 300→180px (-40%) y width 80% (-20%); tarjetas width 80%; badge desde `garments.badge_label` con fondo verde neón #84cc16 y letras negras; FAB oculto (`hideFab`); fondo de página configurable vía `settings.collections_bg_url` (overlay claro 0.82 + fixed cover) — upload en admin tab Tienda.
- **Producto**: separadores grises `.product-separator` (precio/desc → color → talla → botones); `.size-chip--active` verde neón texto negro; FAB eliminado (CSS borrado) → botón fijo `.btn-add-cart-pill` ("Añade al Carrito", píldora verde neón) debajo de CREA TU DISEÑO; body padding-bottom reducido a 2rem.
- **DesignFlow**: pills ahora 3 ("Elige diseño" / "Guía de Uso" blanca borde negro / "Añade al Carrito" antes "Confirma Diseño"); modal de guía `.df-guide-box` con 6 pasos; rail de tamaños: cuadrados redondeados 36px (+20%), blanco/borde negro inactivo → verde neón habilitado → negro/letras blancas el elegido; título rail +20% (0.66rem); botón "-" del toolbar se ve negro igual que "+" cuando disabled (solo ícono atenuado); stepper centrado (`justify-content:center`).
- **Carrito**: header con store-d grande; layout tarjeta en grid 40%/50%/10% (thumb grande / info lista / selección+eliminar); select-all movido a la derecha (frase + contador + círculo); tamaños de diseño como iniciales (S/M/L/XL/FULL via `stampSizeLabel` por width_percent); sin "Ubicación libre" ni nombre de vista; qty selector abajo de la franja central; delete verde neón grande; checkout verde neón hardcode #84cc16; Volver → página de la prenda del ítem seleccionado; Seguir comprando → colecciones.
- **Favoritos**: tarjetas grid 30%/55%/15% (imagen básica / info / eliminar arriba + ojo "ver prenda" abajo, ambos verde neón).
- **Verificación**: `npm run build` OK; oxlint solo warnings preexistentes; Playwright e2e 38/38 checks (scripts `%TEMP%\opencode\test_round6.py`, `test_round6b.py`). Sin commit/push (usuario no lo pidió).

### Sesión 18 — 2026-08-22 (Ronda 6: fixes de badges + layout carrito/favoritos refinado)

- **Fix badges del header**: causa raíz — al renombrar `.app-header__cart` a `.btn-icon.app-header__icon-btn` se perdió `position: relative` y el badge absoluto quedaba anclado al ancestro posicionado (invisible). Fix: `.app-header__icon-btn { position: relative }`.
- Onboarding title −20% (`clamp(3.5rem+8px, 14.5vw, 8rem+8px)`). Colecciones: tarjetas 80%→96%, corazón activo verde neón.
- Producto: separador movido entre tallas y CREA TU DISEÑO (ya no entre los dos botones); "Guía de tallas" blanca/borde negro; corazón activo neón; nueva fila `.product-actions-row`: "Añade al Carrito" + "Ver el Carrito" (blanca, borde negro, badge neón con count estilo header "9+").
- DesignFlow: selector de tamaño ahora es fila horizontal centrada (`.df-size-row`) debajo de los pills (título "Elige Tamaño" + cuadrados en línea); canvas ocupa todo el ancho (`.df-editor__canvas` eliminado); hint "Arrastrá el diseño..." eliminado; botón "−" del clonador elimina también el último diseño (sin guard `count<=1`, disabled removido); back/close sin borde e íconos strokeWidth 2.5; "Elige la Imagen" verde neón.
- Carrito: fila superior con "CARRITO" a la izquierda + "Seleccionar todo" + badge neón `.count-badge` + círculo; tarjetas `.cart-item--order` flex 50/50 — mitad izquierda imágenes personalizadas, mitad derecha filas `ci-row` (label izquierda / precio derecha alineados): Nombre+checkbox / Color / Talla / Básica:$ / Diseño:X / Tamaño:X:+$ / Valor==$total / qty+eliminar.
- Favoritos mantienen grid 30/55/15 (`.fav-item` ahora define su propio display:grid porque `.cart-item` dejó de ser grid).
- Verificación: build OK, lint solo warnings previos, Playwright ronda 7: 26/26 (badge de "Ver el Carrito" verificado post-add). Commit `1f3ddd3` + push → Vercel auto-deploy.
- SQL aplicado por el usuario (2026-08-22): `garments.badge_label` y `site_settings.collections_bg_url` ya existen en producción.

### Sesión 19 — 2026-08-22 (Ronda 7: fixes editor carrusel + botones producto/carrito/checkout)

- **Carrusel — texto sobre imágenes no aparecía**: causa raíz en `Carousel.tsx` — `slide.text_overlay.split("\\n")` busca el literal de 2 caracteres `\`+`n`, pero el seed SQL guarda un LF real (byte `\n`, 1 char) → el título nunca se separaba en líneas. Fix: `.replace(/\\n/g, "\n").split("\n")` acepta tanto el LF real como el literal.
- **Carrusel — "no sube imágenes" / sin feedback**: `saveSlide()` ahora devuelve `{ ok, error }` sobre el update real (antes `boolean` sordo). `AdminDashboard` pasó a usar `useToast` (import de `lib/toast`; `ToastProvider` ya envuelve `/admin` en App.tsx): toasts de éxito/error al subir imagen 1/2 y al "Guardar carrusel" (recorre slides y reporta si alguno falla). `AdminSettings.tsx` (código muerto) conserva el retorno sin usar, por eso sigue compilando.
- **Producto — botones de carrito**: `.product-actions-row` ya no lleva texto; los dos botones ahora son píldoras icono SOLO con el icono de carrito de supermercado (reutilizado del header). CSS `.btn-add-cart-pill`/`.btn-view-cart-pill` unificados: `flex:1`, `height:3rem`, píldoras centradas; add-cart verde `#84cc16` (hover `#65a30d`), view-cart blanca borde negro, badge `btn-view-cart-pill__badge` ahora `position:absolute` top-right. Aria-labels "Agregar al carrito"/"Ver el carrito".
- **Carrito — contador al deseleccionar**: el badge de la fila select-all usaba `totalItems` (total global) → no bajaba al deseleccionar. Ahora usa `selectedCount` (solo items seleccionados). Se eliminó `totalItems` de la destrucción de `useCart()` en CartPage (TS6133).
- **Badges "9+" → 3 cifras**: todos los badges del AppHeader (carrito, favoritos), FAB y `btn-view-cart-pill` muestran el número real hasta `999+`.
- **Checkout verde**: `.btn-checkout` ya usaba `#84cc16`; su hover `filter: brightness(0.92)` oscurecía a otro verde. Alineado al patrón verde neón de la app: hover `background:#65a30d` (+`border-color`), disabled `filter:none`.
- **Verificación**: `npm run build` pasa (solo warning chunk-size preexistente); oxlint solo warnings preexistentes (exhaustive-deps en ProductPage/CartPage). Sin commit/push (el usuario no lo pidió).

### Sesion 20 - 2026-09-02 (Ronda 8: fixes guardado carrusel, fondo colecciones, checkout verde, botones de prenda)

- **Carrusel - "no se pudo guardar el carrusel" (causa raiz)**: `saveSlide()` (lib/settings.ts) enviaba al UPDATE el objeto COMPLETO de `select("*")`, incluyendo la columna `id` (identity `generated always`) en el body -> PostgREST rechaza actualizar una columna identity (400) -> toast de error. Los demas tab-holders (settings, prendas) guardaban porque sus updaters excluyen `id`/`updated_at`; el carrusel era el unico que mandaba `id`. Fix: `saveSlide` construye un payload explicito SOLO con columnas editables (`sort_order, layout, image_1_url ?? "", image_2_url ?? "", text_overlay ?? "", subtitle ?? ""`) y filtra con `.eq("id", Number(id))` (bigint llega como string). Ademas, el handler de "Guardar carrusel" en AdminDashboard ahora muestra el error real de Supabase en el toast (`.toast.error("No se pudo guardar el carrusel", firstError)`) para diagnosticar si vuelve a fallar.
- **Fondo de colecciones - demasiado opaco**: overlay claro del `pageBgStyle` en HomePage.tsx paso de `rgba(244,244,245,0.82)` a `rgba(244,244,245,0.49)` (~40% mas transparente) para que se aprecie la imagen de fondo.
- **Checkout "verde claro" persistente**: `.btn-checkout` YA era `#84cc16` (hover `#65a30d`) desde la sesion 19; el "verde claro" que seguia viendo el usuario era CACHE PWA sirviendo el CSS viejo. Fix: bumpear `client/public/sw.js` `CACHE_NAME` `store-v3` -> `store-v4`. Regla para el futuro: cualquier cambio de CSS/JS requiere bumpear el `CACHE_NAME` o los usuarios sobre la PWA siguen viendo estilos viejos.
- **Botones de prenda (ProductPage)**: `.btn-add-cart-pill` ahora muestra el texto "AÑADE" + icono de carrito; `.btn-view-cart-pill` muestra "VER" + icono de carrito, y el contador `btn-view-cart-pill__badge` ya NO flota absoluto top-right sino que va DENTRO del boton (posicionado sobre el icono, `top:50%; left:calc(50% + 8px); transform:translateY(calc(-50% - 12px))`). Botones con `gap:0.35rem`, `font-size:0.8rem`, `font-weight:700`, uppercase Oswald.
- **Verificacion**: `npm run build` OK (solo warning chunk-size preexistente); oxlint solo warnings preexistentes (unused vars en settings.ts, exhaustive-deps, only-export-components).
- **Deploy**: commit `27c94d5` pusheado a `main` -> Vercel auto-deploy en `store-d-psi.vercel.app`. `Cambios.docx` (raiz) NO se commitea (archivo del usuario).
