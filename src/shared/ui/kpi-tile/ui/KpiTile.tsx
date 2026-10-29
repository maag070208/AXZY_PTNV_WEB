import type { ReactNode } from "react";
import { ITCard } from "@axzydev/axzy_ui_system";
import { KPI_TONES, type KpiTone } from "../model/tones";

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  /** Ícono del encabezado (chip redondo con el color de acento); opcional en `size="sm"`. */
  icon?: ReactNode;
  /** Tono pastel de la tarjeta (se mapea al `tone` del kit) y color de acento. */
  tone?: KpiTone;
  /** Texto de contexto, tenue, a la derecha del número. */
  hint?: string;
  /** Contenido bajo el número (p. ej. una barra de progreso); reemplaza al `hint`. */
  footer?: ReactNode;
  /** Visual decorativo al centro (`GaugeArc`, `WaveFill`, `Sparkline`); solo con datos reales. */
  visual?: ReactNode;
  /** Fondo a sangre completa de la tarjeta (p. ej. `WaveFill`); va detrás del contenido y la tarjeta lo recorta. */
  backdrop?: ReactNode;
  /** `sm` = compacto, para contadores pequeños dentro de otra tarjeta. */
  size?: "md" | "sm";
  onClick?: () => void;
}

/**
 * Indicador de tablero: `ITCard` con tono pastel del kit, así que la apariencia
 * (bento, flat o soft) la decide el proveedor: bento = tarjeta pastel sin borde;
 * flat/soft = fondo teñido con borde fino del mismo tono. Título arriba, un
 * visual opcional al centro y abajo el número grande con el contexto tenue.
 * Si es clicable, `ITCard` ya da hover, foco y teclado.
 */
export default function KpiTile({
  label,
  value,
  icon,
  tone = "neutral",
  hint,
  footer,
  visual,
  backdrop,
  size = "md",
  onClick,
}: KpiTileProps) {
  const { kit, accent } = KPI_TONES[tone];
  const sm = size === "sm";
  const valueClass = `font-extrabold leading-none tabular-nums text-slate-800 ${sm ? "!text-[22px]" : "!text-[28px]"}`;
  return (
    <ITCard
      tone={kit}
      onClick={onClick}
      className={`w-full text-left ${sm ? "" : "min-h-[164px]"}`}
      // El cuerpo de `ITCard` fija el padding con estilo en línea: se anula aquí (`!p-0`) y se
      // aplica en el contenedor interno. El primer hijo (ITText) se estira a todo el alto y es
      // el ancla (`relative`) del `backdrop`.
      contentClassName="relative flex flex-1 flex-col !p-0 [&>div]:relative [&>div]:flex [&>div]:flex-1 [&>div]:flex-col"
    >
      {backdrop && <div className="pointer-events-none absolute inset-0">{backdrop}</div>}
      <div className={`relative z-10 flex flex-1 flex-col ${sm ? "gap-1.5 p-3" : "gap-2 p-[18px]"}`}>
        <div className="flex w-full items-center justify-between gap-2">
          <p className={`min-w-0 truncate font-semibold text-slate-800 ${sm ? "!text-[12px]" : "!text-[13px]"}`}>{label}</p>
          {icon && (
            <span
              className={`flex shrink-0 items-center justify-center rounded-full ${sm ? "h-6 w-6" : "h-8 w-8"}`}
              style={{ color: accent, backgroundColor: "color-mix(in srgb, var(--it-card-bg, #ffffff) 70%, transparent)" }}
            >
              {icon}
            </span>
          )}
        </div>
        {visual && <div className="flex min-h-0 flex-1 items-center justify-center">{visual}</div>}
        {!visual && <div className="min-h-1 flex-1" />}
        {footer ? (
          <div className="w-full">
            <p className={valueClass}>{value}</p>
            <div className="mt-2">{footer}</div>
          </div>
        ) : (
          <div className="flex w-full items-baseline justify-between gap-2">
            <p className={valueClass}>{value}</p>
            {hint && <span className="min-w-0 truncate text-right !text-[11px] font-medium text-slate-500">{hint}</span>}
          </div>
        )}
      </div>
    </ITCard>
  );
}
