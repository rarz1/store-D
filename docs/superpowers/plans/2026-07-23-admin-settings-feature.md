# Admin Settings Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin settings page with store info, carousel management, and color palette customization

**Architecture:** New `site_settings` + `carousel_slides` tables in Supabase. New admin page with 3 tabs. Settings loaded on app mount and applied as CSS variables. Carousel reads from DB.

**Tech Stack:** React 19, Supabase, Vite

---

### Task 1: Database schema + Storage bucket

**Files:**
- Modify: `supabase-schema.sql`
- Execute in: Supabase SQL Editor

- [ ] **Step 1: Add new tables to supabase-schema.sql**

```sql
-- Site settings (single row)
create table site_settings (
  id bigint primary key generated always as identity,
  store_title text not null default '',
  store_subtitle text not null default '',
  logo_url text not null default '',
  collections_title text not null default 'COLECCIONES',
  collections_subtitle text not null default 'Elegí tu prenda y personalizala a tu gusto',
  color_bg text not null default '#131518',
  color_surface text not null default '#1c1f24',
  color_text text not null default '#f2f4f7',
  color_accent text not null default '#f97316',
  updated_at timestamptz default now()
);

-- Carousel slides
create table carousel_slides (
  id bigint primary key generated always as identity,
  sort_order int not null default 0,
  layout text not null default 'full' check (layout in ('full', 'double')),
  image_1_url text not null default '',
  image_2_url text default '',
  text_overlay text not null default '',
  subtitle text not null default ''
);

-- Seed default settings row
insert into site_settings (id, store_title, store_subtitle) values
  (1, 'STORE', 'DISEÑO PROPIO · ALGODÓN ORGÁNICO');

-- Seed default carousel slides
insert into carousel_slides (sort_order, layout, text_overlay, subtitle) values
  (1, 'full', 'NUEVA\nCOLECCIÓN', 'DISEÑO PROPIO · ALGODÓN ORGÁNICO'),
  (2, 'double', 'TU ESTILO\nTU FIRMA', 'ESTAMPADOS EXCLUSIVOS · EDICIÓN LIMITADA'),
  (3, 'full', 'PUREZA\nY FORMA', 'PRENDAS OVERSIZE · CORTE PERFECTO'),
  (4, 'double', 'EDICIÓN\nLIMITADA', 'SOLO POR TIEMPO LIMITADO');

-- Enable RLS
alter table site_settings enable row level security;
alter table carousel_slides enable row level security;

-- Policies
create policy "Public read" on site_settings for select using (true);
create policy "Admin insert" on site_settings for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on site_settings for update using (auth.role() = 'authenticated');
create policy "Admin delete" on site_settings for delete using (auth.role() = 'authenticated');

create policy "Public read" on carousel_slides for select using (true);
create policy "Admin insert" on carousel_slides for insert with check (auth.role() = 'authenticated');
create policy "Admin update" on carousel_slides for update using (auth.role() = 'authenticated');
create policy "Admin delete" on carousel_slides for delete using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Add storage bucket SQL**

```sql
-- Create bucket for store images
insert into storage.buckets (id, name, public) values ('store-images', 'store-images', true);

-- Allow public to read
create policy "Public read" on storage.objects for select using (bucket_id = 'store-images');
-- Allow authenticated to upload/update/delete
create policy "Admin upload" on storage.objects for insert with check (bucket_id = 'store-images' and auth.role() = 'authenticated');
create policy "Admin update" on storage.objects for update using (bucket_id = 'store-images' and auth.role() = 'authenticated');
create policy "Admin delete" on storage.objects for delete using (bucket_id = 'store-images' and auth.role() = 'authenticated');
```

- [ ] **Step 3: Commit** (skip — user needs to execute in Supabase first)

---

### Task 2: Settings lib (types + queries)

**Files:**
- Create: `client/src/lib/settings.ts`

- [ ] **Step 1: Write settings.ts**

```typescript
import { supabase } from "./supabase";

export interface SiteSettings {
  id: number;
  store_title: string;
  store_subtitle: string;
  logo_url: string;
  collections_title: string;
  collections_subtitle: string;
  color_bg: string;
  color_surface: string;
  color_text: string;
  color_accent: string;
  updated_at: string;
}

