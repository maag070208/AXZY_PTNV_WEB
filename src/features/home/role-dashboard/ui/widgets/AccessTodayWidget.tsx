import { useTranslation } from "react-i18next";
import { ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaDoorOpen } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { formatTimeInTZ } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

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
      icon={<FaDoorOpen size={13} />}
      iconClass="bg-[#0D5777]"
      to={canLog ? "/access" : undefined}
      toLabel={t("access.openLog")}
      loading={loading}
      error={error}
      onRetry={reload}
      wide
    >
      {data && (
        <>
          <ITFlex wrap="wrap" gap={2}>
            <Metric value={data.entries} label={t("access.entries")} tone="text-emerald-700" />
            <Metric value={data.exits} label={t("access.exits")} tone="text-amber-600" />
            <Metric value={data.onSite.length} label={t("access.onSite")} tone="text-[#0D5777]" />
            <Metric value={data.registeredByMe} label={t("access.mine")} />
          </ITFlex>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <SectionLabel>{t("access.onSite")}</SectionLabel>
              {data.onSite.length === 0 ? (
                <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
              ) : (
                <div className="max-h-[220px] overflow-auto">
                  {data.onSite.map((p) => (
                    <ITFlex key={p.employeeId} justify="between" className="border-b border-slate-100 py-1">
                      <ITText className="text-[11px] font-bold text-slate-800">{p.name ?? "—"}</ITText>
                      <ITText className="text-[10px] text-slate-500">{[t("access.since", { time: time(p.since) }), p.site].filter(Boolean).join(" · ")}</ITText>
                    </ITFlex>
                  ))}
                </div>
              )}
            </div>
            <div>
              <SectionLabel>{t("access.latest")}</SectionLabel>
              {data.latest.length === 0 ? (
                <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
              ) : (
                data.latest.map((e) => (
                  <ITFlex key={e.id} align="center" justify="between" className="border-b border-slate-100 py-1">
                    <ITFlex align="center" gap={2}>
                      <ITBadget color={e.type === "ENTRY" ? "success" : "warning"} size="sm">{t(`access.${e.type}`)}</ITBadget>
                      <ITText className="text-[11px] font-bold text-slate-800">{e.name ?? "—"}</ITText>
                    </ITFlex>
                    <ITText className="text-[10px] text-slate-500">{[time(e.at), e.site].filter(Boolean).join(" · ")}</ITText>
                  </ITFlex>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </WidgetCard>
  );
}
