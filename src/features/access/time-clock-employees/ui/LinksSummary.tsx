import { useEffect, useState } from "react";
import { ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaInfoCircle, FaLink } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { timeClockApi, type TimeClockEmployeesSummary } from "@entities/time-clock";

/**
 * Aviso del reporte de entradas/salidas del reloj: cuántos empleados del reloj
 * están vinculados y qué hacer si falta alguno.
 *
 * Se queda en **una línea** y solo explica el detalle cuando hay algo que
 * corregir: antes decía «0 de 0 vinculados» con un párrafo fijo, aunque no
 * hubiera nada que hacer.
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

  if (!summary) return null;

  const noEmployees = summary.total === 0;
  const pending = summary.withoutLink;
  const allLinked = !noEmployees && pending === 0;
  const icon = allLinked ? <FaCheckCircle size={15} /> : <FaInfoCircle size={15} />;

  return (
    <ITCard tone={allLinked ? "success" : undefined}>
      <ITFlex align="center" wrap="wrap" gap={3}>
        <ITText as="span"
          className={allLinked ? "text-[color:var(--color-success)]" : "text-primary-500"}
          title={t("report.rule")}
        >
          {icon}
        </ITText>
        <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
          <ITText className="text-[12.5px] font-semibold text-slate-800">
            {noEmployees
              ? t("report.noEmployees")
              : allLinked
                ? t("report.allLinked", { total: summary.total })
                : t("report.links", { linkedCount: summary.linkedCount, total: summary.total })}
          </ITText>
          {pending > 0 && (
            <ITText className="text-[11px] text-slate-500">{t("report.withoutLink", { count: pending })}</ITText>
          )}
        </ITFlex>
        <ITButton variant="outlined" color="primary" size="sm" onClick={onGoToLink}>
          <ITFlex align="center" gap={1}>
            <FaLink size={11} />
            <ITText className="font-bold text-[11px]">{t("report.goToLink")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>
    </ITCard>
  );
}
