export function recolorMockSvg(svg: string, color: string): string {
  const stripped = svg.replace(/\s(width|height)="[^"]*"/g, "");

  if (/currentcolor/i.test(stripped)) {
    return stripped.replace(/currentcolor/gi, color);
  }

  const bodyColors = new Set<string>();
  for (const m of stripped.matchAll(/fill="(#[0-9a-f]{6})"/gi)) {
    const hex = m[1].toLowerCase();
    if (hexLuma(hex) > 220) bodyColors.add(hex);
  }

  if (bodyColors.size === 0) return stripped;

  const re = new RegExp(
    `(fill|stroke|stop-color|color)="(${[...bodyColors].join("|")})"`,
    "gi",
  );
  return stripped.replace(re, `$1="${color}"`);
}

function hexLuma(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}