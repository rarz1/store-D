import { useState } from "react";
import type { Category } from "../types";

const COLORS = [
  { value: "negro", label: "Negro" },
  { value: "blanco", label: "Blanco" },
  { value: "gris", label: "Gris" },
  { value: "rojo", label: "Rojo" },
  { value: "azul", label: "Azul" },
  { value: "verde", label: "Verde" },
];

const SIZES = ["S", "M", "L", "XL"];

interface FilterPanelProps {
  categories: Category[];
  onChange: (filters: { category?: number; color?: string; size?: string }) => void;
}

type FilterKey = "category" | "color" | "size";

export default function FilterPanel({ categories, onChange }: FilterPanelProps) {
  const [active, setActive] = useState<{ key: FilterKey; value: string } | null>(null);

  const handleSelect = (key: FilterKey, value: string) => {
    setActive((prev) =>
      prev?.key === key && prev.value === value ? null : { key, value }
    );

    const parsed = key === "category" ? (value ? Number(value) : undefined) : (value || undefined);
    onChange({ [key]: parsed });
  };

  return (
    <div className="filter-panel">
      {categories.map((c) => (
        <button
          key={c.id}
          className={`filter-chip${active?.key === "category" && active.value === String(c.id) ? " filter-chip--active" : ""}`}
          onClick={() => handleSelect("category", String(c.id))}
        >
          {c.name}
        </button>
      ))}

      <div className="filter-divider" />

      {COLORS.map((c) => (
        <button
          key={c.value}
          className={`filter-chip${active?.key === "color" && active.value === c.value ? " filter-chip--active" : ""}`}
          onClick={() => handleSelect("color", c.value)}
        >
          {c.label}
        </button>
      ))}

      <div className="filter-divider" />

      {SIZES.map((s) => (
        <button
          key={s}
          className={`filter-chip${active?.key === "size" && active.value === s ? " filter-chip--active" : ""}`}
          onClick={() => handleSelect("size", s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
