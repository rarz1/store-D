import { useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim();
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="admin-tag-input">
      <div className="admin-tag-input__chips">
        {value.map((tag) => (
          <span key={tag} className="admin-tag-chip">
            {tag}
            <button
              type="button"
              className="admin-tag-chip__remove"
              onClick={() => removeTag(tag)}
              aria-label={`Quitar etiqueta ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        className="admin-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
          if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={addTag}
        placeholder={placeholder ?? "Escribí una etiqueta y presioná Enter"}
      />
    </div>
  );
}
