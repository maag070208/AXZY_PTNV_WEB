import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { timeClockApi, type TimeClockInspectOverview } from "@entities/time-clock";
import { dateLocale } from "@shared/i18n/format";
import { TimeClockInspectView } from "@features/access/time-clock-inspect";
import { TimeClockPeopleView } from "@features/access/time-clock-people";
import { TimeClockRosterView } from "@features/access/time-clock-roster";
import ClocksAdminTab from "./tabs/ClocksAdminTab";
import CheckinsTab from "./tabs/CheckinsTab";
import EmployeesTab from "./tabs/EmployeesTab";
import { TimeClockCameraView } from "@features/access/time-clock-camera";
import { useTimeClockPanel, type PanelTab } from "../model/useTimeClockPanel";

const TABS: PanelTab[] = ["overview", "people", "events", "camera", "roster", "employees", "checkins", "clocks"];
// Pestañas que consultan el equipo o escriben en él: solo para quien administra relojes.
const MANAGE_ONLY: PanelTab[] = ["overview", "people", "events", "camera", "clocks"];

/** Un indicador del encabezado. */
function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-[10rem] flex-1 flex-col gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

/** Reloj checador: resumen de indicadores, pestañas y contenido, con un solo selector de reloj. */
export default function TimeClockPanelView() {
  const { t } = useTranslation("time-clock");
  const fx = useTimeClockPanel();
  const serial = fx.serial;
  const canManage = useCan("time_clocks.manage");
  const tabs = TABS.filter((tab) => canManage || !MANAGE_ONLY.includes(tab));
  const current = tabs.includes(fx.tab) ? fx.tab : tabs[0];
  const [overview, setOverview] = useState<TimeClockInspectOverview | null>(null);

  useEffect(() => {
    setOverview(null);
    if (!serial || !canManage) return;
    timeClockApi
      .inspectOverview(serial)
      .then(setOverview)
      .catch(() => setOverview(null));
  }, [serial, canManage]);

  const selected = fx.devices.find((d) => d.clockSerial === serial);
  const fmtTime = (iso: string) => new Date(iso).toLocaleString(dateLocale(), { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-6">
      {/* Barra superior: reloj elegido y estado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label={t("panel.clock")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
            value={serial}
            onChange={(e) => fx.setSerial(e.target.value)}
          >
            {fx.devices.map((d) => (
              <option key={d.clockSerial} value={d.clockSerial}>{d.name}</option>
            ))}
          </select>
          {selected && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {selected.countsAttendance ? t("panel.countsAttendance") : t("panel.noAttendance")}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {overview ? t("panel.readAt", { time: fmtTime(overview.time.localTime) }) : t("panel.noRead")}
        </span>
      </div>

      {/* Indicadores */}
      {canManage && (
        <div className="flex flex-wrap gap-4">
          <Kpi label={t("panel.kpi.device")} value={overview?.device.deviceName ?? "—"} hint={overview?.device.model ?? undefined} />
          <Kpi label={t("panel.kpi.people")} value={String(overview?.counts.userNumber ?? "—")} hint={t("panel.kpi.peopleHint")} />
          <Kpi label={t("panel.kpi.cards")} value={String(overview?.counts.bindCardUserNumber ?? "—")} hint={t("panel.kpi.cardsHint")} />
          <Kpi label={t("panel.kpi.firmware")} value={overview?.device.firmwareVersion ?? "—"} />
        </div>
      )}

      {/* Pestañas tipo inicio: subrayado */}
      <nav role="tablist" className="flex gap-6 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={current === tab}
            onClick={() => fx.setTab(tab)}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition ${
              current === tab
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t(`panel.tabs.${tab}`)}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {!serial && <p className="text-sm text-slate-400">{t("panel.noClocks")}</p>}
        {serial && current === "overview" && <TimeClockInspectView clockSerial={serial} tabs={["overview"]} />}
        {serial && current === "events" && <TimeClockInspectView clockSerial={serial} tabs={["events"]} />}
        {serial && current === "people" && <TimeClockPeopleView clockSerial={serial} />}
        {serial && current === "camera" && <TimeClockCameraView clockSerial={serial} />}
        {current === "roster" && <TimeClockRosterView />}
        {current === "employees" && <EmployeesTab onSeeReport={() => fx.setTab("checkins")} />}
        {current === "checkins" && <CheckinsTab />}
        {current === "clocks" && <ClocksAdminTab />}
      </section>
    </div>
  );
}
