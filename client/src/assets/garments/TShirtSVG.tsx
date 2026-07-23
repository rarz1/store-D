interface Props {
  color: string;
}

export default function TShirtSVG({ color }: Props) {
  return (
    <svg viewBox="0 0 340 440" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sombra */}
      <path
        d="M55 120L145 38L195 38L285 120L310 410L260 430L80 430L30 410L55 120Z"
        fill="rgba(0,0,0,0.15)"
        transform="translate(6,6)"
      />

      {/* Cuerpo principal */}
      <path
        d="M55 120L145 38L195 38L285 120L310 410L260 430L80 430L30 410L55 120Z"
        fill={color}
      />

      {/* Pliegues y costuras */}
      <path
        d="M170 38L170 430"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Cuello */}
      <path
        d="M145 38Q170 70 195 38"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="2.5"
        fill="rgba(0,0,0,0.06)"
      />

      {/* Costura hombro izquierdo */}
      <path
        d="M55 120L145 38"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1.5"
      />

      {/* Costura hombro derecho */}
      <path
        d="M195 38L285 120"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1.5"
      />

      {/* Doblado inferior */}
      <path
        d="M80 430L260 430"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="3"
      />

      {/* Luces/reflejos */}
      <path
        d="M100 140Q170 150 240 140"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="20"
        fill="none"
      />

      {/* Etiqueta decorativa */}
      <rect x="155" y="420" width="30" height="10" rx="1" fill="rgba(0,0,0,0.1)" />
    </svg>
  );
}
