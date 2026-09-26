import { useEffect, useState } from "react";
import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaInfoCircle, FaLink } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { timeClockApi, type TimeClockEmployeesSummary } from "@entities/time-clock";

/**
 * Aviso del reporte de entradas/salidas del reloj: cuántos empleados del reloj
 * ya están vinculados y cómo se arman las jornadas.
 */
export default function LinksSummary({ onGoToLink }: { onGoToLink: () => void }) {
  const { t } = useTranslation(["time-clock", "common"]);
  const [summary, setSummary] = useState<TimeClockEmployeesSummary | null>(null);

  useEffect(() => {
    let active = true;
    timeClockApi
      .employees({ page: 1, limit: 1, filters: {} })
      .then((res) => {
        if (active) setSummary(res.summary);
      })
      .catch(() => {
        if (active) setSummary(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ITFlex
      align="center"
      wrap="wrap"
      gap={3}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <FaInfoCircle className="shrink-0 text-[#0D5777]" size={16} />
      <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
        {summary && (
          <ITText className="text-[12px] font-black text-slate-800">
            {t("report.links", { linkedCount: summary.linkedCount, total: summary.total })}
            {summary.withoutLink > 0 && (
              <span className="font-bold text-slate-500">
                {" · "}
                {t("report.withoutLink", { count: summary.withoutLink })}
              </span>
            )}
          </ITText>
        )}
        <ITText className="text-[11px] text-slate-500">{t("report.rule")}</ITText>
      </ITFlex>
      <ITButton variant="outlined" color="primary" size="sm" onClick={onGoToLink}>
        <ITFlex align="center" gap={1}>
          <FaLink size={11} />
          <ITText className="font-bold text-[11px]">{t("report.goToLink")}</ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );
}
