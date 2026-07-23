import { useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import { GARMENTS } from "../data/garments";

const iconMap: Record<string, string> = {
  remeras: "M55 120L145 38L195 38L285 120L310 410L260 430L80 430L30 410Z",
  pantalones: "M65 18L275 18L310 360L260 380L80 380L30 360Z",
  buzos: "M50 80L140 20L200 20L290 80L315 430L265 455L75 455L25 430Z",
};

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <Carousel />

      <section className="categories">
        <div className="categories__header">
          <h2 className="categories__title">COLECCIONES</h2>
          <p className="categories__subtitle">Elegí tu prenda y personalizala a tu gusto</p>
        </div>

        <div className="categories__grid">
          {GARMENTS.map((g) => (
            <button
              key={g.id}
              className="category-card"
              onClick={() => navigate(`/producto/${g.id}`)}
            >
              <div className="category-card__icon">
                <svg viewBox="0 0 340 440" fill="none" width="100" height="130">
                  <path d={iconMap[g.id]} fill="var(--accent)" opacity="0.85" />
                  <path
                    d={iconMap[g.id]}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                </svg>
              </div>
              <div className="category-card__info">
                <h3 className="category-card__name">{g.name}</h3>
                <p className="category-card__desc">{g.description}</p>
                <span className="category-card__price">
                  Desde ${g.basePrice.toLocaleString("es-AR")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
