import type { SiteSettings } from "../lib/settings";

interface Props {
  settings: SiteSettings;
}

export default function StoreBanner({ settings }: Props) {
  return (
    <div className="store-banner">
      <div className="store-banner__inner">
        {settings.logo_url && (
          <img src={settings.logo_url} alt="" className="store-banner__logo" />
        )}
        <div className="store-banner__text">
          <span className="store-banner__title">{settings.store_title}</span>
          <span className="store-banner__subtitle">{settings.store_subtitle}</span>
        </div>
      </div>
    </div>
  );
}
