# Rediseño móvil STORE (tema claro) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la app web STORE en una experiencia mobile-first premium estilo las referencias de `DISEÑO MOVIL`: tema claro, onboarding full-screen con carrusel espectacular, colecciones con banner card + pills, detalle de prenda con hoja de detalles y selector de diseño en bottom sheet de 3 solapas, y carrito como página completa con resumen y checkout por WhatsApp.

**Architecture:** Se mantiene el stack actual (React 19 + Vite + Supabase). El cambio es de UI/UX sobre los componentes existentes: reescritura de `Carousel`, refactor de `DesignFlow` a bottom sheet con 3 solapas, nueva `OnboardingScreen`, `HomePage` movida a `/colecciones` con banner + pills, nueva `CartPage` que reemplaza al `CartDrawer`, y barrido de `App.css` a tema claro vía CSS vars.

**Tech Stack:** React 19, Vite 8, react-router-dom 7, Supabase, TanStack Query, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-08-18-mobile-redesign-light-theme-design.md`

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `client/src/index.css` | Tokens de tema claro (defaults) |
| `client/src/lib/settings.ts` | `applyColors` con `--text-secondary` |
| `client/src/App.css` | Barrido de colores a vars + estilos de todas las fases |
| `client/src/components/Carousel.tsx` | Reescritura: Ken Burns, auto-play, progreso, swipe |
| `client/src/pages/OnboardingScreen.tsx` | **Nuevo**: pantalla de inicio |
| `client/src/pages/HomePage.tsx` | Colecciones: banner card + pills + grilla |
| `client/src/components/AppHeader.tsx` | Variante `transparent`, carrito navega a `/carrito` |
| `client/src/components/DesignFlow.tsx` | Refactor a bottom sheet con 3 solapas |
| `client/src/pages/ProductPage.tsx` | Hoja de detalles, sin WhatsApp, CTA anclados |
| `client/src/pages/CartPage.tsx` | **Nuevo**: carrito página completa |
| `client/src/lib/cart.tsx` | Quitar CartDrawer y estado `isOpen` |
| `client/src/App.tsx` | Rutas `/`, `/colecciones`, `/carrito` |
| `client/src/components/OnboardingModal.tsx`, `QuickViewModal.tsx` | Eliminados |
| `client/index.html` | `theme-color` claro |
| `client/public/sw.js` | `CACHE_NAME` → `store-v3` |
| `supabase-schema.sql` | Seed `site_settings` claro |
| `AI_CONTEXT.md` | Actualizar al cierre |

---

## Task 1: Tokens de tema claro

**Files:**
- Modify: `client/src/index.css:1-31`
- Modify: `client/src/lib/settings.ts:78-88`
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Reemplazar el bloque `:root` de `index.css`**

```css
:root {
  --bg: #f8f9fa;
  --surface: #ffffff;
  --surface-hover: #f1f3f5;
  --text: #1e2230;
  --text-secondary: #4a5060;
  --text-muted: #6b7280;
  --border: #e0e0e0;
  --accent: #fa6e71;
  --accent-hover: #e85d5e;
  --accent-glow: rgba(250, 110, 113, 0.18);
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;
  --transition: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --font-display: 'Bebas Neue', 'Impact', sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --space-6: 3rem;
  --space-8: 4rem;
  --shadow-sm: 0 1px 2px rgba(30, 34, 48, 0.06);
  --shadow-md: 0 4px 12px rgba(30, 34, 48, 0.08);
  --shadow-lg: 0 8px 30px rgba(30, 34, 48, 0.1);
  --shadow-xl: 0 20px 60px rgba(30, 34, 48, 0.14);
}
```

- [ ] **Step 2: Extender `applyColors` en `settings.ts`**

Reemplazar el body de `applyColors` por:

```ts
export function applyColors(settings: SiteSettings) {
  const root = document.documentElement;
  root.style.setProperty("--bg", settings.color_bg);
  root.style.setProperty("--surface", settings.color_surface);
  root.style.setProperty("--text", settings.color_text);
  root.style.setProperty("--accent", settings.color_accent);
  root.style.setProperty("--accent-hover", lightenHex(settings.color_accent, 0.1));
  root.style.setProperty("--accent-glow", hexToRgba(settings.color_accent, 0.2));
  root.style.setProperty("--surface-hover", lightenHex(settings.color_surface, 0.02));
  root.style.setProperty("--text-secondary", lightenHex(settings.color_text, 0.05));
  root.style.setProperty("--border", lightenHex(settings.color_surface, 0.06));
}
```

- [ ] **Step 3: Actualizar seed de `site_settings` en `supabase-schema.sql`**

Buscar el `insert into site_settings` y cambiar los colores a: `color_bg='#f8f9fa'`, `color_surface='#ffffff'`, `color_text='#1e2230'`, `color_accent='#fa6e71'`. Si el insert ya está comentado/ejecutado, igual actualizarlo para futuros deploys.

- [ ] **Step 4: Verificar**

Run: `npm run build` (en `client/`)
Expected: build OK (todavía con tema oscuro en pantalla porque falta el barrido de CSS, pero compila).

- [ ] **Step 5: Commit**

```bash
git add client/src/index.css client/src/lib/settings.ts supabase-schema.sql
git commit -m "feat(client): light theme design tokens"
```

---

## Task 2: Barrido de App.css a tema claro

**Files:**
- Modify: `client/src/App.css`

Regla general: **todo color hardcodeado que asumía fondo oscuro pasa a vars**. La app ya usa vars en la mayoría de los casos; el trabajo es reemplazar los valores literales que rompen en claro.

- [ ] **Step 1: Buscar colores hardcodeados**

```bash
rg -n "rgba\(255, 255, 255|#fff|#ffffff|#000|#000000|rgba\(19, 21, 24|rgba\(0, 0, 0, 0\.[4-9]" client/src/App.css
```

- [ ] **Step 2: Reemplazar por vars según el mapa**

| Patrón actual | Reemplazo |
|---|---|
| `color: rgba(255,255,255,...)` / `#fff` en texto sobre superficie | `var(--text)` (o `var(--text-secondary)`) |
| `background: #fff` en botones primarios con texto blanco | invertir: `background: var(--text)` + `color: var(--surface)` |
| `rgba(0,0,0,0.4-0.6)` en overlays | mantener (sirve en claro para modales) |
| `--accent` con `#f97316` derivados | ya son vars, no tocar |
| `rgba(255,255,255,0.06)` (bordes de glass) | `rgba(30,34,48,0.08)` |
| texto `var(--text-muted)` sobre fondo claro | queda bien, no tocar |

