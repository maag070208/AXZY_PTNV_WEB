import type { ReactNode } from "react";

/** Fila simple: cuadro de color + etiqueta a la izquierda, valor a la derecha, separada por una línea fina. */
export default function DotRow({ label, value, color }: { label: string; value: ReactNode; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-[13px]" style={{ borderTop: "1px solid #eef1f5" }}>
      <span className="flex items-center gap-2 text-slate-700">
        <span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />
        {label}
      </span>
      <b className="font-bold tabular-nums text-slate-900">{value}</b>
    </div>
  );
}
