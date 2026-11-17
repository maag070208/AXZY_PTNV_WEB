interface Props {
  label: string;
  value: number;
  color: string;
  /** Fondo suave cuando el chip es una alerta (valor > 0). */
  tint?: string;
  selected?: boolean;
  /** Sin `onClick` el chip es informativo (no es botón). */
  onClick?: () => void;
}

/** Chip compacto: cuadro de color + etiqueta a la izquierda y número en negritas a la derecha. */
export default function StatChip({ label, value, color, tint, selected = false, onClick }: Props) {
  const alert = value > 0 && !!tint;
  const style = {
    background: selected ? `color-mix(in srgb, ${color} 22%, white)` : alert ? tint : "#ffffff",
    border: selected ? `1px solid ${color}` : alert ? "1px solid transparent" : "1px solid #e6eaf0",
  };
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2 text-[13px] text-slate-700">
        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: color }} />
        <span className={`truncate ${selected ? "font-bold text-slate-900" : ""}`}>{label}</span>
      </span>
      <b className="text-[18px] font-bold tabular-nums text-slate-900">{value}</b>
    </>
  );
  const cls = "flex min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left";
  if (!onClick) {
    return (
      <div className={cls} style={style}>
        {body}
      </div>
    );
  }
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`${cls} cursor-pointer`} style={style}>
      {body}
    </button>
  );
}
