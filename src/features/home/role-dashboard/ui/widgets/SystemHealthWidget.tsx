import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaHeartbeat } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDateTime } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

/** Una sincronización de reloj con más de este tiempo se marca como atrasada. */
const STALE_SYNC_MS = 2 * 60 * 60 * 1000;

/** Salud del sistema (admin): auditor de inventario, sincronización de relojes y cola de correos. */
export default function SystemHealthWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWidgetData(dashboardApi.systemHealth);
  return (
    <WidgetCard title={t("system.title")} icon={<FaHeartbeat size={13} />} iconClass="bg-rose-700" loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <ITFlex wrap="wrap" gap={2}>
            <Metric value={data.failedEmailsLast7Days} label={t("system.failedEmails")} tone={data.failedEmailsLast7Days ? "text-rose-600" : "text-emerald-700"} />
            <Metric value={data.pendingEmails} label={t("system.pendingEmails")} />
          </ITFlex>
          <SectionLabel>{t("system.audit")}</SectionLabel>
          <button type="button" onClick={() => navigate("/inventory")} className="w-full text-left">
            {data.inventoryAudit ? (
              <>
                <ITText className="text-[11px] font-bold text-slate-800">{data.inventoryAudit.title}</ITText>
                <div className="text-[10px] text-slate-500">
                  {data.inventoryAudit.detail} · {formatDateTime(data.inventoryAudit.at)}
                </div>
              </>
            ) : (
              <ITText className="text-[11px] text-slate-400">{t("system.auditNone")}</ITText>
            )}
          </button>
          <SectionLabel>{t("system.clocks")}</SectionLabel>
          {data.clocks.map((c) => {
            const stale = !c.syncedAt || Date.now() - Date.parse(c.syncedAt) > STALE_SYNC_MS;
            return (
              <ITFlex key={c.serialNumber} align="center" justify="between" className="border-b border-slate-100 py-1">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">{c.name ?? c.serialNumber}</div>
                  {!c.countsAttendance && <div className="text-[9px] uppercase text-slate-400">{t("system.noAttendance")}</div>}
                </div>
                <ITBadget color={stale ? "warning" : "success"} size="sm">
                  {c.syncedAt ? t("system.lastSync", { when: formatDateTime(c.syncedAt) }) : t("system.neverSynced")}
                </ITBadget>
              </ITFlex>
            );
          })}
        </>
      )}
    </WidgetCard>
  );
}
