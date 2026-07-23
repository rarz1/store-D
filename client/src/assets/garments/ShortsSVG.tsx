interface Props {
  color: string;
}

export default function ShortsSVG({ color }: Props) {
  return (
    <svg viewBox="0 0 340 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sombra */}
      <path
        d="M65 18L275 18L310 360L260 380L80 380L30 360L65 18Z"
        fill="rgba(0,0,0,0.15)"
        transform="translate(6,6)"
      />

      {/* Cuerpo principal */}
      <path
        d="M65 18L275 18L310 360L260 380L80 380L30 360L65 18Z"
        fill={color}
      />

      {/* Cintura */}
      <rect x="65" y="18" width="210" height="22" rx="3" fill="rgba(0,0,0,0.08)" />
      <path
        d="M100 25L240 25"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
      />

      {/* Cordón */}
      <path
        d="M160 22Q155 40 148 48"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M180 22Q185 40 192 48"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        fill="none"
      />

      {/* Costura central */}
      <path
        d="M170 40L170 380"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="1"
      />

      {/* Bolsillo izquierdo */}
      <path
        d="M80 70Q120 65 155 75L155 120Q120 110 80 115Z"
        fill="rgba(0,0,0,0.05)"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />

      {/* Bolsillo derecho */}
      <path
        d="M185 75Q220 65 260 70L260 115Q220 110 185 120Z"
        fill="rgba(0,0,0,0.05)"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />

      {/* Doblado piernas */}
      <path
        d="M80 380L170 375"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="3"
      />
      <path
        d="M170 375L260 380"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="3"
      />

      {/* Luces */}
      <path
        d="M100 100Q170 120 240 100"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="25"
        fill="none"
      />
    </svg>
  );
}
