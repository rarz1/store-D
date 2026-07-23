export function setMeta(overrides: {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}) {
  const title = overrides.title ?? "STORE · Colección";
  const desc = overrides.description ?? overrides.ogDescription ?? "Prendas personalizables. Remeras, pantalones y buzos oversize con diseño propio.";

  document.title = title;
  setMetaTag("description", desc);
  setMetaTag("og:title", overrides.ogTitle ?? title);
  setMetaTag("og:description", overrides.ogDescription ?? desc);
}

function setMetaTag(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    if (property.startsWith("og:")) el.setAttribute("property", property);
    else el.setAttribute("name", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}