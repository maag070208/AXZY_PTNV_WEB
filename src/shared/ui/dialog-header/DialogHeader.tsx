import type { ReactNode } from "react";

export type DialogHeaderTone = "primary" | "secondary" | "ternary" | "success" | "info" | "warning" | "danger";

interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Color del chip: usa `--color-<tone>-soft` de fondo y `--color-<tone>` en el ícono. */
  tone?: DialogHeaderTone;
}

/**
 * Encabezado de modal M2/M3: ícono en chip pastel + título + subtítulo.
 * Va como primer hijo dentro de `ITDialog`.
 */
export default function DialogHeader({ icon, title, subtitle, tone = "primary" }: Props) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[20px]"
        style={{ background: `var(--color-${tone}-soft)`, color: `var(--color-${tone})` }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="m-0 truncate !text-[18px] font-bold leading-tight !text-slate-800">{title}</h2>
        {subtitle && <p className="m-0 mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
