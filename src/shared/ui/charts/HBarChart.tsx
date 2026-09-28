interface Row {
  label: string;
  value: number;
}

interface Props {
  rows: Row[];
  /** Color de las barras (una sola magnitud → un solo color). */
  color?: string;
  /** Cuántas barras mostrar; el resto se resume en "+N". */
  max?: number;
  /** Texto de "+N más" (lo traduce quien llama). */
  moreLabel?: (count: number) => string;
  /** Unidad del valor en el detalle al pasar el mouse (p. ej. "personas"). */
  unit?: string;
}

/**
 * Barras horizontales ordenadas de mayor a menor: etiqueta a la izquierda,
 * barra delgada con esquina redondeada y el valor al final. Al pasar el mouse
 * se resalta la fila y muestra el detalle.
 */
export default function HBarChart({ rows, color = "#0D5777", max = 8, moreLabel, unit }: Props) {
  const sorted = [...rows].filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, max);
  const top = shown[0]?.value ?? 0;
  return (
    <div className="flex flex-col gap-1.5">
      {shown.map((r) => (
        <div
          key={r.label}
          className="group grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 rounded px-1 hover:bg-slate-50"
          title={`${r.label}: ${r.value}${unit ? ` ${unit}` : ""}`}
        >
          <span className="truncate text-[10px] font-bold text-slate-600">{r.label}</span>
          <div className="h-2 rounded-r bg-slate-100">
            <div
              className="h-2 rounded-r transition-opacity group-hover:opacity-80"
              style={{ width: `${top ? Math.max((r.value / top) * 100, 2) : 0}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[10px] font-black text-slate-700">{r.value}</span>
        </div>
      ))}
      {sorted.length > max && moreLabel && (
        <span className="px-1 text-[9px] font-bold text-slate-400">{moreLabel(sorted.length - max)}</span>
      )}
    </div>
  );
}
