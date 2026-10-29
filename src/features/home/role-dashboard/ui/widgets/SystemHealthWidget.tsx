import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITBadget } from "@axzydev/axzy_ui_system";
import { LuChevronRight, LuHeartPulse } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDateTime } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import { alarmTone } from "../../model/alarmTone";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/** Una sincronización de reloj con más de este tiempo se marca como atrasada. */
const STALE_SYNC_MS = 2 * 60 * 60 * 1000;

/** Salud del sistema (admin): auditor de inventario, sincronización de relojes y cola de correos. */
export default function SystemHealthWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWidgetData(dashboardApi.systemHealth);
  return (
    <WidgetCard title={t("system.title")} icon={<LuHeartPulse size={16} />} loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <MetricGrid>
            <Metric value={data.failedEmailsLast7Days} label={t("system.failedEmails")} tone={alarmTone(data.failedEmailsLast7Days, "rose")} />
            <Metric value={data.pendingEmails} label={t("system.pendingEmails")} tone={alarmTone(data.pendingEmails, "amber")} />
          </MetricGrid>
          <SectionLabel>{t("system.audit")}</SectionLabel>
          {data.inventoryAudit ? (
            <div className="-mx-2">
              <ListRow
                title={data.inventoryAudit.title}
                subtitle={[data.inventoryAudit.detail, formatDateTime(data.inventoryAudit.at)].filter(Boolean).join(" · ")}
                right={<LuChevronRight size={16} aria-hidden="true" />}
                onClick={() => navigate("/inventory")}
              />
            </div>
          ) : (
            <EmptyText>{t("system.auditNone")}</EmptyText>
          )}
          <SectionLabel>{t("system.clocks")}</SectionLabel>
          <RowList>
            {data.clocks.map((c) => {
              const stale = !c.syncedAt || Date.now() - Date.parse(c.syncedAt) > STALE_SYNC_MS;
              return (
                <ListRow
                  key={c.serialNumber}
                  title={c.name ?? c.serialNumber}
                  subtitle={c.countsAttendance ? undefined : t("system.noAttendance")}
                  right={
                    <ITBadget color={stale ? "warning" : "success"} size="sm">
                      {c.syncedAt ? t("system.lastSync", { when: formatDateTime(c.syncedAt) }) : t("system.neverSynced")}
                    </ITBadget>
                  }
                />
              );
            })}
          </RowList>
        </>
      )}
    </WidgetCard>
  );
}
