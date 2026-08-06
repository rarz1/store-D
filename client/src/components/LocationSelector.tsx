import type { EstampadoLocationRow } from "../lib/supabase";

interface Props {
  locations: EstampadoLocationRow[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onCustomToggle?: () => void;
  customActive?: boolean;
}

export default function LocationSelector({ locations, selectedIds, onToggle, onCustomToggle, customActive }: Props) {
  if (locations.length === 0) return null;

  return (
    <div className="control-group">
      <span className="control-label">UBICACIÓN</span>
      <div className="design-option-selector">
        {locations.map((l) => {
          const active = selectedIds.includes(l.id);
          return (
            <button
              key={l.id}
              className={`design-option-card${active ? " design-option-card--active" : ""}`}
              onClick={() => onToggle(l.id)}
            >
              <span className="design-option-card__name">{l.name}</span>
              {l.price_increment > 0 && (
                <span className="design-option-card__price">+${l.price_increment.toFixed(2)}</span>
              )}
            </button>
          );
        })}
        {onCustomToggle && (
          <button
            className={`design-option-card${customActive ? " design-option-card--active" : ""}`}
            onClick={onCustomToggle}
          >
            <span className="design-option-card__name">🎯 Ubicación libre</span>
          </button>
        )}
      </div>
    </div>
  );
}
