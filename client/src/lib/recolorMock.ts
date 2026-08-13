interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function recolorMockSvg(svg: string, color: string): string {
  const stripped = svg.replace(/\s(width|height)="[^"]*"/g, "");

  if (/currentcolor/i.test(stripped)) {
    return stripped.replace(/currentcolor/gi, color);
  }

  const user = parseColor(color);
  const userIsBlack =
    user !== null && luma(user) <= 60 && isGrayish(user);

  const replacements = buildReplacements(stripped, color, userIsBlack);
  if (replacements.size === 0) return stripped;

  const escaped = [...replacements.keys()].map(escapeRegExp).join("|");
  const attrRe = new RegExp(
    "(fill|stroke|stop-color|color)=\"(" + escaped + ")\"",
    "gi",
  );

  const defsBlocks: string[] = [];
  const body = stripped.replace(/<defs\b[\s\S]*?<\/defs>/gi, (block) => {
    defsBlocks.push(block);
    return `@@recolorMockDefs${defsBlocks.length - 1}@@`;
  });

  const colored = body.replace(attrRe, (match, attr, orig) => {
    void match;
    return `${attr}="${replacements.get(orig.toLowerCase()) ?? color}"`;
  });

  const styleRe = new RegExp(
    "((?:fill|stroke|stop-color|color)\\s*:\\s*)(" + escaped + ")",
    "gi",
  );
  const coloredStyles = colored.replace(styleRe, (_m, prefix, orig) => {
    return `${prefix}${replacements.get(orig.toLowerCase()) ?? color}`;
  });

  return coloredStyles.replace(/@@recolorMockDefs(\d+)@@/g, (_m, i) => defsBlocks[Number(i)]);
}

function buildReplacements(
  svg: string,
  color: string,
  userIsBlack: boolean,
): Map<string, string> {
  const replacements = new Map<string, string>();
  const seen = new Set<string>();

  const body = svg.replace(/<defs\b[\s\S]*?<\/defs>/gi, "");

  const consider = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (!value || seen.has(value)) return;
    seen.add(value);

    const parsed = parseColor(value);
    if (parsed === null) return;

    const lum = luma(parsed);
    const white = lum > 220;
    const dark = lum <= 60 && isGrayish(parsed);

    if (white) {
      replacements.set(value, color);
    } else if (dark && userIsBlack) {
      replacements.set(value, "#272727");
    }
  };

  for (const m of body.matchAll(/(?:fill|stroke|stop-color|color)="([^"]*)"/gi)) {
    consider(m[1]);
  }
  for (const m of body.matchAll(
    /(?:fill|stroke|stop-color|color)\s*:\s*([^;"']+)/gi,
  )) {
    consider(m[1]);
  }

  return replacements;
}

function parseColor(value: string): Rgb | null {
  const s = value.trim().toLowerCase();

  let m = /^#([0-9a-f]{6})/.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return {
      r: ((n >> 8) & 15) * 17,
      g: ((n >> 4) & 15) * 17,
      b: (n & 15) * 17,
    };
  }

  m = /^rgba?\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*[\d.]+%?)?\)$/.exec(
    s,
  );
  if (m) {
    const to255 = (x: string) =>
      x.includes("%") ? Math.round(parseFloat(x) * 2.55) : Math.round(parseFloat(x));
    return { r: to255(m[1]), g: to255(m[2]), b: to255(m[3]) };
  }

  if (s === "white") return { r: 255, g: 255, b: 255 };
  if (s === "black") return { r: 0, g: 0, b: 0 };
  return null;
}

function luma({ r, g, b }: Rgb): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isGrayish({ r, g, b }: Rgb): boolean {
  return Math.max(r, g, b) - Math.min(r, g, b) < 40;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}