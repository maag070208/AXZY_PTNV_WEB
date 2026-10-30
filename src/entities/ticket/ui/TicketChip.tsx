import type { ReactNode } from "react";

export type TicketChipTone = "neutral" | "primary" | "secondary" | "info" | "success" | "warning" | "alert" | "danger";

interface Props {
  label: string;
  tone?: TicketChipTone;
  icon?: ReactNode;
  className?: string;
}

/**
 * Chip pastel de estado/prioridad: fondo del tono al 16 % y texto del mismo
 * tono un poco más oscuro. Usa tokens del tema (sigue modo oscuro y apariencia),
 * sin hex ni mayúsculas.
 */
export default function TicketChip({ label, tone = "neutral", icon, className = "" }: Props) {
  const color = tone === "neutral" ? "var(--color-slate-500)" : `var(--color-${tone})`;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
      style={{
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
        color: `color-mix(in srgb, ${color} 78%, #000)`,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
