import { useState, useEffect, useCallback } from "react";
import { getSlides, type CarouselSlide } from "../lib/settings";

export default function Carousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    getSlides().then(setSlides);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goTo = (index: number) => setCurrent(index);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel__track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`carousel__slide carousel__slide--${slide.layout}`}
            style={slide.image_1_url ? {
              backgroundImage: slide.layout === "double"
                ? `url(${slide.image_1_url}), url(${slide.image_2_url})`
                : `url(${slide.image_1_url})`,
              backgroundSize: slide.layout === "double" ? "50% 100%, 50% 100%" : "cover",
              backgroundPosition: slide.layout === "double" ? "left center, right center" : "center",
              backgroundRepeat: "no-repeat",
            } : {
              background: `linear-gradient(135deg, #131518 0%, #1e3a5f 50%, #131518 100%)`,
            }}
          >
            <div className="carousel__content">
              <h2 className="carousel__title">
                {slide.text_overlay.split("\\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j === 0 && <br />}
                  </span>
                ))}
              </h2>
              <p className="carousel__subtitle">{slide.subtitle}</p>
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
          />
        ))}
      </div>
    </section>
  );
}