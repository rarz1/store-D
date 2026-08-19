# Diseño: Rediseño móvil STORE — Tema claro estilo referencias

## Goal

Llevar la app a una experiencia mobile-first premium siguiendo las referencias de diseño de la carpeta `DISEÑO MOVIL` (onboarding full-screen, colecciones con banner card + pills, detalle de prenda con hoja de detalles y selector de diseño en bottom sheet, carrito como página completa con resumen y checkout). El tema pasa de oscuro a **claro** (fondo `#F8F9FA`, superficie `#FFFFFF`, texto azul noche `#1E2230`, acento coral `#FA6E71`), manteniendo la paleta editable desde admin.

## Decisiones confirmadas con el usuario

1. **Tema**: claro estilo referencias. La paleta editable de admin se mantiene (solo cambian los defaults).
2. **Onboarding**: pantalla separada full-screen, siempre al entrar; CTA "Let's Start" → `/colecciones`. El carrusel de inicio debe ser moderno y espectacular (Ken Burns, auto-play con barra de progreso, parallax, texto en stagger, swipe con scroll-snap, reduced-motion).
3. **Carrito**: página completa en `/carrito` (reemplaza al `CartDrawer`). Botón WhatsApp **solo en el carrito** (se elimina de la página de personalización). Botones: Checkout (WhatsApp), Seguir comprando, Volver (history back), Vaciar carrito.
4. **Envío**: chip "Retiro" → `$0.0` / "Envío" → "a convenir según distancia". Nunca "ARS", solo `$`.
5. **Personalización**: todo en una página `/producto/:id`. CTA anclado "Elegí diseño" (pill) que abre **bottom sheet** con 3 solapas: Diseño / Tamaño / Ubicación. Se descartó la barra vertical semiescondida por UX (descubribilidad y touch targets).

## Context

- La app es React 19 + Vite + react-router-dom v7 + Supabase + TanStack Query. Todo en `client/`.
- `App.css` (~64KB) es monolítico y oscuro con colores hardcodeados (rgba blancos/negros).
- Paleta editable vía `site_settings` → `applyColors()` (CSS vars `--bg`, `--surface`, `--text`, `--accent`).
- `DesignFlow.tsx` es un stepper de 4 pasos (categoría → diseño → tamaño → ubicación); el estado del drag (`customMode`, `customPos`, `customSide`) vive en `ProductPage.tsx` y se pasa al `DesignFlow` como props controladas.
- `cart.tsx` contiene `CartProvider` + `CartDrawer` (drawer lateral) + `buildWhatsAppCartMessage()` + pedidos recientes (localStorage).
- `OnboardingModal.tsx` (modal de 3 pasos) y `QuickViewModal.tsx` (dead) existen.
- Ya hay `capacitor.config.ts` + plugin Android en `package.json`, pero no se toca en este trabajo (la app sigue siendo web/PWA; el `webDir` `www` no coincide con `dist` — fuera de scope).

## Scope

### Fase 0 — Fundación de tema claro

- **Defaults de paleta claros** en:
  - `client/src/index.css` (vars CSS por defecto).
  - `client/src/lib/settings.ts` → `applyColors()` / defaults de `getSettings()`.
  - `supabase-schema.sql` (seed de `site_settings`).
  - Paleta: `--bg: #F8F9FA`, `--surface: #FFFFFF`, `--text: #1E2230`, `--accent: #FA6E71`, `--accent-hover: #E85D5E`.
