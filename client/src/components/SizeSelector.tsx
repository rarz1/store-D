import type { EstampadoSizeRow } from "../lib/supabase";

interface Props {
  sizes: EstampadoSizeRow[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onPreviewArea?: (positionKey: string | null) => void;
}

export default function SizeSelector({ sizes, selectedId, onSelect, onPreviewArea }: Props) {
  if (sizes.length === 0) return null;

  return (
    <div className="control-group">
      <span className="control-label">TAMAÑO</span>
      <div className="size-selector">
        {sizes.map((s) => (
          <button
            key={s.id}
            className={`size-chip${selectedId === s.id ? " size-chip--active" : ""}`}
            onClick={() => {
              onSelect(s.id);
              onPreviewArea?.(s.slug);
            }}
            onMouseEnter={() => onPreviewArea?.(s.slug)}
            onMouseLeave={() => onPreviewArea?.(null)}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