Casos típicos a revisar: `.glass`, `.app-header`, `.btn-primary`, `.btn-whatsapp`, `.btn-danger`, `.choice-btn--salmon`, `.fab-cart`, `.cart-drawer`, `.modal-content`, `.onboarding*`, `.carousel__content`, skeletons, `.product-info-bar`, `.size-chip--active`, `.color-swatch--active`.

- [ ] **Step 3: Verificar visualmente cada pantalla en claro**

Run: `npm run dev` (en `client/`), abrir en móvil 390px.
Expected: fondo `#f8f9fa`, superficie blanca, texto `#1e2230`, acento coral. Nada ilegible (texto blanco sobre blanco, texto oscuro sobre oscuro).

- [ ] **Step 4: Commit**

```bash
git add client/src/App.css
git commit -m "style(client): sweep App.css to light theme"
```

---

## Task 3: Carousel reescrito (Ken Burns, auto-play, progreso, swipe)

**Files:**
- Modify: `client/src/components/Carousel.tsx`

- [ ] **Step 1: Reemplazar todo el contenido de `Carousel.tsx`**

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { getSlides, type CarouselSlide } from "../lib/settings";

const AUTOPLAY_MS = 5200;

interface Props {
  variant?: "hero" | "onboarding";
}

export default function Carousel({ variant = "hero" }: Props) {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const reduceMotion = useRef(false);
  const dragX = useRef<number | null>(null);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    getSlides().then((s) => setSlides(s));
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev + 1) % slides.length;
      setProgressKey((k) => k + 1);
      return n;
    });
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev - 1 + slides.length) % slides.length;
      setProgressKey((k) => k + 1);
      return n;
    });
  }, [slides.length]);

  const goTo = (index: number) => {
    setCurrent(index);
    setProgressKey((k) => k + 1);
  };

  useEffect(() => {
    if (isPaused || reduceMotion.current || slides.length === 0) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, next, slides.length]);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    dragX.current = e.clientX;
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (dragX.current === null) return;
    const delta = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) next();
    else prev();
  };

  if (slides.length === 0) return null;

  return (
    <section
      className={`carousel carousel--${variant}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="carousel__track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`carousel__slide carousel__slide--${slide.layout}${i === current ? " carousel__slide--active" : ""}`}
            style={slide.image_1_url ? {
              backgroundImage: slide.layout === "double"
                ? `url(${slide.image_1_url}), url(${slide.image_2_url})`
                : `url(${slide.image_1_url})`,
              backgroundSize: slide.layout === "double" ? "50% 100%, 50% 100%" : "cover",
              backgroundPosition: slide.layout === "double" ? "left center, right center" : "center",
              backgroundRepeat: "no-repeat",
            } : {
              background: "linear-gradient(135deg, #f8f9fa 0%, #1e2230 60%, #fa6e71 100%)",
            }}
          >
            <div className="carousel__shade" />
            <div className="carousel__content" key={i === current ? `active-${current}` : `inactive-${i}`}>
              <h2 className="carousel__title">
                {slide.text_overlay.split("\\n").map((line, j) => (
                  <span key={j} className="carousel__title-line">
                    {line}
                    {j === 0 && <br />}
                  </span>
                ))}
              </h2>
              {slide.subtitle && <p className="carousel__subtitle">{slide.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="carousel__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel__dot${i === current ? " carousel__dot--active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          >
            {i === current && (
              <span className="carousel__dot-progress" key={`p${progressKey}`} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Agregar estilos del carousel en `App.css`**

Agregar al final de `App.css`:

```css
.carousel__slide { overflow: hidden; }
.carousel__shade {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(30, 34, 48, 0.72) 0%, rgba(30, 34, 48, 0) 55%);
  pointer-events: none;
}
.carousel__slide--active { animation: kenburns 12s ease-in-out forwards; }
@keyframes kenburns {
  from { background-size: 100% auto; }
  to { background-size: 110% auto; }
}
.carousel__title-line { display: inline; }
.carousel__content > * { opacity: 0; animation: carousel-fade 500ms ease forwards; }
.carousel__content > *:nth-child(1) { animation-delay: 120ms; }
.carousel__content > *:nth-child(2) { animation-delay: 300ms; }
@keyframes carousel-fade {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.carousel__dot { position: relative; width: 28px; height: 6px; border-radius: var(--radius-pill); }
.carousel__dot-progress {
  position: absolute; inset: 0; border-radius: inherit;
  background: var(--surface);
  animation: dot-progress 5.2s linear forwards;
}
@keyframes dot-progress { from { width: 0%; } to { width: 100%; } }
@media (prefers-reduced-motion: reduce) {
  .carousel__slide--active { animation: none; }
  .carousel__content > * { animation: none; opacity: 1; }
  .carousel__dot-progress { animation: none; width: 100%; }
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build` (en `client/`)
Expected: OK. Visual en dev: zoom lento en slide activa, barra de progreso por slide, stagger del texto, swipe táctil.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Carousel.tsx client/src/App.css
git commit -m "feat(client): spectacular carousel with kenburns, autoplay progress, swipe"
```

---

## Task 4: OnboardingScreen + rutas `/` y `/colecciones`

**Files:**
- Create: `client/src/pages/OnboardingScreen.tsx`
- Modify: `client/src/App.tsx:48-51`

- [ ] **Step 1: Crear `OnboardingScreen.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import { getSettings, type SiteSettings } from "../lib/settings";
import { setMeta } from "../lib/seo";

const FALLBACK_TITLE = "STORE";
const FALLBACK_SUBTITLE = "Personalizá tu estilo. Prendas oversize con diseño propio.";

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const title = settings?.store_title ?? FALLBACK_TITLE;
    setMeta({ title: `${title} · Bienvenido`, description: settings?.store_subtitle ?? FALLBACK_SUBTITLE });
  }, [settings]);

  const titleLines = (settings?.store_title ?? FALLBACK_TITLE).split("\n").filter(Boolean);

  return (
    <div className="onboarding page-enter">
      <Carousel variant="onboarding" />
      <div className="onboarding__content">
        <h1 className="onboarding__title">
          {titleLines.map((line, i) => (
            <span key={i} className="onboarding__title-line">{line}</span>
          ))}
        </h1>
        <p className="onboarding__subtitle">{settings?.store_subtitle ?? FALLBACK_SUBTITLE}</p>
      </div>
      <div className="onboarding__footer">
        <button className="onboarding__cta" onClick={() => navigate("/colecciones")} type="button">
          Let's Start
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Cambiar rutas en `App.tsx`**

Reemplazar:

```tsx
                <Route path="/" element={<HomePage />} />
                <Route path="/producto/:garmentId" element={<ProductPage />} />
```

por:

```tsx
                <Route path="/" element={<OnboardingScreen />} />
                <Route path="/colecciones" element={<HomePage />} />
                <Route path="/producto/:garmentId" element={<ProductPage />} />
```

Y agregar `import OnboardingScreen from "./pages/OnboardingScreen";` junto a los otros imports de páginas.

- [ ] **Step 3: Estilos de onboarding en `App.css`**

```css
.onboarding {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  background: var(--bg);
}
.onboarding .carousel { position: absolute; inset: 0; }
.onboarding__content {
  position: relative; z-index: 2;
  padding: 0 var(--space-4) var(--space-6);
  color: var(--surface);
}
.onboarding__title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 12vw, 4.5rem);
  line-height: 0.95;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-shadow: 0 2px 24px rgba(30, 34, 48, 0.5);
}
.onboarding__title-line { display: block; }
.onboarding__subtitle {
  margin-top: var(--space-3);
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.92);
  max-width: 30ch;
}
.onboarding__footer {
  position: relative; z-index: 2;
  padding: 0 var(--space-4) calc(var(--space-5) + env(safe-area-inset-bottom));
}
.onboarding__cta {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text);
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 0 24px rgba(255, 255, 255, 0.35), var(--shadow-lg);
  cursor: pointer;
  transition: transform var(--transition);
}
.onboarding__cta:active { transform: scale(0.98); }
.carousel--onboarding .carousel__content {
  position: absolute; inset: auto auto 0 0;
  padding: 0 0 var(--space-8) var(--space-4);
  text-align: left;
}
.carousel--onboarding .carousel__title { font-size: clamp(2.4rem, 11vw, 4rem); }
```

- [ ] **Step 4: Verificar**

Run: `npm run build` (en `client/`)
Expected: OK. En dev: `/` = onboarding, `/colecciones` = home anterior.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/OnboardingScreen.tsx client/src/App.tsx client/src/App.css
git commit -m "feat(client): onboarding screen with spectacular hero, move home to /colecciones"
```

