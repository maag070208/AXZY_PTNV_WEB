import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { dateLocale } from "@shared/i18n/format";
import type { ClockAlert, SummaryClock, TimeClockSummary } from "@entities/time-clock";
import { useState } from "react";
import { TimeClockPeopleView } from "@features/access/time-clock-people";
import { TimeClockInspectView } from "@features/access/time-clock-inspect";
import { TimeClockCameraView } from "@features/access/time-clock-camera";
import { timeClockApi, type TimeClockPerson } from "@entities/time-clock";
import { useTimeClockDashboard } from "../model/useTimeClockDashboard";

type Section = "status" | "people" | "events" | "camera";
const SECTIONS: Section[] = ["status", "people", "events", "camera"];

const CONNECTION_TONE: Record<SummaryClock["connection"], string> = {
  ONLINE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NO_RESPONSE: "bg-red-50 text-red-700 border-red-200",
  PAUSED_CREDENTIALS: "bg-red-50 text-red-700 border-red-200",
  NOT_READ: "bg-slate-100 text-slate-600 border-slate-200",
};

const SEVERITY_TONE: Record<ClockAlert["severity"], string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

/** Indicador grande del encabezado. */
function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-[10rem] flex-1 flex-col gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

/** Barras de checadas por hora (solo entradas y salidas que cuentan para asistencia). */
function HourlyBars({ hourly, label }: { hourly: Array<{ hour: number; count: number }>; label: string }) {
  const max = Math.max(1, ...hourly.map((h) => h.count));
  return (
    <div className="flex flex-col gap-2" role="img" aria-label={label}>
      <div className="flex h-24 items-end gap-[3px]">
        {hourly.map((h) => (
          <div
            key={h.hour}
            title={`${String(h.hour).padStart(2, "0")}:00 · ${h.count}`}
            className={`flex-1 rounded-t ${h.count > 0 ? "bg-slate-900" : "bg-slate-100"}`}
            style={{ height: `${Math.max(4, (h.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

function AlertLine({ alert }: { alert: ClockAlert }) {
  const { t } = useTranslation("time-clock");
  return (
    <li className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2 text-sm ${SEVERITY_TONE[alert.severity]}`}>
      <span>{t(`dashboard.alerts.${alert.code}`)}</span>
      {alert.count !== undefined && <span className="font-semibold">{alert.count}</span>}
    </li>
  );
}

function ClockCard({ clock }: { clock: SummaryClock }) {
  const { t } = useTranslation("time-clock");
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(dateLocale(), { dateStyle: "medium", timeStyle: "short" }) : t("dashboard.never");
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{clock.name ?? clock.serial}</span>
          <span className="text-xs text-slate-400">
            {clock.device?.model ?? "—"} · {clock.countsAttendance ? t("dashboard.counts") : t("dashboard.noCounts")}
          </span>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${CONNECTION_TONE[clock.connection]}`}>
          {t(`dashboard.connection.${clock.connection}`)}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">{t("dashboard.people")}</dt>
          <dd className="font-semibold text-slate-900">{clock.counts?.people ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t("dashboard.cards")}</dt>
          <dd className="font-semibold text-slate-900">{clock.counts?.cards ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t("dashboard.punchesToday")}</dt>
          <dd className="font-semibold text-slate-900">{clock.punchesToday}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t("dashboard.lastSync")}</dt>
          <dd className="text-slate-700">{fmt(clock.lastSyncAt)}</dd>
        </div>
      </dl>

      {clock.countsAttendance && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500">{t("dashboard.todayByHour")}</span>
          <HourlyBars hourly={clock.hourly} label={t("dashboard.todayByHour")} />
        </div>
      )}

      {clock.alerts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {clock.alerts.map((a) => (
            <AlertLine key={a.code} alert={a} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Vista previa del personal: se pide al reloj solo cuando el usuario lo pide. */
function PeoplePreview({ serial, onSeeAll }: { serial: string; onSeeAll: () => void }) {
  const { t } = useTranslation("time-clock");
  const [people, setPeople] = useState<TimeClockPerson[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = () => {
    setLoading(true);
    setError(null);
    timeClockApi
      .peopleList(serial)
      .then((r) => setPeople(r.people))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-900">{t("dashboard.personnel.title")}</span>
        <div className="flex gap-2">
          <button type="button" onClick={show} disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {people ? t("dashboard.personnel.refresh") : t("dashboard.personnel.show")}
          </button>
          <button type="button" onClick={onSeeAll}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
            {t("dashboard.personnel.seeAll")}
          </button>
        </div>
      </header>
      {loading && <p className="text-xs text-slate-400">{t("dashboard.personnel.loading")}</p>}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {people && people.length === 0 && <p className="text-xs text-slate-400">{t("dashboard.personnel.empty")}</p>}
      {people && people.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {people.slice(0, 10).map((p) => (
            <li key={p.employeeNumber} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
              <span className="font-medium text-slate-800">{p.name}</span>
              <span className="font-mono text-xs text-slate-400">{p.employeeNumber}</span>
            </li>
          ))}
        </ul>
      )}
      {people && people.length > 10 && (
        <p className="text-xs text-slate-400">{t("dashboard.personnel.more", { count: people.length - 10 })}</p>
      )}
    </section>
  );
}

function Body({ data, onSeeAll }: { data: TimeClockSummary; onSeeAll: () => void }) {
  const { t } = useTranslation("time-clock");
  const online = data.clocks.filter((c) => c.connection === "ONLINE").length;
  const people = data.clocks.reduce((sum, c) => sum + (c.counts?.people ?? 0), 0);
  const punches = data.clocks.filter((c) => c.countsAttendance).reduce((sum, c) => sum + c.punchesToday, 0);
  const alertCount = data.alerts.length + data.clocks.reduce((sum, c) => sum + c.alerts.length, 0);

  return (
    <ITFlex direction="column" gap={6}>
      <div className="flex flex-wrap gap-4">
        <Kpi label={t("dashboard.kpi.online")} value={`${online} / ${data.clocks.length}`} hint={t("dashboard.kpi.onlineHint")} />
        <Kpi label={t("dashboard.kpi.people")} value={String(people)} hint={t("dashboard.kpi.peopleHint")} />
        <Kpi label={t("dashboard.kpi.punches")} value={String(punches)} hint={t("dashboard.kpi.punchesHint")} />
        <Kpi label={t("dashboard.kpi.alerts")} value={String(alertCount)} hint={t("dashboard.kpi.alertsHint")} />
      </div>

      {(data.alerts.length > 0 || data.clocks.some((c) => c.alerts.length > 0)) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-slate-800">{t("dashboard.alertsTitle")}</h2>
          <ul className="flex flex-col gap-2">
            {data.alerts.map((a) => (
              <AlertLine key={`g-${a.code}`} alert={a} />
            ))}
          </ul>
        </section>
      )}

      {data.clocks.find((c) => c.countsAttendance) && (
        <PeoplePreview serial={data.clocks.find((c) => c.countsAttendance)!.serial} onSeeAll={onSeeAll} />
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.clocks.map((c) => (
          <ClockCard key={c.serial} clock={c} />
        ))}
        {data.clocks.length === 0 && <p className="text-sm text-slate-400">{t("dashboard.noClocks")}</p>}
      </section>
    </ITFlex>
  );
}

/** Dashboard del reloj: Estado (todos los relojes) y secciones por reloj: personas, eventos y cámara. */
export default function TimeClockDashboardView() {
  const { t } = useTranslation("time-clock");
  const fx = useTimeClockDashboard();
  const [section, setSection] = useState<Section>("status");
  const [picked, setPicked] = useState("");
  const clocks = fx.data?.clocks ?? [];
  const serial = clocks.some((c) => c.serial === picked) ? picked : (clocks[0]?.serial ?? "");

  return (
    <ITFlex direction="column" gap={5}>
      <ITFlex align="center" justify="between" gap={3} wrap="wrap">
        <nav role="tablist" className="flex gap-6 overflow-x-auto border-b border-slate-200">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={section === s}
              onClick={() => setSection(s)}
              className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition ${
                section === s ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t(`dashboard.sections.${s}`)}
            </button>
          ))}
        </nav>
        <ITFlex align="center" gap={3}>
          {section !== "status" && clocks.length > 0 && (
            <select
              aria-label={t("dashboard.clock")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              value={serial}
              onChange={(e) => setPicked(e.target.value)}
            >
              {clocks.map((c) => (
                <option key={c.serial} value={c.serial}>{c.name ?? c.serial}</option>
              ))}
            </select>
          )}
          {section === "status" && (
            <ITText className="text-xs text-slate-400">
              {fx.data ? t("dashboard.generatedAt", { time: new Date(fx.data.generatedAt).toLocaleTimeString(dateLocale()) }) : ""}
            </ITText>
          )}
          <ITButton variant="outlined" color="secondary" size="sm" disabled={fx.loading} onClick={fx.reload}>
            {t("dashboard.refresh")}
          </ITButton>
        </ITFlex>
      </ITFlex>

      {fx.error && <ITText role="alert" className="text-sm text-red-600">{fx.error}</ITText>}
      {fx.loading && !fx.data && <ITText className="text-sm text-slate-400">{t("dashboard.loading")}</ITText>}

      {fx.data && section === "status" && <Body data={fx.data} onSeeAll={() => setSection("people")} />}
      {fx.data && section !== "status" && !serial && <ITText className="text-sm text-slate-400">{t("dashboard.noClocks")}</ITText>}
      {serial && section === "people" && <TimeClockPeopleView clockSerial={serial} />}
      {serial && section === "events" && <TimeClockInspectView clockSerial={serial} tabs={["events"]} />}
      {serial && section === "camera" && <TimeClockCameraView clockSerial={serial} />}
    </ITFlex>
  );
}
