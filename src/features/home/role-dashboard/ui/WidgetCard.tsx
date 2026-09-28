import type { ReactNode } from "react";
import { ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LottieLoader } from "@shared/ui/lottie-loader";

interface Props {
  title: string;
  icon: ReactNode;
  /** Color del círculo del ícono (clase Tailwind). */
  iconClass?: string;
  /** Liga a la pantalla completa ("Ver todo"). */
  to?: string;
  toLabel?: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Ocupa todo el ancho de la cuadrícula. */
  wide?: boolean;
  children: ReactNode;
}

/** Marco común de los widgets del tablero: título, liga, carga y error. */
export default function WidgetCard({ title, icon, iconClass = "bg-[#0D5777]", to, toLabel, loading, error, onRetry, wide, children }: Props) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  return (
    <ITCard className={`!p-5 border border-slate-200 ${wide ? "lg:col-span-2" : ""}`}>
      <ITFlex align="center" justify="between" gap={2} className="mb-4">
        <ITFlex align="center" gap={2}>
          <ITFlex align="center" justify="center" className={`h-8 w-8 shrink-0 rounded-lg text-white ${iconClass}`}>
            {icon}
          </ITFlex>
          <ITText className="text-[13px] font-black uppercase tracking-wide text-slate-800">{title}</ITText>
        </ITFlex>
        {to && (
          <ITButton variant="text" color="primary" size="sm" onClick={() => navigate(to)}>
            <ITFlex align="center" gap={1}>
              <ITText className="text-[10px] font-bold">{toLabel ?? t("viewAll")}</ITText>
              <FaChevronRight size={9} />
            </ITFlex>
          </ITButton>
        )}
      </ITFlex>
      {loading && !error ? (
        <ITFlex justify="center" className="py-8">
          <LottieLoader size="sm" />
        </ITFlex>
      ) : error ? (
        <ITFlex direction="column" align="center" gap={2} className="py-6">
          <ITText className="text-[11px] font-bold text-rose-600">{t("loadError")}</ITText>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={onRetry}>
            {t("retry")}
          </ITButton>
        </ITFlex>
      ) : (
        children
      )}
    </ITCard>
  );
}

/** Cifra con etiqueta (fila de indicadores de un widget). */
export function Metric({ value, label, tone = "text-slate-800", onClick }: { value: ReactNode; label: string; tone?: string; onClick?: () => void }) {
  const body = (
    <>
      <div className={`text-[22px] font-black leading-none ${tone}`}>{value}</div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="min-w-[90px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100">
      {body}
    </button>
  ) : (
    <div className="min-w-[90px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{body}</div>
  );
}

/** Subtítulo de una lista dentro de un widget. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{children}</div>;
}
