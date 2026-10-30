import type { ReactNode } from "react";
import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuUser } from "react-icons/lu";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { WaveFill } from "@shared/ui/charts";
import { KPI_TONES, KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { PanelCard } from "@shared/ui/panel-card";

interface Props {
  title: string;
  /** Ícono de línea del encabezado. */
  icon: ReactNode;
  /** Pantalla completa a la que lleva el botón "↗". */
  to?: string;
  /** Etiqueta accesible del botón "↗" (por defecto "Abrir"). */
  toLabel?: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Ocupa todo el ancho de la cuadrícula. */
  wide?: boolean;
  children: ReactNode;
}

/** Marco común de los widgets del tablero: tarjeta bento con título, botón de abrir, carga y error. */
export default function WidgetCard({ title, icon, to, toLabel, loading, error, onRetry, wide, children }: Props) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  return (
    <PanelCard title={title} icon={icon} onOpen={to ? () => navigate(to) : undefined} openLabel={toLabel} className={wide ? "lg:col-span-2" : ""}>
      {loading && !error ? (
        <ITFlex justify="center" className="py-8">
          <LottieLoader size="sm" />
        </ITFlex>
      ) : error ? (
        <ITFlex direction="column" align="center" gap={2} className="py-6">
          <ITText className="text-[12px] font-bold text-[color:var(--color-danger)]">{t("loadError")}</ITText>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={onRetry}>
            {t("retry")}
          </ITButton>
        </ITFlex>
      ) : (
        children
      )}
    </PanelCard>
  );
}

/**
 * Rejilla de indicadores de un widget: mosaicos de la misma altura que se
 * acomodan al ancho disponible (mínimo 150 px, para que la etiqueta no se
 * recorte). Un widget con más indicadores de los que caben deja el resto en otra
 * fila: mejor recortar el número de mosaicos que apilar uno solo.
 */
export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div className="!grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-stretch gap-2.5">
      {children}
    </div>
  );
}

/**
 * Cifra con etiqueta (indicador de un widget): `KpiTile` compacto. `ratio` (0..1, de un
 * campo real) pinta una ola de fondo en el color del tono; sin proporción real, no se pasa.
 */
export function Metric({
  value,
  label,
  tone = "neutral",
  hint,
  icon,
  ratio,
  onClick,
}: {
  value: ReactNode;
  label: string;
  tone?: KpiTone;
  hint?: string;
  /** Ícono de línea del indicador (le da color y forma al mosaico). */
  icon?: ReactNode;
  ratio?: number;
  onClick?: () => void;
}) {
  return (
    <KpiTile
      size="sm"
      label={label}
      value={value}
      tone={tone}
      hint={hint}
      icon={icon}
      backdrop={ratio !== undefined && ratio > 0 ? <WaveFill level={ratio} color={KPI_TONES[tone].accent} /> : undefined}
      onClick={onClick}
    />
  );
}

/** Subtítulo de una lista dentro de un widget. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 mt-5 text-[13px] font-bold text-slate-700">{children}</div>;
}

/** Texto de lista vacía. */
export function EmptyText({ children }: { children: ReactNode }) {
  return <p className="m-0 py-2 text-[12px] text-slate-500">{children}</p>;
}

/** Contenedor de filas con scroll interno cuando la lista es larga. */
export function RowList({ children, maxHeight = 240 }: { children: ReactNode; maxHeight?: number }) {
  return (
    <div className="-mx-2 overflow-auto" style={{ maxHeight }}>
      {children}
    </div>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Texto o badge a la derecha. */
  right?: ReactNode;
  /** Persona de la fila: pinta su avatar (semilla = nombre). */
  avatarName?: string | null;
  /** Sin persona (p. ej. ticket sin asignar): pinta un hueco con ícono para que las filas queden alineadas. */
  avatarPlaceholder?: boolean;
  onClick?: () => void;
}

/** Fila de lista de un widget: avatar opcional, título, subtítulo tenue y valor a la derecha; sin bordes propios. */
export function ListRow({ title, subtitle, right, avatarName, avatarPlaceholder, onClick }: ListRowProps) {
  const body = (
    <>
      {avatarName ? (
        <ProfileAvatar size="sm" name={avatarName} />
      ) : (
        avatarPlaceholder && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <LuUser size={14} />
          </span>
        )
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-slate-800">{title}</div>
        {subtitle && <div className="truncate text-[11px] text-slate-500">{subtitle}</div>}
      </div>
      {right !== undefined && right !== null && <div className="shrink-0 text-right text-[12px] font-semibold text-slate-600">{right}</div>}
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} cursor-pointer !border-0 !bg-transparent transition hover:!bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