---

## Task 5: HomePage → Colecciones con banner card + pills + grilla

**Files:**
- Modify: `client/src/pages/HomePage.tsx`

- [ ] **Step 1: Reemplazar el JSX de la sección de colecciones**

Dentro de `HomePage` agregar estado de filtro y el banner. Reemplazar el return de la sección `.categories` por:

```tsx
      <section className="categories">
        <div className="categories__header">
          <h2 className="categories__title">{settings?.collections_title || "COLECCIONES"}</h2>
          <p className="categories__subtitle">{settings?.collections_subtitle || "Elegí tu prenda y personalizala a tu gusto"}</p>
        </div>

        {!loading && garments.length > 0 && (
          <div className="collections-banner">
            <div className="collections-banner__info">
              <h3 className="collections-banner__title">{garments[0].name}</h3>
              <p className="collections-banner__desc">{garments[0].description}</p>
              <button className="collections-banner__cta" onClick={() => handleConfigure(garments[0].slug)}>
                {garments[0].name}
              </button>
            </div>
            <div className="collections-banner__mock">
              {bannerMock && <div dangerouslySetInnerHTML={{ __html: bannerMock }} />}
            </div>
          </div>
        )}

        {!loading && garments.length > 0 && (
          <div className="category-pills" role="tablist" aria-label="Filtrar prendas">
            <button
              className={`category-pill${activeCategory === null ? " category-pill--active" : ""}`}
              onClick={() => setActiveCategory(null)}
            >
              Todos
            </button>
            {garments.map((g) => (
              <button
                key={g.id}
                className={`category-pill${activeCategory === g.name ? " category-pill--active" : ""}`}
                onClick={() => setActiveCategory(g.name)}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
        ... (resto: grilla con `filteredGarments` en lugar de `garments`)
```

- [ ] **Step 2: Estado y variables en el componente**

Agregar en el cuerpo de `HomePage`:

```tsx
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filteredGarments = activeCategory ? garments.filter((g) => g.name === activeCategory) : garments;
  const bannerMock = garments[0]?.svg_mock
    ? garments[0].svg_mock
        .replace(/\s(width|height)="[^"]*"/g, "")
        .replace(/currentColor/gi, "var(--accent)")
    : null;
```

Reemplazar la grilla `garments.map((g, i) =>` por `filteredGarments.map((g, i) =>`.

- [ ] **Step 3: Quitar el `OnboardingModal` de HomePage**

Eliminar el import de `OnboardingModal`, el estado `onboardingOpen`, el `useEffect` que lo abre, y el render `<OnboardingModal .../>` (la pantalla de onboarding es ahora `/`).

- [ ] **Step 4: Estilos de banner y pills en `App.css`**

```css
.collections-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  background: #1e2230;
  color: var(--surface);
  overflow: hidden;
}
.collections-banner__info { flex: 1; min-width: 0; }
.collections-banner__title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 0.35rem;
}
.collections-banner__desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: var(--space-3);
}
.collections-banner__cta {
  padding: 0.5rem 1.1rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.collections-banner__mock { width: 40%; max-width: 180px; margin-bottom: -var(--space-6); transform: translateY(8%); }
.collections-banner__mock svg { width: 100%; height: auto; }
.category-pills {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0 var(--space-3);
  scrollbar-width: none;
}
.category-pills::-webkit-scrollbar { display: none; }
.category-pill {
  flex: 0 0 auto;
  padding: 0.5rem 1.1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}
.category-pill--active {
  background: var(--text);
  color: var(--surface);
  border-color: var(--text);
}
```

- [ ] **Step 5: Verificar**

Run: `npm run build` (en `client/`)
Expected: OK. `/colecciones` muestra banner (primera prenda), pills que filtran, grilla clara.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/HomePage.tsx client/src/App.css
git commit -m "feat(client): collections banner card, category pills, remove onboarding modal"
```

---

## Task 6: AppHeader — variante transparente + carrito a `/carrito`

**Files:**
- Modify: `client/src/components/AppHeader.tsx`

- [ ] **Step 1: Agregar prop `variant` y navegación de carrito**

Cambiar la firma y el uso de `openCart`:

```tsx
interface Props {
  settings: SiteSettings | null;
  showBack?: boolean;
  title?: string;
  showFavorites?: boolean;
  variant?: "default" | "transparent";
}
```

Dentro del componente: `const { totalItems } = useCart();` (quitar `openCart`). El click del carrito pasa a:

```tsx
              onClick={() => navigate("/carrito")}
