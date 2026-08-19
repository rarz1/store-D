import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import { getSettings } from "../lib/settings";
import { setMeta } from "../lib/seo";

const FALLBACK_TITLE = "STORE";
const FALLBACK_SUBTITLE = "Personalizá tu estilo. Prendas oversize con diseño propio.";

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [storeTitle, setStoreTitle] = useState(FALLBACK_TITLE);
  const [storeSubtitle, setStoreSubtitle] = useState(FALLBACK_SUBTITLE);

  useEffect(() => {
    setMeta({ title: `${FALLBACK_TITLE} · Bienvenida`, description: FALLBACK_SUBTITLE });
    getSettings().then((s) => {
      if (s?.store_title) setStoreTitle(s.store_title);
      if (s?.store_subtitle) setStoreSubtitle(s.store_subtitle);
    });
  }, []);

  const handleStart = () => {
    localStorage.setItem("onboarding_seen", "1");
    navigate("/colecciones");
  };

  return (
    <div className="onboarding page-enter">
      <Carousel variant="onboarding" />
      <div className="onboarding__overlay">
        <h1 className="onboarding__title">{storeTitle}</h1>
        <p className="onboarding__subtitle">{storeSubtitle}</p>
        <button className="onboarding__cta" onClick={handleStart}>
          Let's Start
        </button>
      </div>
    </div>
  );
}