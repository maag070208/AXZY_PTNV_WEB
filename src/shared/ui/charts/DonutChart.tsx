interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  size?: number;
}

/** Separación entre segmentos (px de arco), para que cada uno se distinga sin depender solo del color. */
const GAP = 2;

/**
 * Dona simple en SVG inline (no hay librería de gráficas en el proyecto): total
 * al centro, leyenda con valor y porcentaje, y el detalle de cada segmento al
 * pasar el mouse. Los segmentos deben ser partes de un todo (suman el total).
 */
export default function DonutChart({ segments, size = 128 }: Props) {
  const total = segments.reduce((s, sec) => s + sec.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;

  return (
    <div className="flex items-center gap-5 w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100"
          strokeWidth={12}
        />
        {total > 0 &&
          segments.map((sec) => {
            if (sec.value === 0) return null;
            const fraction = sec.value / total;
            const dash = fraction * circumference;
            const visible = segments.filter((x) => x.value > 0).length > 1 ? Math.max(dash - GAP, 1) : dash;
            const dashArray = `${visible} ${circumference - visible}`;
            const dashOffset = -offset;
            offset += dash;
            return (
              <circle
                key={sec.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={sec.color}
                strokeWidth={12}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${center} ${center})`}
                strokeLinecap="butt"
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${sec.label}: ${sec.value} (${Math.round(fraction * 100)}%)`}</title>
              </circle>
            );
          })}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-700 font-black"
          style={{ fontSize: size * 0.18 }}
        >
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {segments.map((sec) => {
          const pct = total > 0 ? Math.round((sec.value / total) * 100) : 0;
          return (
            <div key={sec.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
              <span className="text-[10px] font-bold text-slate-500 truncate">{sec.label}</span>
              <span className="text-[10px] font-black text-slate-700 ml-auto">
                {sec.value} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}