import { useTranslation } from "react-i18next";
import { LuUsers } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import { alarmTone } from "../../model/alarmTone";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/** Plantilla: activos, altas/bajas del mes, cumpleaños, aniversarios y actas del mes. */
export default function PeopleWidget() {
  const { t: tt } = useTranslation(["dashboard", "disciplinary-reports"]);
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(dashboardApi.people);
  const dayLabel = (date: string) => (data && date === data.date ? t("people.today") : formatDate(`${date}T12:00:00Z`));

  const upcoming = (items: Array<{ userId: string; name: string; date: string; extra?: string }>) =>
    items.length === 0 ? (
      <EmptyText>{t("people.noneUpcoming")}</EmptyText>
    ) : (
      <RowList>
        {items.map((i) => (
          <ListRow
            key={`${i.userId}-${i.date}`}
            avatarName={i.name}
            title={i.name}
            right={[dayLabel(i.date), i.extra].filter(Boolean).join(" · ")}
          />
        ))}
      </RowList>
    );

  return (
    <WidgetCard title={t("people.title")} icon={<LuUsers size={16} />} to="/employees" loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <MetricGrid>
            <Metric value={data.active} label={t("people.active")} tone="sky" />
            <Metric value={data.hiresThisMonth} label={t("people.hires")} tone={alarmTone(data.hiresThisMonth, "emerald")} />
            <Metric value={data.departuresThisMonth} label={t("people.departures")} tone={alarmTone(data.departuresThisMonth, "rose")} />
            {data.disciplinaryThisMonth && (
              <Metric value={data.disciplinaryThisMonth.count} label={t("people.disciplinary")} tone={alarmTone(data.disciplinaryThisMonth.count, "amber")} />
            )}
          </MetricGrid>
          <SectionLabel>{t("people.birthdays")}</SectionLabel>
          {upcoming(data.birthdays)}
          <SectionLabel>{t("people.anniversaries")}</SectionLabel>
          {upcoming(data.anniversaries.map((a) => ({ ...a, extra: t("people.years", { count: a.years }) })))}
          {data.disciplinaryThisMonth && data.disciplinaryThisMonth.latest.length > 0 && (
            <>
              <SectionLabel>{t("people.disciplinary")}</SectionLabel>
              <RowList>
                {data.disciplinaryThisMonth.latest.map((r) => (
                  <ListRow
                    key={r.id}
                    avatarName={r.name}
                    title={r.name}
                    subtitle={t(`disciplinary-reports:reasons.${r.reason}`)}
                    right={formatDate(`${r.date}T12:00:00Z`)}
                  />
                ))}
              </RowList>
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
