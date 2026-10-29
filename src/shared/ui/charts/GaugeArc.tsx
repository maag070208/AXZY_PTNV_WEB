import { useId } from "react";

interface Props {
  /** Proporción real 0..1 (se recorta al rango). */
  value: number;
  /** Color de acento del arco. */
  color: string;
  width?: number;
}

/**
 * Semicírculo con pista tenue (el mismo acento al 16 %, visible sobre cualquier fondo) y arco degradado hacia el acento, con puntas
 * redondeadas y una perilla al final. Decorativo: el número real va en el texto.
 */
export default function GaugeArc({ value, color, width = 120 }: Props) {
  const id = useId();
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const stroke = 11;
  const r = (width - stroke) / 2 - 4;
  const cx = width / 2;
  const cy = r + stroke / 2 + 4;
  const height = cy + stroke / 2 + 2;
  // Ángulo: 180° (izquierda) → 0° (derecha) sobre el semicírculo superior.
  const angle = Math.PI * (1 - v);
  const ex = cx + r * Math.cos(angle);
  const ey = cy - r * Math.sin(angle);
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <path d={track} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={stroke} strokeLinecap="round" />
      {v > 0 && <path d={arc} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" />}
      {v > 0 && <circle cx={ex} cy={ey} r={stroke / 2 + 1.5} fill="var(--it-card-bg, #ffffff)" stroke={color} strokeWidth={3} />}
    </svg>
  );
}
