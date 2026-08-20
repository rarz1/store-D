import { useState, useEffect, useRef, useCallback } from "react";
import { getSlides, type CarouselSlide } from "../lib/settings";

const AUTOPLAY_MS = 5200;

interface Props {
  variant?: "hero" | "onboarding";
}

export default function Carousel({ variant = "hero" }: Props) {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const reduceMotion = useRef(false);
  const dragX = useRef<number | null>(null);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    getSlides().then((s) => setSlides(s));
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev + 1) % slides.length;
      setProgressKey((k) => k + 1);
      return n;
    });
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev - 1 + slides.length) % slides.length;
      setProgressKey((k) => k + 1);
      return n;
    });
  }, [slides.length]);

  const goTo = (index: number) => {
    setCurrent(index);
    setProgressKey((k) => k + 1);
  };

  useEffect(() => {
    if (isPaused || reduceMotion.current || slides.length === 0) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, next, slides.length]);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    dragX.current = e.clientX;
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (dragX.current === null) return;
    const delta = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) next();
    else prev();
  };

  if (slides.length === 0) return null;

  return (
    <section
      className={`carousel carousel--${variant}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="carousel__track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`carousel__slide carousel__slide--${slide.layout}${i === current ? " carousel__slide--active" : ""}`}
            style={slide.image_1_url ? {
              backgroundImage: slide.layout === "double"
                ? `url(${slide.image_1_url}), url(${slide.image_2_url})`
                : `url(${slide.image_1_url})`,
              backgroundSize: slide.layout === "double" ? "50% 100%, 50% 100%" : "cover",
              backgroundPosition: slide.layout === "double" ? "left center, right center" : "center",
              backgroundRepeat: "no-repeat",
            } : {
              background: "linear-gradient(135deg, #f4f4f5 0%, #000000 60%, #84cc16 100%)",
            }}
          >
            <div className="carousel__shade" />
            <div className="carousel__content" key={i === current ? `active-${current}` : `inactive-${i}`}>
              <h2 className="carousel__title">
                {slide.text_overlay.split("\\n").map((line, j) => (
                  <span key={j} className="carousel__title-line">
                    {line}
                    {j === 0 && <br />}
                  </span>
                ))}
              </h2>
              {slide.subtitle && <p className="carousel__subtitle">{slide.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="carousel__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel__dot${i === current ? " carousel__dot--active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          >
            {i === current && (
              <span className="carousel__dot-progress" key={`p${progressKey}`} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}