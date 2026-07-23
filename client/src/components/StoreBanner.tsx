import type { SiteSettings } from "../lib/settings";

interface Props {
  settings: SiteSettings;
}

export default function StoreBanner({ settings }: Props) {
  return (
    <div className="store-banner">
      <div className="store-banner__glass">
        {settings.logo_url && (
          <img src={settings.logo_url} alt="" className="store-banner__logo" />
        )}
        <h1 className="store-banner__title">{settings.store_title}</h1>
        <p className="store-banner__subtitle">{settings.store_subtitle}</p>
      </div>
    </div>
  );
}
