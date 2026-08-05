import { useState } from "react";
import type { EstampadoRow } from "../lib/supabase";

interface Props {
  estampados: EstampadoRow[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function EstampadoSelector({ estampados, selectedId, onSelect }: Props) {
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = [...new Set(estampados.flatMap((e) => e.tags))].sort();
  const filtered = tagFilter
    ? estampados.filter((e) => e.tags.includes(tagFilter))
    : estampados;

  if (estampados.length === 0) return null;

  return (
    <div className="estampado-selector">
      {allTags.length > 0 && (
        <div className="tag-chips">
          <button
            className={`tag-chip${tagFilter === null ? " tag-chip--active" : ""}`}
            onClick={() => setTagFilter(null)}
          >
            Todos
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-chip${tagFilter === tag ? " tag-chip--active" : ""}`}
              onClick={() => setTagFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="estampado-grid" role="radiogroup" aria-label="Estampado">
        {filtered.map((e) => (
          <button
            key={e.id}
            className={`estampado-card${selectedId === e.id ? " estampado-card--active" : ""}`}
            onClick={() => onSelect(e.id)}
            role="radio"
            aria-checked={selectedId === e.id}
          >
            <div className="estampado-card__preview">
              {e.image_url ? (
                <img src={e.image_url} alt={e.name} loading="lazy" decoding="async" />
              ) : (
                <div
                  className="estampado-card__svg"
                  dangerouslySetInnerHTML={{ __html: e.svg_content.replace(/currentColor/gi, "var(--accent)") }}
                />
              )}
            </div>
            <div className="estampado-card__info">
              <span className="estampado-card__name">{e.name}</span>
              {e.description && <span className="estampado-card__desc">{e.description}</span>}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>
          No hay diseños en esta categoría
        </p>
      )}
    </div>
  );
}
