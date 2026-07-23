export function DesignGeometric({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none">
      <polygon points="100,10 190,80 150,200 50,200 10,80" fill={color} opacity="0.9" />
      <polygon points="100,40 155,85 130,160 70,160 45,85" fill={color} opacity="0.6" />
      <polygon points="100,65 130,92 115,130 85,130 70,92" fill={color} opacity="0.4" />
      <line x1="100" y1="10" x2="100" y2="200" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="10" y1="80" x2="190" y2="80" stroke={color} strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

export function DesignFloral({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none">
      <circle cx="100" cy="110" r="60" fill={color} opacity="0.15" />
      <circle cx="100" cy="110" r="40" fill={color} opacity="0.25" />
      <circle cx="100" cy="110" r="20" fill={color} opacity="0.5" />
      <ellipse cx="60" cy="70" rx="25" ry="15" fill={color} opacity="0.2" transform="rotate(-30 60 70)" />
      <ellipse cx="140" cy="70" rx="25" ry="15" fill={color} opacity="0.2" transform="rotate(30 140 70)" />
      <ellipse cx="60" cy="150" rx="25" ry="15" fill={color} opacity="0.2" transform="rotate(30 60 150)" />
      <ellipse cx="140" cy="150" rx="25" ry="15" fill={color} opacity="0.2" transform="rotate(-30 140 150)" />
      <ellipse cx="100" cy="40" rx="22" ry="14" fill={color} opacity="0.2" />
      <ellipse cx="100" cy="180" rx="22" ry="14" fill={color} opacity="0.2" />
      <circle cx="100" cy="110" r="6" fill={color} opacity="0.7" />
      <path d="M100 20Q110 60 140 70" stroke={color} strokeWidth="1.5" opacity="0.2" fill="none" />
      <path d="M100 20Q90 60 60 70" stroke={color} strokeWidth="1.5" opacity="0.2" fill="none" />
      <path d="M100 200Q110 160 140 150" stroke={color} strokeWidth="1.5" opacity="0.2" fill="none" />
      <path d="M100 200Q90 160 60 150" stroke={color} strokeWidth="1.5" opacity="0.2" fill="none" />
    </svg>
  );
}

export function DesignWave({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none">
      <path
        d="M10 160Q30 120 50 140Q70 160 90 130Q110 100 130 120Q150 140 170 110Q190 80 190 80"
        stroke={color}
        strokeWidth="3"
        opacity="0.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 140Q30 100 50 120Q70 140 90 110Q110 80 130 100Q150 120 170 90Q190 60 190 60"
        stroke={color}
        strokeWidth="2"
        opacity="0.3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 180Q30 140 50 160Q70 180 90 150Q110 120 130 140Q150 160 170 130Q190 100 190 100"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="80" cy="145" r="3" fill={color} opacity="0.4" />
      <circle cx="120" cy="125" r="3" fill={color} opacity="0.4" />
      <circle cx="55" cy="155" r="2.5" fill={color} opacity="0.3" />
      <circle cx="145" cy="115" r="2.5" fill={color} opacity="0.3" />
    </svg>
  );
}

export function DesignTypo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none">
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        opacity="0.9"
        fontFamily="'Bebas Neue',Impact,sans-serif"
        fontSize="90"
        letterSpacing="8"
      >
        RAW
      </text>
      <text
        x="100"
        y="145"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        opacity="0.4"
        fontFamily="system-ui,sans-serif"
        fontSize="13"
        letterSpacing="6"
      >
        EST. 2026
      </text>
      <line x1="40" y1="162" x2="160" y2="162" stroke={color} strokeWidth="1" opacity="0.3" />
      <rect x="30" y="80" width="140" height="90" rx="4" stroke={color} strokeWidth="1" opacity="0.08" fill="none" />
    </svg>
  );
}

export function DesignSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none">
      {/* Montañas */}
      <path
        d="M0 200L40 120L80 160L120 90L160 140L200 100L200 220L0 220Z"
        fill={color}
        opacity="0.4"
      />
      {/* Montañas fondo */}
      <path
        d="M0 200L30 150L70 180L110 120L150 160L200 130L200 220L0 220Z"
        fill={color}
        opacity="0.2"
      />
      {/* Sol */}
      <circle cx="160" cy="80" r="22" fill={color} opacity="0.5" />
      <circle cx="160" cy="80" r="14" fill={color} opacity="0.7" />
      <circle cx="160" cy="80" r="6" fill={color} opacity="0.9" />
      {/* Pájaros */}
      <path d="M50 60Q55 55 60 60" stroke={color} strokeWidth="1.5" opacity="0.4" fill="none" strokeLinecap="round" />
      <path d="M65 50Q70 45 75 50" stroke={color} strokeWidth="1.5" opacity="0.3" fill="none" strokeLinecap="round" />
      <path d="M40 70Q45 65 50 70" stroke={color} strokeWidth="1" opacity="0.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function DesignMandala({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none">
      {/* Anillos exteriores */}
      <circle cx="100" cy="110" r="85" stroke={color} strokeWidth="1" opacity="0.2" />
      <circle cx="100" cy="110" r="75" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <circle cx="100" cy="110" r="65" stroke={color} strokeWidth="1" opacity="0.25" />
      <circle cx="100" cy="110" r="55" stroke={color} strokeWidth="0.5" opacity="0.35" />
      <circle cx="100" cy="110" r="45" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="100" cy="110" r="35" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <circle cx="100" cy="110" r="25" stroke={color} strokeWidth="1" opacity="0.35" />

      {/* Pétalos/picos exteriores */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 110)`}>
          <path
            d="M100 35L108 55L100 65L92 55Z"
            fill={color}
            opacity="0.15"
          />
          <path
            d="M100 65L104 80L100 88L96 80Z"
            fill={color}
            opacity="0.2"
          />
        </g>
      ))}

      {/* Pétalos internos */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <g key={`inner-${angle}`} transform={`rotate(${angle} 100 110)`}>
          <path
            d="M100 65L106 85L100 95L94 85Z"
            fill={color}
            opacity="0.15"
          />
        </g>
      ))}

      {/* Centro */}
      <circle cx="100" cy="110" r="10" fill={color} opacity="0.15" />
      <circle cx="100" cy="110" r="4" fill={color} opacity="0.4" />

      {/* Puntos decorativos anillo medio */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <circle
          key={`dot-${angle}`}
          cx={100 + 55 * Math.cos((angle * Math.PI) / 180)}
          cy={110 + 55 * Math.sin((angle * Math.PI) / 180)}
          r="2.5"
          fill={color}
          opacity="0.25"
        />
      ))}
    </svg>
  );
}
