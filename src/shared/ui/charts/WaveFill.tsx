interface Props {
  /** Nivel real 0..1 (se recorta al rango). */
  level: number;
  /** Color de acento de la ola. */
  color: string;
}

/** Tope de altura (% del recuadro) para que la ola nunca tape el título de la tarjeta. */
const MAX_HEIGHT_PCT = 65;
const MIN_HEIGHT_PCT = 14;

/**
 * Ola de fondo a todo el ancho del recuadro (se usa como `backdrop` de `KpiTile`):
 * dos capas suaves en el color de acento, con altura proporcional a `level`.
 * Decorativa: el número real va en el texto. Ocupa el 100 % del ancho y se ancla
 * abajo; el padre debe ser un contenedor con alto definido.
 */
export default function WaveFill({ level, color }: Props) {
  const v = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  if (v === 0) return null;
  const heightPct = MIN_HEIGHT_PCT + v * (MAX_HEIGHT_PCT - MIN_HEIGHT_PCT);
  // Lienzo 200x100 estirado con `preserveAspectRatio="none"`.
  const wave = (top: number, amp: number, phase: number) =>
    `M 0 ${top + phase} C 33 ${top - amp} 66 ${top + amp} 100 ${top + phase} S 167 ${top - amp} 200 ${top + phase} L 200 100 L 0 100 Z`;
  return (
    <div className="absolute inset-x-0 bottom-0" style={{ height: `${heightPct}%` }} aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none" className="block">
        <path d={wave(14, 9, 5)} fill={color} fillOpacity={0.18} />
        <path d={wave(14, -9, 0)} fill={color} fillOpacity={0.32} />
      </svg>
    </div>
  );
}