- **Nuevos tokens** en `index.css`/`App.css`:
  - `--text-muted` (#6B7280), `--border` (#E0E0E0), `--radius-pill: 999px`.
  - Sombras suaves/neumórficas claras: `--shadow-sm` a `--shadow-xl` ajustadas a tema claro.
- **Barrido de colores hardcodeados** en `App.css`: reemplazar rgba blancos/negros que asumen fondo oscuro por vars (`--text`, `--surface`, `--text-muted`, `--border`). Es el trabajo más extenso; prioridad sobre componentes cliente (admin puede quedar con tema oscuro propio o claro según conveniencia).
- PWA: `theme_color` claro en `client/public/` (manifest/head).

### Fase 1 — Onboarding (`/`) + carrusel espectacular

- **Nueva ruta raíz `/`**: pantalla `OnboardingScreen.tsx` (nuevo `client/src/pages/OnboardingScreen.tsx`):
  - Carrusel a sangre full-viewport (reusa `Carousel` mejorado como fondo).
  - Gradiente oscuro en la base para legibilidad.
  - Título en 3 líneas, bold, alineado izquierda, abajo-izquierda, line-height compacto.
  - CTA pill full-width blanco, texto negro, "Let's Start", con sombra de gradiente, anclado abajo con margen claro.
  - Sin `AppHeader` ni FAB. `navigate("/colecciones")` al tocar.
- **`Carousel.tsx` reescrito** (moderno/espectacular):
  - Full-viewport (`100svh`), slides desde `carousel_slides`.
  - **Ken Burns**: zoom/pan lento en la slide activa (escala 1 → ~1.08 en 8-12s, posiciones alternadas).
  - **Auto-play** ~5s con pausa al touch/hover; reanuda al salir.
  - **Barra de progreso** animada por slide (dots tipo píldora que se llenan).
  - **Texto en stagger**: título/subtítulo con fade+slide escalonado al cambiar de slide.
  - **Parallax** sutil entre imagen y overlay.
  - Swipe táctil con `scroll-snap` + momentum (sin librerías).
  - `prefers-reduced-motion` desactiva Ken Burns/auto-play; imágenes `loading="lazy"`.
  - Compatible con el caso de uso actual (HomePage hero) y el nuevo (onboarding).

### Fase 2 — Colecciones (`/colecciones`)

- `HomePage.tsx` se sirve en la ruta `/colecciones` (el archivo conserva su nombre) y se restylea:
  - **Banner card** superior: ancho completo, bordes muy redondeados, fondo `#1E2230`; izquierda texto grande blanco (descripción de la prenda destacada) + botón cápsula blanco con el nombre; derecha mock de la prenda sobresaliendo arriba del borde. Prenda destacada = primera de la DB (orden por `id`).
  - **Category pills**: fila horizontal scrolleable de chips cápsula (Todos + prendas); seleccionado con fondo negro/texto blanco; filtran la grilla (state local `activeCategory`).
  - **Grilla de cards**: superficie blanca, `radius-lg`, sombra suave, mock SVG coloreado, nombre bold, precio en `--accent`, corazón de favorito coral (activo/inactivo).
  - `AppHeader` light con badge carrito/favoritos; el FAB navega a `/carrito`.
- `App.tsx`: rutas `/` → `OnboardingScreen`, `/colecciones` → `HomePage`, `/producto/:garmentId` igual, `/carrito` → nueva.

### Fase 3 — Detalle + personalización (`/producto/:garmentId`)

- **Header flotante** transparente sobre la imagen (variante de `AppHeader` o header propio): flecha atrás, título, ícono carrito.
- **Área de imagen ~50% top** full-bleed: `GarmentMock` coloreado centrado; dots de paginación frente/posterior; corazón coral flotante en la intersección con la hoja de detalles (favoritos).
- **Hoja de detalles** (blanca, esquinas superiores muy redondeadas, solapa la imagen):
  - Precio coral grande: "Desde $X" + incrementos de tamaño de diseño aplicados.
  - Nombre bold.
  - **Color option**: label + círculos; seleccionado con anillo externo.
  - **Size option**: label + cuadrados; seleccionado coral con contraste.
  - **Description** + link "Guía de talles" (mantiene `SizeGuideModal`).
- **CTA anclado "Elegí diseño"** (pill, arriba del botón "Agregar al carrito") → abre **bottom sheet** `DesignSheet` con 3 solapas:
  - **Diseño**: carousel horizontal de tarjetas (blanca, radius 20px, imagen, corazón coral, nombre bold) clase → tipo (reusa `EstampadoSelector` restyleado).
  - **Tamaño**: chips de escala `SizeSelector`.
  - **Ubicación**: activa el modo drag sobre el mock + toggle frente/posterior.
- **`DesignFlow.tsx` refactorizado**: de stepper de 4 pasos a contenido de 3 solapas del sheet. Se mantiene la lógica de estado en `ProductPage` (`customMode`, `customPos`, `customSide`, `previewStamp`, etc.). Props controladas se conservan.
- **Se elimina el botón de WhatsApp** de `ProductPage`.
- CTA "Agregar al carrito" full-width de color `--accent` (coral), coherente con el botón actual.
- Al agregar al carrito se conserva el comportamiento actual: permanecer en el producto con toast de confirmación (no redirige).
- Se mantienen los pasos de validación: talle requerido, dedupe por configuración, etc. (sin regresión).

### Fase 4 — Carrito página completa (`/carrito`)

- **Nueva página** `client/src/pages/CartPage.tsx`:
  - Header: flecha atrás (history back), título "Carrito" centrado, ícono carrito.
  - **Lista de ítems**: cada fila con checkbox redondo (coral seleccionado / gris vacío), thumbnail de prenda personalizada (reusa `CartItemThumb`/`GarmentMock`), nombre bold, precio coral, **desglose de personalización** (cantidad de diseños por tamaño, cada unidad con su valor), stepper de cantidad cápsula `[ − 1 + ]`.
  - Selección de ítems (checkbox) afecta "Selected Items" y el mensaje de WhatsApp.
  - **Resumen flotante** (blanco, esquinas superiores redondeadas, sombra suave): fila "Selected Items" (coral, monto de los seleccionados), fila "Envío" (chip "Retiro" `$0.0` / "Envío" "a convenir según distancia", solo `$`), divisor, "Subtotal" bold + total coral.
  - **Botones**: "Checkout" pill full-width azul noche → abre WhatsApp con detalle (ítems, personalización, subtotal, envío según selección). "Seguir comprando" → `/colecciones`. "Volver" → `navigate(-1)`. "Vaciar carrito" como link discreto.
  - "Pedidos recientes" se mantiene como sección colapsable al final.
- **`cart.tsx`**: se elimina `CartDrawer` (y su CSS); `openCart` pasa a navegar a `/carrito` (o se reemplaza el uso por `navigate`). Se mantienen provider, dedupe, `buildWhatsAppCartMessage` (se extiende con subtotal y envío), pedidos recientes.
- `AppHeader` y FAB: el clic en carrito navega a `/carrito`.
- Flujo "agregado al carrito": al agregar se muestra toast y opcionalmente redirige a `/carrito` (mantener comportamiento actual: permanecer en producto con toast, o definir en implementación).

### Fase 5 — Ajustes y limpieza

- `supabase-schema.sql`: defaults de `site_settings` claros.
- Limpieza: eliminar `OnboardingModal.tsx` (lo reemplaza la pantalla), `CartDrawer` (fase 4), `QuickViewModal.tsx` (dead), y CSS/imports muertos asociados.
- No hay cambios de tablas ni de admin funcional (el tab Colores ya edita la paleta).
- Sin cambios en el motor de drag, junctions, ni datos.

## Fuera de scope

- No se toca Capacitor (aunque ya está configurado, la entrega es web/PWA).
- No se agrega gateway de pago: "Checkout" = WhatsApp.
- No se agregan tablas en Supabase (el envío es lógica de UI en el carrito, no dato persistente).
- No se cambia la lógica de negocio del configurador (drag, dedupe, precios).
- El admin conserva su estética actual salvo lo que el barrido de tema claro afecte sin riesgo.

## Archivos afectados

- `client/src/index.css` — defaults y tokens de tema claro.
- `client/src/App.css` — barrido de colores, estilos de todas las fases (onboarding, pills, sheet, cart page, banner).
- `client/src/lib/settings.ts` — defaults de paleta clara + tokens aplicados.
- `client/src/lib/cart.tsx` — eliminar CartDrawer, `openCart` → navegación, mensaje WhatsApp con subtotal/envío.
- `client/src/components/Carousel.tsx` — reescritura (Ken Burns, auto-play, progreso, parallax, stagger).
- `client/src/pages/OnboardingScreen.tsx` — **nuevo**.
- `client/src/pages/CartPage.tsx` — **nuevo**.
- `client/src/pages/HomePage.tsx` — ruta `/colecciones`, banner card, pills, grilla clara.
- `client/src/pages/ProductPage.tsx` — hoja de detalles, CTA "Elegí diseño", sin WhatsApp.
- `client/src/components/DesignFlow.tsx` — refactor stepper → 3 solapas del sheet.
- `client/src/components/AppHeader.tsx` — variante transparente/flotante, navegación a `/carrito`.
- `client/src/components/EstampadoSelector.tsx` / `SizeSelector.tsx` — restyle a tarjetas/chips de referencia.
- `client/src/App.tsx` — rutas `/`, `/colecciones`, `/carrito`.
- `client/src/components/OnboardingModal.tsx`, `QuickViewModal.tsx` — eliminados.
- `supabase-schema.sql` — defaults claros de `site_settings`.
- `AI_CONTEXT.md` — actualizar al cierre.

## Verificación

- `npm run build` (tsc -b + vite) y `npm run lint` (oxlint) sin errores nuevos.
- Playwright en móvil (390px) por pantalla: onboarding (CTA → colecciones), colecciones (banner + pills filtran), producto (hoja + sheet 3 solapas + drag), carrito (checkout WhatsApp, envío retiro/envío).
- Sin regresión: drag frente/posterior, dedupe del carrito, pedidos recientes, admin.
