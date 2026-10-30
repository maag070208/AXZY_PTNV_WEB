import { useTranslation } from "react-i18next";
import { ITBadget } from "@axzydev/axzy_ui_system";
import { LuDoorOpen } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { formatTimeInTZ } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/** Portería: entradas y salidas de hoy, quién sigue dentro y los últimos registros. */
export default function AccessTodayWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const canLog = useCan("access.log");
  const { data, loading, error, reload } = useWidgetData(dashboardApi.accessToday);
  const time = (iso: string) => (data ? formatTimeInTZ(iso, data.timezone) : "");
  return (
    <WidgetCard
      title={t("access.title")}
      icon={<LuDoorOpen size={16} />}
      to={canLog ? "/access" : undefined}
      toLabel={t("access.openLog")}
      loading={loading}
      error={error}
      onRetry={reload}
      wide
    >
      {data && (
        <>
          <MetricGrid>
            <Metric value={data.entries} label={t("access.entries")} tone="emerald" />
            <Metric value={data.exits} label={t("access.exits")} tone="amber" />
            <Metric value={data.onSite.length} label={t("access.onSite")} tone="sky" />
            <Metric value={data.registeredByMe} label={t("access.mine")} />
          </MetricGrid>
          <div className="grid gap-x-8 md:!grid-cols-2">
            <div>
              <SectionLabel>{t("access.onSite")}</SectionLabel>
              {data.onSite.length === 0 ? (
                <EmptyText>{t("empty")}</EmptyText>
              ) : (
                <RowList>
                  {data.onSite.map((p) => (
                    <ListRow
                      key={p.employeeId}
                      avatarName={p.name}
                      title={p.name ?? "—"}
                      subtitle={p.site ?? undefined}
                      right={t("access.since", { time: time(p.since) })}
                    />
                  ))}
                </RowList>
              )}
            </div>
            <div>
              <SectionLabel>{t("access.latest")}</SectionLabel>
              {data.latest.length === 0 ? (
                <EmptyText>{t("empty")}</EmptyText>
              ) : (
                <RowList>
                  {data.latest.map((e) => (
                    <ListRow
                      key={e.id}
                      avatarName={e.name}
                      title={e.name ?? "—"}
                      subtitle={[time(e.at), e.site].filter(Boolean).join(" · ")}
                      right={
                        <ITBadget color={e.type === "ENTRY" ? "success" : "warning"} size="sm">
                          {t(`access.${e.type}`)}
                        </ITBadget>
                      }
                    />
                  ))}
                </RowList>
              )}
            </div>
          </div>
        </>
      )}
    </WidgetCard>
  );
}
