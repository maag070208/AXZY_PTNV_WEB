import { useTranslation } from "react-i18next";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaUsers } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

/** Plantilla: activos, altas/bajas del mes, cumpleaños, aniversarios y actas del mes. */
export default function PeopleWidget() {
  const { t: tt } = useTranslation(["dashboard", "disciplinary-reports"]);
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(dashboardApi.people);
  const dayLabel = (date: string) => (data && date === data.date ? t("people.today") : formatDate(`${date}T12:00:00Z`));

  const upcoming = (items: Array<{ userId: string; name: string; date: string; extra?: string }>) =>
    items.length === 0 ? (
      <ITText className="text-[11px] text-slate-400">{t("people.noneUpcoming")}</ITText>
    ) : (
      items.map((i) => (
        <ITFlex key={`${i.userId}-${i.date}`} justify="between" className="border-b border-slate-100 py-1">
          <ITText className="text-[11px] font-bold text-slate-800">{i.name}</ITText>
          <ITText className="text-[10px] font-bold text-slate-500">{[dayLabel(i.date), i.extra].filter(Boolean).join(" · ")}</ITText>
        </ITFlex>
      ))
    );

  return (
    <WidgetCard title={t("people.title")} icon={<FaUsers size={14} />} to="/employees" loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <ITFlex wrap="wrap" gap={2}>
            <Metric value={data.active} label={t("people.active")} />
            <Metric value={data.hiresThisMonth} label={t("people.hires")} tone="text-emerald-700" />
            <Metric value={data.departuresThisMonth} label={t("people.departures")} tone="text-rose-600" />
            {data.disciplinaryThisMonth && (
              <Metric value={data.disciplinaryThisMonth.count} label={t("people.disciplinary")} tone="text-amber-600" />
            )}
          </ITFlex>
          <SectionLabel>{t("people.birthdays")}</SectionLabel>
          {upcoming(data.birthdays)}
          <SectionLabel>{t("people.anniversaries")}</SectionLabel>
          {upcoming(data.anniversaries.map((a) => ({ ...a, extra: t("people.years", { count: a.years }) })))}
          {data.disciplinaryThisMonth && data.disciplinaryThisMonth.latest.length > 0 && (
            <>
              <SectionLabel>{t("people.disciplinary")}</SectionLabel>
              {data.disciplinaryThisMonth.latest.map((r) => (
                <ITFlex key={r.id} justify="between" className="border-b border-slate-100 py-1">
                  <ITText className="text-[11px] font-bold text-slate-800">{r.name}</ITText>
                  <ITText className="text-[10px] font-bold text-slate-500">
                    {t(`disciplinary-reports:reasons.${r.reason}`)} · {formatDate(`${r.date}T12:00:00Z`)}
                  </ITText>
                </ITFlex>
              ))}
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