export interface CarouselSlide {
  id: number;
  sort_order: number;
  layout: "full" | "double";
  image_1_url: string;
  image_2_url: string;
  text_overlay: string;
  subtitle: string;
}

export async function getSettings(): Promise<SiteSettings | null> {
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  return data;
}

export async function saveSettings(settings: Partial<SiteSettings>): Promise<boolean> {
  const { error } = await supabase.from("site_settings").update(settings).eq("id", 1);
  return !error;
}

export async function getSlides(): Promise<CarouselSlide[]> {
  const { data } = await supabase.from("carousel_slides").select("*").order("sort_order");
  return data ?? [];
}

export async function saveSlide(id: number, slide: Partial<CarouselSlide>): Promise<boolean> {
  const { error } = await supabase.from("carousel_slides").update(slide).eq("id", id);
  return !error;
}

export async function uploadImage(file: File, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("store-images").upload(path, file, { upsert: true });
  if (error) { console.error("Upload error:", error); return null; }
  const { data: { publicUrl } } = supabase.storage.from("store-images").getPublicUrl(data.path);
  return publicUrl;
}

export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function lightenHex(hex: string, percent: number): string {
  const c = hex.replace("#", "");
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);
  r = Math.min(255, Math.round(r + (255 - r) * percent));
  g = Math.min(255, Math.round(g + (255 - g) * percent));
  b = Math.min(255, Math.round(b + (255 - b) * percent));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function applyColors(settings: SiteSettings) {
  const root = document.documentElement;
  root.style.setProperty("--bg", settings.color_bg);
  root.style.setProperty("--surface", settings.color_surface);
  root.style.setProperty("--text", settings.color_text);
  root.style.setProperty("--accent", settings.color_accent);
  root.style.setProperty("--accent-hover", lightenHex(settings.color_accent, 0.1));
  root.style.setProperty("--accent-glow", hexToRgba(settings.color_accent, 0.2));
  root.style.setProperty("--surface-hover", lightenHex(settings.color_surface, 0.05));
  root.style.setProperty("--border", lightenHex(settings.color_surface, 0.08));
}
```

---

### Task 3: Admin Settings page

**Files:**
- Create: `client/src/pages/admin/AdminSettings.tsx`

- [ ] **Step 1: Write AdminSettings.tsx**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getSettings, saveSettings, getSlides, saveSlide, uploadImage, applyColors, type SiteSettings, type CarouselSlide } from "../../lib/settings";

type Tab = "store" | "carousel" | "colors";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("store");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    getSlides().then(setSlides);
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    applyColors(settings);
    setSaving(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h1>Configuración</h1>
        <button className="btn-back" onClick={() => navigate("/admin")}>Volver</button>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab${tab === "store" ? " admin-tab--active" : ""}`} onClick={() => setTab("store")}>Tienda</button>
        <button className={`admin-tab${tab === "carousel" ? " admin-tab--active" : ""}`} onClick={() => setTab("carousel")}>Carrusel</button>
        <button className={`admin-tab${tab === "colors" ? " admin-tab--active" : ""}`} onClick={() => setTab("colors")}>Colores</button>
      </div>

      {tab === "store" && settings && (
        <div className="admin-form">
          <label className="admin-label">Título de la tienda</label>
          <input className="admin-input" value={settings.store_title} onChange={(e) => setSettings({ ...settings, store_title: e.target.value })} />

          <label className="admin-label">Subtítulo</label>
          <input className="admin-input" value={settings.store_subtitle} onChange={(e) => setSettings({ ...settings, store_subtitle: e.target.value })} />

          <label className="admin-label">Logo</label>
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadImage(file, `logo/${Date.now()}-${file.name}`);
            if (url) setSettings({ ...settings, logo_url: url });
          }} />
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="admin-preview-img" style={{ width: 120, height: "auto", marginTop: 8 }} />
          )}

          <label className="admin-label">Título de colecciones</label>
          <input className="admin-input" value={settings.collections_title} onChange={(e) => setSettings({ ...settings, collections_title: e.target.value })} />

          <label className="admin-label">Subtítulo de colecciones</label>
          <input className="admin-input" value={settings.collections_subtitle} onChange={(e) => setSettings({ ...settings, collections_subtitle: e.target.value })} />

          <button className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}

      {tab === "carousel" && (
        <div className="admin-form">
          {slides.map((slide, i) => (
            <div key={slide.id} className="admin-carousel-slide">
              <h3 className="admin-carousel-slide__title">Slide {i + 1}</h3>

              <label className="admin-label">Layout</label>
              <select className="admin-input" value={slide.layout} onChange={(e) => {
                const copy = [...slides];
                copy[i] = { ...copy[i], layout: e.target.value as "full" | "double" };
                setSlides(copy);
              }}>
                <option value="full">Completa</option>
                <option value="double">Doble</option>
              </select>

              <label className="admin-label">Imagen 1</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file, `carousel/slide-${slide.id}-1-${Date.now()}`);
                if (url) {
                  const copy = [...slides];
                  copy[i] = { ...copy[i], image_1_url: url };
                  setSlides(copy);
                }
              }} />
              {slide.image_1_url && <img src={slide.image_1_url} alt="" className="admin-preview-img" style={{ width: 200, height: "auto", marginTop: 8 }} />}

              {slide.layout === "double" && (
                <>
                  <label className="admin-label">Imagen 2</label>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file, `carousel/slide-${slide.id}-2-${Date.now()}`);
                    if (url) {
                      const copy = [...slides];
                      copy[i] = { ...copy[i], image_2_url: url };
                      setSlides(copy);
                    }
                  }} />
                  {slide.image_2_url && <img src={slide.image_2_url} alt="" className="admin-preview-img" style={{ width: 200, height: "auto", marginTop: 8 }} />}
                </>
              )}

              <label className="admin-label">Texto overlay</label>
              <textarea className="admin-input admin-textarea" value={slide.text_overlay} onChange={(e) => {
                const copy = [...slides];
                copy[i] = { ...copy[i], text_overlay: e.target.value };
                setSlides(copy);
              }} placeholder="NUEVA\nCOLECCIÓN" style={{ fontFamily: "monospace", fontSize: "0.75rem" }} />

              <label className="admin-label">Subtítulo</label>
              <input className="admin-input" value={slide.subtitle} onChange={(e) => {
                const copy = [...slides];
                copy[i] = { ...copy[i], subtitle: e.target.value };
                setSlides(copy);
              }} />
            </div>
          ))}
          <button className="btn-primary" onClick={async () => {
            setSaving(true);
            for (const slide of slides) {
              await saveSlide(slide.id, slide);
            }
            setSaving(false);
          }} disabled={saving}>
            {saving ? "Guardando..." : "Guardar carrusel"}
          </button>
        </div>
      )}

      {tab === "colors" && settings && (
        <div className="admin-form">
          <div className="admin-color-row">
            <label className="admin-label">Fondo</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_bg} onChange={(e) => setSettings({ ...settings, color_bg: e.target.value })} />
            <code className="admin-color-hex">{settings.color_bg}</code>
          </div>
          <div className="admin-color-row">
            <label className="admin-label">Superficie</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_surface} onChange={(e) => setSettings({ ...settings, color_surface: e.target.value })} />
            <code className="admin-color-hex">{settings.color_surface}</code>
          </div>
          <div className="admin-color-row">
            <label className="admin-label">Texto</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_text} onChange={(e) => setSettings({ ...settings, color_text: e.target.value })} />
            <code className="admin-color-hex">{settings.color_text}</code>
          </div>
          <div className="admin-color-row">
            <label className="admin-label">Acento</label>
            <input type="color" className="admin-input admin-input--color" value={settings.color_accent} onChange={(e) => setSettings({ ...settings, color_accent: e.target.value })} />
            <code className="admin-color-hex">{settings.color_accent}</code>
          </div>

          <div className="admin-color-preview" style={{
            background: settings.color_bg,
            padding: "1.5rem",
            borderRadius: "var(--radius)",
            marginTop: "1rem",
          }}>
            <div style={{
              background: settings.color_surface,
              padding: "1rem",
              borderRadius: "var(--radius-sm)",
              border: `1px solid rgba(255,255,255,0.08)`,
            }}>
              <p style={{ color: settings.color_accent, fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.04em", margin: "0 0 0.5rem" }}>Preview</p>
              <p style={{ color: settings.color_text, fontSize: "0.875rem", margin: 0 }}>Texto de ejemplo con el color seleccionado</p>
            </div>
          </div>

          <button className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
            {saving ? "Guardando..." : "Guardar colores"}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 4: Add route + load settings on mount

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Import and add route**

```tsx
import AdminSettings from "./pages/admin/AdminSettings";
import { getSettings, applyColors, type SiteSettings } from "./lib/settings";
```

Add state and effect inside the component (before the return):

```tsx
const [, setSettings] = useState<SiteSettings | null>(null);

useEffect(() => {
  getSettings().then((s) => {
    if (s) {
      setSettings(s);
      applyColors(s);
    }
  });
}, []);
```

Add route:

```tsx
<Route
  path="/admin/settings"
  element={<AuthGuard><AdminSettings /></AuthGuard>}
/>
```

---

### Task 5: Dashboard link to settings

**Files:**
- Modify: `client/src/pages/admin/AdminDashboard.tsx`

- [ ] **Step 1: Add settings link after the designs section**

```tsx
<section className="admin-section">
  <div className="admin-section-header">
    <h2>Configuración</h2>
  </div>
  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
    Personalizá la tienda, el carrusel y los colores
  </p>
  <button className="btn-back" onClick={() => navigate("/admin/settings")}>
    Abrir configuración
  </button>
</section>
```

---

### Task 6: Dynamic Carousel from DB

**Files:**
- Modify: `client/src/components/Carousel.tsx`

- [ ] **Step 1: Rewrite Carousel to fetch from DB**

```tsx
import { useState, useEffect, useCallback } from "react";
import { getSlides, type CarouselSlide } from "../lib/settings";

export default function Carousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    getSlides().then(setSlides);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goTo = (index: number) => setCurrent(index);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel__track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`carousel__slide carousel__slide--${slide.layout}`}
            style={slide.image_1_url ? {
              backgroundImage: slide.layout === "double"
                ? `url(${slide.image_1_url}), url(${slide.image_2_url})`
                : `url(${slide.image_1_url})`,
              backgroundSize: slide.layout === "double" ? "50% 100%, 50% 100%" : "cover",
              backgroundPosition: slide.layout === "double" ? "left center, right center" : "center",
              backgroundRepeat: "no-repeat",
            } : {
              background: `linear-gradient(135deg, #131518 0%, #1e3a5f 50%, #131518 100%)`,
            }}
          >
            <div className="carousel__content">
              <h2 className="carousel__title">
                {slide.text_overlay.split("\\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j === 0 && <br />}
                  </span>
                ))}
              </h2>
              <p className="carousel__subtitle">{slide.subtitle}</p>
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
          />
        ))}
      </div>
    </section>
  );
}
```

---

### Task 7: Dynamic HomePage collections title

**Files:**
- Modify: `client/src/pages/HomePage.tsx`

- [ ] **Step 1: Import and use settings**

Add import:
```tsx
import { getSettings, type SiteSettings } from "../lib/settings";
```

Add state + effect:
```tsx
const [settings, setSiteSettings] = useState<SiteSettings | null>(null);

useEffect(() => {
  getSettings().then(setSiteSettings);
  setMeta({ ... });
  supabase.from("garments")...
}, []);
```

Use dynamic text:
```tsx
<h2 className="categories__title">{settings?.collections_title || "COLECCIONES"}</h2>
<p className="categories__subtitle">{settings?.collections_subtitle || "Elegí tu prenda y personalizala a tu gusto"}</p>
```

---

### Task 8: CSS for admin settings page

**Files:**
- Modify: `client/src/App.css`

- [ ] **Step 1: Add styles at end of file**

```css
/* ==============================
   ADMIN SETTINGS
   ============================== */

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

.admin-tab {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition);
}

.admin-tab:hover {
  color: var(--text);
  background: var(--surface-hover);
}

.admin-tab--active {
  color: var(--accent);
  background: rgba(249, 115, 22, 0.1);
}

.admin-carousel-slide {
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 1rem;
}

.admin-carousel-slide__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  color: var(--text);
  margin: 0 0 0.75rem;
}

.admin-color-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.admin-color-row .admin-label {
  min-width: 100px;
  margin: 0;
}

.admin-color-hex {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: 'Consolas', 'Monaco', monospace;
}

.admin-preview-img {
  display: block;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
```