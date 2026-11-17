import type { ReactNode } from "react";
import { useITBentoCountUp, ITText } from "@axzydev/axzy_ui_system";

/** Número que sube de 0 al valor al montar (mismo comportamiento del inicio). */
export function Num({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const shown = useITBentoCountUp(value, 1200, decimals);
  return <>{decimals > 0 ? shown.toFixed(decimals) : Math.round(shown).toLocaleString("es-MX")}</>;
}

interface Props {
  label: string;
  value: ReactNode;
  /** Color de estado: tiñe el fondo y la etiqueta. */
  color: string;
  /** Abre la pantalla donde se revisa ese número. */
  onClick?: () => void;
  hint?: string;
}

/**
 * Mosaico chico dentro de una tarjeta bento: etiqueta tintada, número grande y
 * fondo suave del mismo color. Si recibe `onClick` se comporta como botón
 * (foco, teclado y realce al pasar el cursor).
 */
export default function MiniStat({ label, value, color, onClick, hint }: Props) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={hint}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative flex min-w-0 flex-col justify-between rounded-[14px] px-3 py-2.5 ${
        onClick ? "cursor-pointer transition-transform hover:-translate-y-0.5" : ""
      }`}
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <ITText className="m-0 text-[11.5px] font-semibold leading-tight" style={{ color: `color-mix(in srgb, ${color} 62%, #0f172a)` }}>
        {label}
      </ITText>
      <ITText className="m-0 mt-2 text-[28px] font-extrabold leading-none tabular-nums text-slate-900">{value}</ITText>
    </div>
  );
}
