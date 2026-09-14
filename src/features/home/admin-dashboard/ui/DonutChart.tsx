interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  size?: number;
}

// Dona simple en SVG inline — no hay librería de gráficas instalada en el
// proyecto y esto es lo único que se necesita (2 gráficas chicas).
export default function DonutChart({ segments, size = 120 }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;

  return (
    <div className="flex items-center gap-4">
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
          segments.map((seg) => {
            if (seg.value === 0) return null;
            const fraction = seg.value / total;
            const dash = fraction * circumference;
            const dashArray = `${dash} ${circumference - dash}`;
            const dashOffset = -offset;
            offset += dash;
            return (
              <circle
                key={seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={12}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${center} ${center})`}
                strokeLinecap="butt"
              />
            );
          })}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-800 font-black"
          style={{ fontSize: size * 0.18 }}
        >
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] font-bold text-slate-500 truncate">{seg.label}</span>
            <span className="text-[10px] font-black text-slate-700 ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
