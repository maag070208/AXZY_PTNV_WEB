interface Bar {
  label: string;
  value: number;
  color: string;
}

interface Props {
  bars: Bar[];
}

// Barras horizontales simples en SVG/CSS inline — mismo motivo que DonutChart.
export default function BarChart({ bars }: Props) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 w-24 shrink-0 truncate">{b.label}</span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color }}
            />
          </div>
          <span className="text-[10px] font-black text-slate-700 w-6 text-right shrink-0">{b.value}</span>
        </div>
      ))}
    </div>
  );
}
