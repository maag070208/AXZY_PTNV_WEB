interface Props {
  value: number;
  title: string;
  subtitle: string;
  action: string;
  onAction?: () => void;
  bg: string;
  color: string;
}

/** Bloque suave: número grande de color, título con subtítulo y enlace subrayado a la derecha. */
export default function AttentionBlock({ value, title, subtitle, action, onAction, bg, color }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: bg }}>
      <b className="min-w-7 shrink-0 text-center text-[24px] font-bold tabular-nums" style={{ color }}>{value}</b>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold leading-tight text-slate-900">{title}</div>
        <div className="truncate text-[12px] text-slate-600">{subtitle}</div>
      </div>
      {onAction && (
        <button type="button" onClick={onAction} className="cursor-pointer text-[13px] font-semibold text-slate-900 underline">
          {action}
        </button>
      )}
    </div>
  );
}
