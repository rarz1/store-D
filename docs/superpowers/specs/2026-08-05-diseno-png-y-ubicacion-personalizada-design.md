# Diseño: Tipos de diseño con PNG + ubicación personalizada (drag)

## Goal

Que el cliente pueda elegir el diseño que irá estampado en la prenda viendo el PNG real, y que pueda posicionarlo en lugares predefinidos **o arrastrándolo libremente sobre el mock**. En admin, mejorar el tab Diseños (clases y tipos): subir PNG a Supabase, UI premium, tags por chips y fix del bug del "tercer tipo no se guarda".

## Context

- `estampados` = clases de diseño. `diseno_tipos` = sub-diseños con `svg_content` e `image_url`.
- El mock de la prenda es SVG y se colorea con `currentColor` (GarmentMock). El mock **se mantiene en SVG** (un PNG no se puede recolorear al vuelo).
- Los **tipos** pasan a ser PNG: el color no se recalcula, se estampa tal cual.
- Bug reportado: "al agregar el 3er tipo no se guarda". No hay límite de 2 en el código — es una falla silenciosa de guardado sin verificación de errores. Al reescribir el guardado con manejo de errores visible se resuelve.
- El bucket `store-images` y `uploadImage()` en `client/src/lib/settings.ts` ya existen.

## Scope

### 1. Admin — Tab Diseños (`AdminDesignsTab.tsx`, nuevo)

Se extrae el tab `disenos` de `AdminDashboard.tsx` (794 líneas) a un componente propio aislado. `AdminDashboard` renderiza `<AdminDesignsTab />`.

**Clases de diseño:**
- Tabla premium: checkbox, nombre, tags, activo, N° tipos, orden, acciones (Editar / Tipos / ✕).
- Form crear/editar: nombre, descripción, **tags por chips** (Enter agrega, ✕ quita, sin comas), activo, orden. Botones `Guardar`/`Cancelar` con separación.

**Tipos de diseño** (expandible por clase):
- Upload de **PNG a Supabase** (`store-images`): `accept="image/png"`, validación de MIME `image/png`, preview del PNG, botón "Quitar imagen".
- Se **eliminan** el textarea SVG y el campo de URL del form de tipos. `svg_content` se guarda vacío.
- Form con tags chips, activo, orden.
- Guardado con verificación de error real de Supabase mostrado en pantalla (reemplaza el fallo silencioso) + recarga de la lista.
- Lista de tipos con thumbnail (PNG), nombre, tags, activo, Editar/✕.

### 2. Cliente — PNG en preview y ubicación personalizada

**`GarmentMock.tsx`:**
- Soporta render de **imágenes** (`<img>`) además de SVG para diseños colocados: `PlacedDesign` gana `imageUrl?: string`.
- Soporta **posición personalizada** `{ x: number; y: number }` (% del mock) además de `positionStyles` predefinidos.
- En modo drag (`draggable` / callbacks), el cliente arrastra el diseño sobre el mock.

**`DesignFlow.tsx`:**
- Paso "Ubicación": además de las ubicaciones predefinidas (LocationSelector), botón **"Ubicación libre"** que activa modo arrastre sobre el mock (después de elegir el tamaño).
- `PreviewEstampado` gana `imageUrl?: string` y `customPosition?: { x, y } | null`.
- `PlacedEstampado` gana `customPosition`.
- La posición elegida se muestra en el preview en tiempo real.

**`ProductPage.tsx`:**
- Propaga `imageUrl` y `customPosition` a `GarmentMock` para diseños colocados y preview.
- `placedDesigns` incluye imágenes y posiciones custom.

**`cart.tsx`:**
- `CartItem.estampados[]` gana `customPosition` (para persistencia y dedupe).
- El mensaje de WhatsApp incluye la ubicación (predefinida o "posición libre").

### 3. Fuera de scope

- No hay cambios de tablas en Supabase: `image_url` ya existe; la posición custom vive en el carrito (no en DB).
- El mock de la prenda sigue en SVG (no se migra a PNG).
- No se tocan sizes/locations predefinidos existentes.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `client/src/pages/admin/AdminDesignsTab.tsx` | Nuevo — tab Diseños completo |
| `client/src/pages/admin/AdminDashboard.tsx` | Usar `AdminDesignsTab` en vez del tab inline |
| `client/src/lib/supabase.ts` | Tipos (nada obligatorio; se ajusta si hace falta) |
| `client/src/components/GarmentMock.tsx` | Imágenes + posición custom + drag |
| `client/src/components/DesignFlow.tsx` | Paso ubicación libre + drag + preview imagen |
| `client/src/components/LocationSelector.tsx` | Botón "Ubicación libre" (o se maneja en DesignFlow) |
| `client/src/pages/ProductPage.tsx` | Propagar imageUrl/customPosition |
| `client/src/lib/cart.tsx` | customPosition en item |
| `client/src/App.css` | Estilos premium admin + drag |

## Riesgos

- Drag con `currentColor`/SVG: el drag se aplica al contenedor, no al SVG interno — sin impacto.
- El PNG no hereda color de contraste: aceptado (estampado tal cual).
- Dedupe en carrito: debe incluir `customPosition` para no fusionar configs distintas.