```

El FAB pasa a:

```tsx
        <button className="fab-cart" onClick={() => navigate("/carrito")} aria-label="Abrir carrito" type="button">
```

- [ ] **Step 2: Aplicar clase de variante**

En el `<header>`:

```tsx
      <header className={`app-header glass${isHome ? " app-header--floating" : ""}${variant === "transparent" ? " app-header--transparent" : ""}`}>
```

- [ ] **Step 3: Estilos de la variante transparente en `App.css`**

```css
.app-header--transparent {
  background: linear-gradient(to bottom, rgba(30, 34, 48, 0.35), rgba(30, 34, 48, 0));
  backdrop-filter: none;
  border: none;
  color: #fff;
}
.app-header--transparent .btn-icon,
.app-header--transparent .app-header__cart { color: #fff; }
.app-header--transparent .app-header__store-name { color: #fff; }
```

- [ ] **Step 4: Verificar**

Run: `npm run build` (en `client/`)
Expected: OK. Los clics de carrito navegan a `/carrito` (aún no existe la página → 404 momentáneo, se resuelve en Task 9).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AppHeader.tsx client/src/App.css
git commit -m "feat(client): transparent header variant, cart navigates to /carrito"
```

---

## Task 7: ProductPage — hoja de detalles, sin WhatsApp

**Files:**
- Modify: `client/src/pages/ProductPage.tsx`

- [ ] **Step 1: Eliminar WhatsApp y su estado**

- Borrar `const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";` (línea 15).
- Borrar `buildWhatsAppMessage` y la variable `whatsappMessage` (líneas 192-207, 284).
- Borrar el bloque `<a ... className="btn-whatsapp">Consultar por WhatsApp</a>` y su `else` con el texto de configuración del footer (líneas 612-623).

- [ ] **Step 2: Cambiar `handleAddToCart` para no abrir drawer**

Reemplazar `openCart();` por `toast.success("Agregado al carrito");` y quitar `openCart` del destructure de `useCart()` (línea 29).

- [ ] **Step 3: Nueva estructura visual**

- Quitar el `<div className="breadcrumb">` y el bloque `product-info-bar` (líneas 323-363). El `AppHeader` pasa a `variant="transparent"`:

```tsx
      <AppHeader settings={null} showBack title={garment.name} variant="transparent" />
```

- Envolver la sección de mock para que quede full-bleed arriba: el `.mock-section` pasa a ocupar el tope de la página (CSS: `.product-page .mock-section` sin padding lateral, imagen centrada, ~50vh).
- El `.controls-section` se convierte en la hoja de detalles: agregar precio coral grande + nombre arriba:

```tsx
        <div className="controls-section product-sheet">
          <div className="product-sheet__price-row">
            <span className="product-sheet__price">Desde ${Number(garment.base_price).toLocaleString("es-AR")}</span>
            {placedEstampados.length > 0 && (
              <span className="product-sheet__addons">
                {placedEstampados.map((p, i) => {
                  const inc = p.size.price_increment + p.locations.reduce((s, l) => s + l.price_increment, 0);
                  return <span key={i}>+${inc.toLocaleString("es-AR")}</span>;
                })}
                = <strong>${totalPrice.toLocaleString("es-AR")}</strong>
              </span>
            )}
          </div>
          <h1 className="product-sheet__title">{garment.name}</h1>
          <p className="product-sheet__desc">{garment.description}</p>
          <div className="product-sheet__favorite">
            <button
              className="btn-icon btn-icon--coral"
              onClick={handleToggleFavorite}
              aria-label={isFavorite(garment.id, selectedColor, selectedSize) ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <svg viewBox="0 0 24 24" fill={isFavorite(garment.id, selectedColor, selectedSize) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
```

- El footer pasa a dos CTAs (Elegí diseño / Agregar al carrito):

```tsx
      <div className="product-footer">
        <DesignFlowTrigger
          onClick={() => setDesignSheetOpen(true)}
          selectedLabel={designLabel}
        />
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleAddToCart}>
          Agregar al carrito
        </button>
      </div>
```

> Nota: `DesignFlowTrigger` y `designLabel` se definen en Task 8 (refactor del DesignFlow). Para que este task compile solo, usar un botón placeholder y ajustarlo en Task 8.

- [ ] **Step 4: Estilos de la hoja de detalles en `App.css`**

```css
.product-page { background: var(--bg); }
.product-page .mock-section {
  padding: 0;
  min-height: 42vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f0f2f5 0%, var(--bg) 100%);
}
.product-sheet {
  margin: calc(-1 * var(--radius-xl)) 0 0;
  padding: var(--space-4);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: var(--surface);
  box-shadow: 0 -8px 30px rgba(30, 34, 48, 0.08);
  position: relative;
  z-index: 2;
}
.product-sheet__price { color: var(--accent); font-size: 1.4rem; font-weight: 800; }
.product-sheet__addons { font-size: 0.8rem; color: var(--text-muted); }
.product-sheet__title { font-size: 1.3rem; font-weight: 800; color: var(--text); margin: 0.25rem 0; }
.product-sheet__desc { font-size: 0.85rem; color: var(--text-muted); }
.product-sheet__favorite { position: absolute; top: -24px; right: var(--space-4); }
.btn-icon--coral {
  background: var(--accent);
  color: var(--surface);
  border-radius: 50%;
  width: 48px; height: 48px;
  display: grid; place-items: center;
  box-shadow: var(--shadow-md);
}
```

- [ ] **Step 5: Verificar**

Run: `npm run build` (en `client/`)
Expected: OK (con el placeholder del trigger). Sin botón de WhatsApp en producto.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/ProductPage.tsx client/src/App.css
git commit -m "feat(client): product detail sheet, remove WhatsApp from configurator"
```

---

## Task 8: DesignFlow → bottom sheet de 3 solapas

**Files:**
- Modify: `client/src/components/DesignFlow.tsx`

- [ ] **Step 1: Reemplazar el contenido de `DesignFlow.tsx`**

Mantener la interface `Props` exportada (con `customMode`, `customPos`, `customSide`, callbacks) y la interface `CustomPosition`. Reemplazar el body del componente para que sea un bottom sheet modal con 3 solapas. Se mantiene el CTA "Elegí diseño" visible en el flujo de página que abre el sheet:

```tsx
export default function DesignFlow({
  estampados,
  tiposByClase,
  stampSizes,
  onAdd,
  onSelectClase,
  onPreviewChange,
  customPos,
  customSide,
  onCustomModeChange,
  onCustomPosChange,
  onCustomSideChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"diseno" | "tamano" | "ubicacion">("diseno");
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  const selectedClase = estampados.find((e) => e.id === selectedClaseId) ?? null;
  const tipos = selectedClaseId ? (tiposByClase[selectedClaseId] ?? []) : [];
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId) ?? null;
  const selectedSizeObj = stampSizes.find((s) => s.id === selectedSizeId) ?? null;

  useEffect(() => {
    if (open && tab === "ubicacion") {
      onCustomModeChange(true);
      onCustomPosChange({ x: 50, y: 50 });
      onCustomSideChange("front");
    } else if (!open) {
      onCustomModeChange(false);
      onCustomPosChange(null);
      onCustomSideChange("front");
    }
  }, [open, tab, onCustomModeChange, onCustomPosChange, onCustomSideChange]);

  useEffect(() => {
    if (open && tab === "ubicacion" && selectedTipo && customPos) {
      onPreviewChange?.({
        svgContent: selectedTipo.svg_content || selectedClase?.svg_content || "",
        imageUrl: selectedTipo.image_url || undefined,
        locations: [],
        customPosition: customPos,
        widthPercent: selectedSizeObj?.width_percent ?? 40,
        name: `${selectedClase?.name ?? ""} · ${selectedTipo.name}`,
        side: customSide,
      });
    } else {
      onPreviewChange?.(null);
    }
  }, [open, tab, selectedTipo, selectedClase, selectedSizeObj, customPos, customSide, onPreviewChange]);

  const label = selectedClase
    ? `${selectedClase.name}${selectedTipo ? ` · ${selectedTipo.name}` : ""}${selectedSizeObj ? ` (${selectedSizeObj.name})` : ""}`
    : "Elegir diseño";

  const handleConfirm = () => {
    if (!selectedClase || !selectedTipo || !selectedSizeObj || !customPos) return;
    onAdd({
      estampado: selectedClase,
      tipo: selectedTipo,
      size: selectedSizeObj,
      locations: [],
      customPosition: customPos,
      side: customSide,
    });
    setSelectedClaseId(null);
    setSelectedTipoId(null);
    setSelectedSizeId(null);
    setOpen(false);
    onPreviewChange?.(null);
  };

  return (
    <>
      <button className="choice-btn choice-btn--salmon design-flow__trigger" onClick={() => setOpen(true)} type="button">
        <span className="choice-btn__value">{label}</span>
        <svg className="choice-btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="design-sheet-overlay" onClick={() => setOpen(false)}>
          <div className="design-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Personalizar diseño">
            <div className="design-sheet__grabber" />
            <div className="design-sheet__header">
              <h3>Personalizá tu diseño</h3>
              <button className="btn-icon" onClick={() => setOpen(false)} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="design-sheet__tabs">
              {(["diseno", "tamano", "ubicacion"] as const).map((t) => (
                <button
                  key={t}
                  className={`design-sheet__tab${tab === t ? " design-sheet__tab--active" : ""}`}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {t === "diseno" ? "Diseño" : t === "tamano" ? "Tamaño" : "Ubicación"}
                </button>
              ))}
            </div>

            <div className="design-sheet__body">
              {tab === "diseno" && !selectedClaseId && (
                <EstampadoSelector
                  estampados={estampados}
                  selectedId={selectedClaseId}
                  onSelect={(id) => {
                    setSelectedClaseId(id);
                    setSelectedTipoId(null);
                    setSelectedSizeId(stampSizes[0]?.id ?? null);
                    onSelectClase(id);
                  }}
                />
              )}

              {tab === "diseno" && selectedClaseId && (
                <div className="control-group">
                  <button className="btn-small" onClick={() => setSelectedClaseId(null)} type="button">
                    ← {selectedClase?.name}
                  </button>
                  <div className="estampado-grid">
                    {tipos.map((t) => (
                      <button
                        key={t.id}
                        className={`estampado-card${selectedTipoId === t.id ? " estampado-card--active" : ""}`}
                        onClick={() => {
                          setSelectedTipoId(t.id);
                          setSelectedSizeId(stampSizes[0]?.id ?? null);
                          setTab("tamano");
                        }}
                        type="button"
                      >
                        <div className="estampado-card__preview">
                          {t.image_url ? (
                            <img src={t.image_url} alt={t.name} loading="lazy" decoding="async" />
                          ) : t.svg_content ? (
                            <div className="estampado-card__svg" dangerouslySetInnerHTML={{ __html: t.svg_content.replace(/currentColor/gi, "var(--accent)") }} />
                          ) : (
                            <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>?</span>
                          )}
                        </div>
                        <div className="estampado-card__info">
                          <span className="estampado-card__name">{t.name}</span>
                          {t.description && <span className="estampado-card__desc">{t.description}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "tamano" && (
                <>
                  <SizeSelector
                    sizes={stampSizes}
                    selectedId={selectedSizeId}
                    onSelect={(id) => {
                      setSelectedSizeId(id);
                      setTab("ubicacion");
                    }}
                  />
                  {selectedTipo && (
                    <button className="btn-small" style={{ marginTop: "0.5rem" }} onClick={() => setTab("diseno")} type="button">
                      ← Elegir otro diseño
                    </button>
                  )}
                </>
              )}

              {tab === "ubicacion" && (
                <div className="design-flow__confirm">
                  <p className="text-muted" style={{ fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                    Arrastrá el diseño directamente sobre la prenda para ubicarlo donde quieras.
                    Usá la vista frontal o posterior para elegir la cara.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ width: "100%", marginTop: "0.75rem" }}
                    onClick={handleConfirm}
                    disabled={!customPos || !selectedTipo}
                    type="button"
                  >
                    Confirmar estampado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Reemplazar el placeholder del trigger en `ProductPage`**

El placeholder de Task 7 se reemplaza por el `DesignFlow` real:

```tsx
      <div className="product-footer">
        <DesignFlow
          estampados={estampados}
          tiposByClase={tiposByClase}
          stampSizes={stampSizes}
          onSelectClase={handleSelectClase}
          onPreviewChange={setPreviewStamp}
          customMode={customMode}
          customPos={customPos}
          customSide={customSide}
          onCustomModeChange={setCustomMode}
          onCustomPosChange={setCustomPos}
          onCustomSideChange={setCustomSide}
          onAdd={(item) => {
            const isDuplicate = placedEstampados.some((p) =>
              p.estampado.id === item.estampado.id &&
              p.tipo.id === item.tipo.id &&
              JSON.stringify(p.locations.map(l => l.id).sort()) === JSON.stringify(item.locations.map(l => l.id).sort()) &&
              JSON.stringify(p.customPosition ?? null) === JSON.stringify(item.customPosition ?? null) &&
              (p.side ?? "front") === (item.side ?? "front")
            );
            if (isDuplicate) {
              toast.warning("Este diseño ya está agregado en esa ubicación");
              return;
            }
            setPlacedEstampados([...placedEstampados, item]);
          }}
        />
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleAddToCart}>
          Agregar al carrito
        </button>
      </div>
```

Eliminar el `DesignFlow` viejo de `.controls-section` (el que estaba dentro del `control-group` con los `placed-estampados`).

- [ ] **Step 3: Estilos del sheet en `App.css`**

```css
.design-sheet-overlay {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(30, 34, 48, 0.4);
  display: flex; align-items: flex-end;
}
.design-sheet {
  width: 100%;
  max-height: 78svh;
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
  overflow-y: auto;
  animation: sheet-up 280ms cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.design-sheet__grabber {
  width: 40px; height: 4px; margin: 0 auto var(--space-3);
  border-radius: var(--radius-pill); background: var(--border);
}
.design-sheet__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
.design-sheet__header h3 { color: var(--text); font-size: 1.05rem; }
.design-sheet__tabs {
  display: flex; gap: 0.5rem; margin-bottom: var(--space-3);
  background: var(--surface-hover); padding: 0.25rem; border-radius: var(--radius-pill);
}
.design-sheet__tab {
  flex: 1; padding: 0.5rem; border: none; border-radius: var(--radius-pill);
  background: transparent; color: var(--text-muted); font-weight: 600; font-size: 0.85rem;
  cursor: pointer; transition: background var(--transition), color var(--transition);
}
.design-sheet__tab--active { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
```

- [ ] **Step 4: Verificar**

Run: `npm run build` (en `client/`)
Expected: OK. El CTA "Elegí diseño" abre el sheet con 3 solapas; el drag en "Ubicación" sigue funcionando en el mock de la página.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/DesignFlow.tsx client/src/pages/ProductPage.tsx client/src/App.css
git commit -m "feat(client): design selector as bottom sheet with 3 tabs"
```

---

## Task 9: CartPage + cart.tsx (eliminar CartDrawer)

**Files:**
- Create: `client/src/pages/CartPage.tsx`
- Modify: `client/src/lib/cart.tsx`
- Modify: `client/src/App.tsx` (ruta `/carrito`)

- [ ] **Step 1: Limpiar `cart.tsx`**

- En `CartContextType`: eliminar `isOpen`, `openCart`, `closeCart`.
- En el provider: eliminar el estado `isOpen`, eliminar `openCart`/`closeCart`, y el render `<CartDrawer />`. Eliminar `<CartDrawer />` del JSX del provider (el drawer pasa a ser página).
- Eliminar los imports de `GarmentMock` y `useNavigate` (ya no se usan en `cart.tsx`).
- Eliminar `CartItemThumb`, `buildCartMockDesigns` y `CartDrawer` completos (se mueven a `CartPage.tsx`).

- [ ] **Step 2: Crear `CartPage.tsx`**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GarmentMock from "../components/GarmentMock";
import AppHeader from "../components/AppHeader";
import { useCart, type CartItem } from "../lib/cart";
import { setMeta } from "../lib/seo";

const ADMIN_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";

function buildCartMockDesigns(estampados: CartItem["estampados"]) {
  return estampados.flatMap((p) => {
    const base = {
      variantId: p.tipo.id,
      svgContent: p.tipo.svg_content || p.estampado.svg_content,
      imageUrl: p.tipo.image_url || undefined,
      name: `${p.estampado.name} · ${p.tipo.name}`,
    };
    if (p.customPosition) {
      return [{
        ...base,
        position: "large_front" as const,
        customPosition: p.customPosition,
        widthPercent: p.size.width_percent,
        side: p.side ?? "front",
      }];
    }
    return p.locations.map((loc) => ({
      ...base,
      position: loc.position_key as "small_front" | "small_front_right" | "large_front" | "small_back" | "large_back" | "sleeve",
    }));
  });
}

function CartItemThumb({ item }: { item: CartItem }) {
  const designs = buildCartMockDesigns(item.estampados);
  const hasBack = designs.some((d) => (d as { side?: string }).side === "back" || d.position.includes("back"));
  return (
    <div className="cart-page__item-thumb">
      <GarmentMock
        garmentId={item.garmentSlug}
        color={item.colorHex}
        svgMock={item.garmentSvgMock}
        svgMockBack={item.garmentSvgMockBack}
        placedDesigns={designs}
        side="front"
        hideFlip
      />
      {hasBack && (
        <GarmentMock
          garmentId={item.garmentSlug}
          color={item.colorHex}
          svgMock={item.garmentSvgMock}
          svgMockBack={item.garmentSvgMockBack}
          placedDesigns={designs}
          side="back"
          hideFlip
        />
      )}
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalItems, orders, reorder, placeOrder } = useCart();
  const [selected, setSelected] = useState<Set<number>>(new Set(items.map((_, i) => i)));
  const [showOrders, setShowOrders] = useState(false);
  const [shipMode, setShipMode] = useState<"retiro" | "envio">("retiro");

  setMeta({ title: "Carrito · STORE" });

  const toggleSelected = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const unitTotal = (item: CartItem) => {
    const addons = item.estampados.reduce((s, p) => s + p.size.price_increment + p.locations.reduce((a, l) => a + l.price_increment, 0), 0);
    return item.garmentBasePrice + addons;
  };

  const selectedItems = items.filter((_, i) => selected.has(i));
  const selectedPrice = selectedItems.reduce((sum, item) => sum + unitTotal(item) * (item.quantity ?? 1), 0);
  const allSelected = selected.size === items.length;

  const buildWhatsAppMessage = () => {
    const lines = ["Hola! Quiero realizar la compra/consulta del siguiente carrito:"];
    selectedItems.forEach((item, idx) => {
      const qty = item.quantity ?? 1;
      lines.push(`\n${idx + 1}. x${qty} ${item.garmentName} (${item.colorName}, Talla ${item.size}) - $${(unitTotal(item) * qty).toLocaleString("es-AR")}`);
      item.estampados.forEach((p) => {
        const locText = p.customPosition
          ? (p.side === "back" ? "Ubicación libre (posterior)" : "Ubicación libre (frente)")
          : p.locations.map((l) => l.name).join(", ");
        lines.push(`   • Estampado: ${p.estampado.name} · ${p.tipo.name} (${p.size.name}) [${locText}]`);
      });
    });
    lines.push(`\nSubtotal: $${selectedPrice.toLocaleString("es-AR")}`);
    lines.push(`Envío: ${shipMode === "retiro" ? "Retiro en local ($0.0)" : "A convenir según distancia"}`);
    lines.push(`Total: $${selectedPrice.toLocaleString("es-AR")}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const handleWhatsApp = () => {
    if (!ADMIN_PHONE || selectedItems.length === 0) return;
    placeOrder({ items: selectedItems.map((item) => ({ ...item })), total: selectedPrice, date: new Date().toISOString() });
  };

  return (
    <div className="cart-page page-enter">
      <AppHeader settings={null} showBack title="Carrito" />
      <div className="cart-page__body">
        {items.length === 0 ? (
          <div className="cart-page__empty">
            <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>🛒</span>
            <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "var(--text)" }}>Tu carrito está vacío</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>Explorá la colección y agregá tu primera prenda</p>
            <button className="btn-primary" onClick={() => navigate("/colecciones")}>Ir a la tienda</button>
          </div>
        ) : (
          <>
            <div className="cart-page__select-all">
              <button className="cart-check" onClick={() => setSelected(allSelected ? new Set() : new Set(items.map((_, i) => i)))}>
                <span className={`cart-check__box${allSelected ? " cart-check__box--checked" : ""}`}>
                  {allSelected && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                Seleccionar todo
              </button>
            </div>

            <div className="cart-page__items">
              {items.map((item, i) => {
                const qty = item.quantity ?? 1;
                return (
                  <div key={i} className="cart-page__item">
                    <button className="cart-check" onClick={() => toggleSelected(i)} aria-label={selected.has(i) ? "Desmarcar ítem" : "Marcar ítem"}>
                      <span className={`cart-check__box${selected.has(i) ? " cart-check__box--checked" : ""}`}>
                        {selected.has(i) && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                    </button>
                    <CartItemThumb item={item} />
                    <div className="cart-page__item-info">
                      <strong>{item.garmentName}</strong>
                      <span className="cart-page__item-meta">{item.colorName} · Talla {item.size}</span>
                      {item.estampados.length > 0 && (
                        <span className="cart-page__item-estampados">
                          {item.estampados.map((p) => `${p.estampado.name} · ${p.tipo.name} (${p.size.name}) +$${p.size.price_increment.toLocaleString("es-AR")}`).join(", ")}
                        </span>
                      )}
                      <div className="cart-page__qty">
                        <button className="qty-btn" onClick={() => updateQuantity(i, qty - 1)} aria-label="Disminuir cantidad">−</button>
                        <span>{qty}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(i, qty + 1)} aria-label="Aumentar cantidad">+</button>
                      </div>
                    </div>
                    <div className="cart-page__item-right">
                      <span className="cart-page__item-price">${(unitTotal(item) * qty).toLocaleString("es-AR")}</span>
                      <button className="btn-small btn-small--danger" onClick={() => removeItem(i)} aria-label="Quitar">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-page__summary">
              <div className="cart-page__summary-row">
                <span>Selected Items</span>
                <strong className="cart-page__summary-amount">${selectedPrice.toLocaleString("es-AR")}</strong>
              </div>
              <div className="cart-page__summary-row cart-page__shipping">
                <span>Envío</span>
                <div className="ship-toggle">
                  <button className={`ship-toggle__btn${shipMode === "retiro" ? " ship-toggle__btn--active" : ""}`} onClick={() => setShipMode("retiro")}>Retiro ($0.0)</button>
                  <button className={`ship-toggle__btn${shipMode === "envio" ? " ship-toggle__btn--active" : ""}`} onClick={() => setShipMode("envio")}>Envío</button>
                </div>
              </div>
              {shipMode === "envio" && (
                <p className="cart-page__shipping-note">A convenir según distancia. El costo se acuerda por WhatsApp.</p>
              )}
              <div className="cart-page__summary-divider" />
              <div className="cart-page__summary-row">
                <span className="cart-page__subtotal-label">Subtotal</span>
                <strong className="cart-page__subtotal-amount">${selectedPrice.toLocaleString("es-AR")}</strong>
              </div>
              {ADMIN_PHONE ? (
                <a
                  href={`https://wa.me/${ADMIN_PHONE}?text=${buildWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-checkout"
                  onClick={handleWhatsApp}
                >
                  Checkout
                </a>
              ) : (
                <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Configurá VITE_WHATSAPP_PHONE en .env para habilitar Checkout
                </p>
              )}
              <button className="btn-outline" onClick={() => navigate("/colecciones")} style={{ width: "100%" }}>
                Seguir comprando
              </button>
              <button className="btn-outline" onClick={() => navigate(-1)} style={{ width: "100%" }}>
                Volver
              </button>
              <button className="btn-danger" onClick={clearCart} style={{ width: "100%" }}>
                Vaciar carrito
              </button>
            </div>
          </>
        )}

        {orders.length > 0 && (
          <div className="cart-page__orders">
            <button className="cart-page__orders-toggle" onClick={() => setShowOrders((s) => !s)} aria-expanded={showOrders}>
              <span>Pedidos recientes</span>
              <span className="cart-page__orders-count">{orders.length}</span>
            </button>
            {showOrders && (
              <div className="cart-page__orders-list">
                {orders.map((order, idx) => (
                  <div key={idx} className="cart-order">
                    <div className="cart-order__meta">
                      <strong className="cart-order__total">${order.total.toLocaleString("es-AR")}</strong>
                      <span className="cart-order__date">{new Date(order.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    <span className="cart-order__items">{order.items.map((it) => `${it.quantity ?? 1}× ${it.garmentName}`).join(", ")}</span>
                    <button className="btn-small" onClick={() => reorder(order)} type="button">Repetir pedido</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

> Nota: los items removidos quedan en `selected` como índices huérfanos. Para robustez, al cambiar `items` se puede recalcular: agregar `useEffect(() => setSelected(new Set(items.map((_, i) => i))), [items.length])` — ver Step 4.

- [ ] **Step 3: Agregar ruta `/carrito` en `App.tsx`**

```tsx
                <Route path="/carrito" element={<CartPage />} />
```

Y el import `import CartPage from "./pages/CartPage";`.

- [ ] **Step 4: Estilos del carrito en `App.css`**

```css
.cart-page__body { padding: var(--space-4); max-width: 640px; margin: 0 auto; }
.cart-page__item {
  display: flex; align-items: flex-start; gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-3);
}
.cart-page__item-thumb { width: 4.5rem; flex: 0 0 auto; background: var(--surface-hover); border-radius: var(--radius); padding: 0.25rem; }
.cart-page__item-info { flex: 1; min-width: 0; }
.cart-page__item-info strong { color: var(--text); }
.cart-page__item-meta { display: block; font-size: 0.78rem; color: var(--text-muted); }
.cart-page__item-estampados { display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; }
.cart-page__item-price { color: var(--accent); font-weight: 700; }
.cart-page__qty {
  display: inline-flex; align-items: center; gap: 0.5rem;
  border: 1px solid var(--border); border-radius: var(--radius-pill);
  padding: 0.15rem 0.25rem; margin-top: 0.4rem;
}
.qty-btn { border: none; background: transparent; width: 28px; height: 28px; font-size: 1rem; cursor: pointer; color: var(--text); }
.cart-check { border: none; background: none; cursor: pointer; padding: 0.25rem; }
.cart-check__box {
  display: grid; place-items: center; width: 22px; height: 22px;
  border: 2px solid var(--border); border-radius: 50%;
  transition: background var(--transition), border-color var(--transition);
}
.cart-check__box--checked { background: var(--accent); border-color: var(--accent); }
.cart-page__summary {
  position: sticky; bottom: 0;
  margin: var(--space-4) calc(-1 * var(--space-4));
  padding: var(--space-4) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -8px 30px rgba(30, 34, 48, 0.1);
}
.cart-page__summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; font-size: 0.9rem; color: var(--text-secondary); }
.cart-page__summary-amount { color: var(--accent); }
.cart-page__summary-divider { border-top: 1px solid var(--border); margin: var(--space-3) 0; }
.cart-page__subtotal-label { font-weight: 700; color: var(--text); }
.cart-page__subtotal-amount { color: var(--accent); font-size: 1.2rem; }
.btn-checkout {
  display: block; width: 100%; padding: 1rem;
  border: none; border-radius: var(--radius-pill);
  background: #1e2230; color: var(--surface);
  font-weight: 700; text-align: center; text-decoration: none;
  margin-bottom: 0.5rem; cursor: pointer;
}
.btn-checkout:active { transform: scale(0.99); }
.ship-toggle { display: flex; gap: 0.5rem; }
.ship-toggle__btn {
  padding: 0.35rem 0.8rem; border: 1px solid var(--border);
  border-radius: var(--radius-pill); background: var(--surface);
  font-size: 0.8rem; color: var(--text-secondary); cursor: pointer;
}
.ship-toggle__btn--active { background: var(--text); color: var(--surface); border-color: var(--text); }
.cart-page__shipping-note { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.6rem; }
```

También agregar un `useEffect` en `CartPage` para resincronizar `selected` cuando cambia la longitud de `items`:

```tsx
  useEffect(() => {
    setSelected(new Set(items.map((_, i) => i)));
  }, [items.length]);
```

- [ ] **Step 5: Verificar**

Run: `npm run build` (en `client/`)
Expected: OK. `/carrito` muestra la lista, checkboxes, resumen, envío Retiro/Envío, Checkout → WhatsApp, Seguir comprando, Volver, Vaciar. Los headers/FAB llevan a `/carrito`.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/CartPage.tsx client/src/lib/cart.tsx client/src/App.tsx client/src/App.css
git commit -m "feat(client): full cart page with checkout summary, remove drawer"
```

---

## Task 10: Limpieza y PWA

**Files:**
- Delete: `client/src/components/OnboardingModal.tsx`, `client/src/components/QuickViewModal.tsx`
- Modify: `client/index.html` (theme-color)
- Modify: `client/public/sw.js` (CACHE_NAME)
- Modify: `client/src/App.css` (limpiar CSS muerto de drawer si quedó)

- [ ] **Step 1: Eliminar componentes muertos**

```bash
git rm client/src/components/OnboardingModal.tsx client/src/components/QuickViewModal.tsx
```

Verificar con grep que no haya imports restantes: `rg -n "OnboardingModal|QuickViewModal" client/src` → sin resultados.

- [ ] **Step 2: Theme color claro en `index.html`**

Buscar `<meta name="theme-color"` y cambiar su `content` a `#f8f9fa`. Si no existe, agregarlo en el `<head>`.

- [ ] **Step 3: Bump de caché PWA en `sw.js`**

Cambiar `CACHE_NAME` de `store-v2` a `store-v3`.

- [ ] **Step 4: Verificar**

Run: `npm run build` y `npm run lint` (en `client/`)
Expected: build OK, lint sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(client): remove dead modals, light theme-color, bump PWA cache"
```

---

## Task 11: Verificación final

**Files:**
- `client/` (todos)

- [ ] **Step 1: Build y lint**

Run: `npm run build` (en `client/`); luego `npm run lint`
Expected: ambos sin errores.

- [ ] **Step 2: Revisión en móvil 390px (Playwright o dev)**

Pantallas a recorrer: `/` (onboarding + carrusel + CTA), `/colecciones` (banner + pills filtran + grilla), `/producto/:slug` (hoja de detalles + sheet 3 solapas + drag frente/posterior), `/carrito` (checkout WhatsApp, Retiro/Envío, selección). Verificar que no haya texto ilegible ni botones < 44px en los controles principales.

- [ ] **Step 3: Sin regresiones**

Drag frente/posterior, dedupe del carrito, pedidos recientes, admin (login, tabs, CRUD). El admin no debe romper por el tema claro.

- [ ] **Step 4: Actualizar `AI_CONTEXT.md`**

Agregar la sesión con: tema claro, onboarding, carrusel espectacular, colecciones con banner+pills, sheet de diseño, carrito página completa, WhatsApp movido al carrito, envío Retiro/Envío, componentes eliminados, regla de `npm run build`.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "docs: update AI_CONTEXT with mobile redesign session"
```

---

## Self-Review (correr al terminar de escribir)

1. **Spec coverage:** cada sección de la spec tiene su task (tokens→1, CSS→2, carrusel→3, onboarding/rutas→4, colecciones→5, header→6, producto→7, sheet→8, carrito→9, limpieza/PWA→10, verificación→11). ✔
2. **Placeholder scan:** los triggers y el flujo de ProductPage quedan conectados entre Task 7 y Task 8 (el placeholder se resuelve en Task 8 Step 2). ✔
3. **Type consistency:** `CartItem` se importa en `CartPage` desde `lib/cart`; las props del `DesignFlow` refactorizado conservan los mismos nombres que consumía `ProductPage` (`customMode`, `customPos`, `customSide`, callbacks). ✔