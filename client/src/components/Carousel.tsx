import { useState, useEffect, useCallback } from "react";

const slides = [
  {
    title: "NUEVA\nCOLECCIÓN",
    subtitle: "DISEÑO PROPIO · ALGODÓN ORGÁNICO",
    gradient: "linear-gradient(135deg, #131518 0%, #1e3a5f 50%, #131518 100%)",
  },
  {
    title: "TU ESTILO\nTU FIRMA",
    subtitle: "ESTAMPADOS EXCLUSIVOS · EDICIÓN LIMITADA",
    gradient: "linear-gradient(135deg, #131518 0%, #5f1e2e 50%, #131518 100%)",
  },
  {
    title: "PUREZA\nY FORMA",
    subtitle: "PRENDAS OVERSIZE · CORTE PERFECTO",
    gradient: "linear-gradient(135deg, #131518 0%, #2e5f1e 50%, #131518 100%)",
  },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const goTo = (index: number) => setCurrent(index);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <section
      className="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel__track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide, i) => (
          <div key={i} className="carousel__slide" style={{ background: slide.gradient }}>
            <div className="carousel__content">
              <h2 className="carousel__title">
                {slide.title.split("\n").map((line, j) => (
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
