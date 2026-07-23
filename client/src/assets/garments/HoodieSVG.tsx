interface Props {
  color: string;
}

export default function HoodieSVG({ color }: Props) {
  return (
    <svg viewBox="0 0 340 460" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sombra */}
      <path
        d="M50 80L140 20L200 20L290 80L315 430L265 455L75 455L25 430L50 80Z"
        fill="rgba(0,0,0,0.15)"
        transform="translate(6,6)"
      />

      {/* Cuerpo principal */}
      <path
        d="M50 80L140 20L200 20L290 80L315 430L265 455L75 455L25 430L50 80Z"
        fill={color}
      />

      {/* Capucha */}
      <path
        d="M100 25Q170 -15 240 25L230 50Q200 40 170 50Q140 40 110 50Z"
        fill={color}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />

      {/* Forro interior capucha */}
      <path
        d="M110 50Q140 42 170 52Q200 42 230 50"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="2"
        fill="none"
      />

      {/* Cordón izquierdo */}
      <path
        d="M155 38Q148 80 140 110"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="140" cy="112" r="3" fill="rgba(255,255,255,0.15)" />

      {/* Cordón derecho */}
      <path
        d="M185 38Q192 80 200 110"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="200" cy="112" r="3" fill="rgba(255,255,255,0.15)" />

      {/* Costura central */}
      <path
        d="M170 50L170 455"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="1"
      />

      {/* Bolsillo canguro */}
      <path
        d="M100 220Q170 200 240 220L245 280Q170 300 95 280Z"
        fill="rgba(0,0,0,0.06)"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1.5"
      />

      {/* Abertura bolsillo */}
      <path
        d="M120 230Q170 220 220 230"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Puños mangas */}
      <path
        d="M50 80L50 120"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="2"
      />
      <path
        d="M290 80L290 120"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="2"
      />

      {/* Doblado inferior */}
      <path
        d="M75 455L265 455"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="4"
      />

      {/* Luces */}
      <path
        d="M90 150Q170 170 250 150"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="25"
        fill="none"
      />

      {/* Doblado inferior bolsillo */}
      <path
        d="M100 280Q170 298 240 280"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
