import { useEffect, useState, type ReactNode } from "react";
import { ITButton, ITDialog, ITText } from "@axzydev/axzy_ui_system";
import { LuArrowLeft, LuArrowRight, LuCircleAlert, LuCircleHelp } from "react-icons/lu";
import { Trans, useTranslation } from "react-i18next";
import { DialogHeader } from "@shared/ui/dialog-header";

const PRIMARY = "var(--color-primary)";
const PAGES = ["idea", "how", "errors"] as const;
type Page = (typeof PAGES)[number];

const Circle = ({ children }: { children: ReactNode }) => (
  <span
    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
    style={{ background: PRIMARY }}
  >
    {children}
  </span>
);

/** Ejemplo visual: semana de «Ana» con base Camaristas y descanso el domingo. */
function WeekExample() {
  const { t } = useTranslation("schedules");
  const days = ["Jue", "Vie", "Sáb", "Dom", "Lun", "Mar", "Mié"];
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">{t("roster.help.exampleTitle")}</p>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((d, i) => {
          const over = i === 3;
          return (
            <div key={d} className="grid gap-1 text-center">
              <span className="text-[11px] font-semibold text-slate-500">{d}</span>
              <span
                className={`flex min-h-[40px] min-w-0 items-center justify-center overflow-hidden rounded-lg px-0.5 text-[10px] sm:px-1 sm:text-[11px] leading-tight ${
                  over ? "font-bold" : "italic"
                }`}
                style={
                  over
                    ? { background: "#e2e8f0", color: "#334155", boxShadow: "inset 0 0 0 2px #d99a1e" }
                    : { background: "#f5f5f4", color: "#44403c", border: "1.5px dashed #a8a29e" }
                }
              >
                <span className="hidden sm:inline">{over ? t("roster.rest") : "Camaristas"}</span>
                <span className="sm:hidden">{over ? t("roster.restShort") : "Cam."}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Guía del rol semanal en 3 páginas (idea, cómo hacer un cambio, errores
 * comunes), sin scroll interno; se navega con Anterior / Siguiente.
 */
export default function RosterHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("schedules");
  const [page, setPage] = useState<Page>("idea");
  const rich = { b: <b className="font-semibold text-slate-900" /> };
  const index = PAGES.indexOf(page);
  const last = index === PAGES.length - 1;

  // Cada vez que se abre empieza en la primera página.
  useEffect(() => {
    if (open) setPage("idea");
  }, [open]);

  const tabLabel: Record<Page, string> = {
    idea: t("roster.help.ideaTitle"),
    how: t("roster.help.howTitle"),
    errors: t("roster.help.errorsTitle"),
  };

  const shortLabel: Record<Page, string> = {
    idea: t("roster.help.ideaShort"),
    how: t("roster.help.howShort"),
    errors: t("roster.help.errorsShort"),
  };

  return (
    <ITDialog isOpen={open} onClose={onClose} className="max-h-[calc(100dvh-32px)] w-[min(860px,calc(100vw-32px))] !max-w-none !overflow-y-auto">
      <DialogHeader icon={<LuCircleHelp />} tone="primary" title={t("roster.help.title")} subtitle={t("roster.help.subtitle")} />

      {/* Páginas como pestañas: se ve dónde estás y se puede saltar */}
      <nav role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
        {PAGES.map((p, i) => {
          const on = p === page;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setPage(p)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                on ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: on ? PRIMARY : "#94a3b8" }}
              >
                {i + 1}
              </span>
              <span className="hidden sm:inline">{tabLabel[p]}</span>
              <span className="sm:hidden">{shortLabel[p]}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-h-[340px] text-[14px] leading-relaxed text-slate-600">
        {page === "idea" && (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid content-start gap-2 rounded-xl border border-slate-200 bg-white p-5">
                <span
                  className="w-max rounded-full bg-white px-3 py-0.5 text-[12px] font-semibold"
                  style={{ border: "1.5px dashed #6b7280", color: "#4b5563" }}
                >
                  {t("roster.help.baseTag")}
                </span>
                <strong className="text-[15px] text-slate-900">{t("roster.help.baseTitle")}</strong>
                <p>{t("roster.help.baseText")}</p>
              </div>
              <div className="grid content-start gap-2 rounded-xl border border-slate-200 bg-white p-5">
                <span className="w-max rounded-full px-3 py-0.5 text-[12px] font-semibold" style={{ background: "#fde2e2", color: "#8a2b2b" }}>
                  {t("roster.help.overTag")}
                </span>
                <strong className="text-[15px] text-slate-900">{t("roster.help.overTitle")}</strong>
                <p>{t("roster.help.overText")}</p>
              </div>
            </div>
            <WeekExample />
          </div>
        )}

        {page === "how" && (
          <div className="grid gap-4">
            <p>{t("roster.help.howIntro")}</p>
            <ol className="grid gap-3">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <li key={n} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <Circle>{n}</Circle>
                  <div className="pt-0.5">
                    <Trans t={t} i18nKey={`roster.help.step${n}`} components={rich} />
                  </div>
                </li>
              ))}
            </ol>
            <p className="rounded-xl px-4 py-3 text-[13.5px]" style={{ background: "#e6f3f6", color: "#0a4f5f" }}>
              {t("roster.help.howNote")}
            </p>
          </div>
        )}

        {page === "errors" && (
          <div className="grid gap-3 md:grid-cols-2">
            {([1, 2, 3, 4] as const).map((n) => (
              <div key={n} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <LuCircleAlert size={22} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <Trans t={t} i18nKey={`roster.help.err${n}`} components={rich} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pie: navegación a la izquierda; el asistente flotante vive abajo a la derecha */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
        <ITButton variant="outlined" color="secondary" size="sm" disabled={index === 0} onClick={() => setPage(PAGES[index - 1])}>
          <span className="flex items-center gap-1.5 text-[12px] font-bold">
            <LuArrowLeft size={14} />
            {t("roster.help.prev")}
          </span>
        </ITButton>
        {last ? (
          <ITButton variant="filled" color="primary" size="sm" onClick={onClose}>
            <ITText as="span" className="text-[12px] font-bold !text-white">{t("roster.help.close")}</ITText>
          </ITButton>
        ) : (
          <ITButton variant="filled" color="primary" size="sm" onClick={() => setPage(PAGES[index + 1])}>
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-white">
              {t("roster.help.next")}
              <LuArrowRight size={14} />
            </span>
          </ITButton>
        )}
        <span className="ml-auto text-[12px] text-slate-400">
          {index + 1} / {PAGES.length}
        </span>
      </div>
    </ITDialog>
  );
}
