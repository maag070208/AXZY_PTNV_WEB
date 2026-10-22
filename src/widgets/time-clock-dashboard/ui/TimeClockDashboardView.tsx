import { ITButton, ITFlex, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { dateLocale } from "@shared/i18n/format";
import type { ClockAlert, SummaryClock, TimeClockSummary } from "@entities/time-clock";
import { useState } from "react";
import { PersonDetailCard, TimeClockPeopleView } from "@features/access/time-clock-people";
import { TimeClockInspectView } from "@features/access/time-clock-inspect";
import { TimeClockCameraView } from "@features/access/time-clock-camera";
import { timeClockApi, type TimeClockPerson } from "@entities/time-clock";
import { useTimeClockDashboard } from "../model/useTimeClockDashboard";

type Section = "status" | "people" | "events" | "camera";
const ALL_CLOCKS = "all";
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

type HourBucket = { hour: number; count: number; people: Array<{ employeeNumber: string; name: string }> };

const MAX_NAMES_IN_TOOLTIP = 6;

/** Gráfica de checadas por hora: barras, línea y área. Al pasar el cursor muestra quién checó. */
function HourlyChart({ hourly, label }: { hourly: HourBucket[]; label: string }) {
  const { t } = useTranslation("time-clock");
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 640;
  const H = 150;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const rawMax = Math.max(1, ...hourly.map((h) => h.count));
  const step = Math.max(1, Math.ceil(rawMax / 4));
  const max = step * 4;
  const colW = plotW / 24;
  const x = (i: number) => padL + (i + 0.5) * colW;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const barW = colW - 6;
  const line = hourly.map((h, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(h.count).toFixed(1)}`).join(" ");
  const area = `${line} L${x(23).toFixed(1)},${padT + plotH} L${x(0).toFixed(1)},${padT + plotH} Z`;
  const ticks = [0, 1, 2, 3, 4].map((k) => k * step);
  const active = hovered === null ? null : hourly[hovered];
  const hidden = active ? active.people.length - MAX_NAMES_IN_TOOLTIP : 0;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet" className="h-40 w-full" onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="hourly-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
          </g>
        ))}
        {hourly.map((h, i) => (
          <rect key={h.hour} x={x(i) - barW / 2} y={y(h.count)} width={barW} height={padT + plotH - y(h.count)} rx="3"
            fill={hovered === i ? "#334155" : h.count > 0 ? "#0f172a" : "#e2e8f0"} />
        ))}
        <path d={area} fill="url(#hourly-area)" />
        <path d={line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
        {hourly.map((h, i) => (
          <circle key={`d-${h.hour}`} cx={x(i)} cy={y(h.count)} r={h.count > 0 ? 3 : 0} fill="#fff" stroke="#10b981" strokeWidth="2" />
        ))}
        {/* Columnas de captura del cursor: ocupan todo el alto del área de la gráfica. */}
        {hourly.map((h, i) => (
          <rect key={`hit-${h.hour}`} x={padL + i * colW} y={padT} width={colW} height={plotH} fill="transparent"
            onMouseEnter={() => setHovered(i)} />
        ))}
        {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((h) => (
          <text key={`x-${h}`} x={x(h)} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {String(h).padStart(2, "0")}:00
          </text>
        ))}
      </svg>
      {active && active.count > 0 && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-0 z-10 w-56 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg"
          style={{ left: `${Math.min(86, Math.max(14, ((padL + (active.hour + 0.5) * colW) / W) * 100))}%` }}
        >
          <div className="mb-1 font-semibold text-slate-900">
            {String(active.hour).padStart(2, "0")}:00 · {t("dashboard.tooltip.punches", { count: active.count })}
          </div>
          <ul className="flex flex-col gap-0.5 text-slate-600">
            {active.people.slice(0, MAX_NAMES_IN_TOOLTIP).map((p) => (
              <li key={p.employeeNumber} className="truncate">{p.name}</li>
            ))}
          </ul>
          {hidden > 0 && <div className="mt-1 text-slate-400">{t("dashboard.tooltip.more", { count: hidden })}</div>}
        </div>
      )}
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

function ClockCard({ clock, onOpenPerson }: { clock: SummaryClock; onOpenPerson: (serial: string, employeeNumber: string) => void }) {
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
          <HourlyChart hourly={clock.hourly} label={t("dashboard.todayByHour")} />
        </div>
      )}

      {clock.device && (
        <dl className="grid grid-cols-2 gap-3 border-t border-dashed border-slate-200 pt-3 text-xs md:grid-cols-4">
          <div>
            <dt className="text-slate-500">{t("dashboard.device.name")}</dt>
            <dd className="text-slate-800">{clock.device.deviceName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("dashboard.device.firmware")}</dt>
            <dd className="text-slate-800">{clock.device.firmwareVersion ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("dashboard.device.serial")}</dt>
            <dd className="break-all font-mono text-slate-800">{clock.serial}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("dashboard.device.lastRead")}</dt>
            <dd className="text-slate-800">{fmt(clock.lastReadAt)}</dd>
          </div>
        </dl>
      )}

      {clock.recentPunches.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-dashed border-slate-200 pt-3">
          <span className="text-xs font-semibold text-slate-500">{t("dashboard.recentPunches")}</span>
          <ul className="flex flex-col gap-1">
            {clock.recentPunches.map((p, i) => (
              <li key={`${p.occurredAt}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-xs text-slate-500">
                  {new Date(p.occurredAt).toLocaleTimeString(dateLocale(), { hour: "2-digit", minute: "2-digit" })}
                </span>
                {p.employeeNumber ? (
                  <button type="button" onClick={() => onOpenPerson(clock.serial, p.employeeNumber)}
                    className="truncate text-left font-medium text-slate-800 underline-offset-2 hover:underline">
                    {p.name}
                  </button>
                ) : (
                  <span className="text-slate-400">{t("dashboard.unknownPerson")}</span>
                )}
              </li>
            ))}
          </ul>
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
function PeoplePreview({ serial, onSeeAll, onOpenPerson }: { serial: string; onSeeAll: () => void; onOpenPerson: (serial: string, employeeNumber: string) => void }) {
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
            <li key={p.employeeNumber}>
              <button type="button" onClick={() => onOpenPerson(serial, p.employeeNumber)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50">
                <span className="font-medium text-slate-800">{p.name}</span>
                <span className="font-mono text-xs text-slate-400">{p.employeeNumber}</span>
              </button>
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

function Body({ data, visibleClocks, serial, onSeeAll, onOpenPerson }: {
  data: TimeClockSummary;
  visibleClocks: SummaryClock[];
  serial: string;
  onSeeAll: () => void;
  onOpenPerson: (serial: string, employeeNumber: string) => void;
}) {
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

      {serial && <PeoplePreview serial={serial} onSeeAll={onSeeAll} onOpenPerson={onOpenPerson} />}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visibleClocks.map((c) => (
          <ClockCard key={c.serial} clock={c} onOpenPerson={onOpenPerson} />
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
  const [picked, setPicked] = useState(ALL_CLOCKS);
  const [openPerson, setOpenPerson] = useState<{ serial: string; employeeNumber: string } | null>(null);
  const clocks = fx.data?.clocks ?? [];
  const selected = clocks.find((c) => c.serial === picked);
  const serial = selected?.serial ?? clocks.find((c) => c.countsAttendance)?.serial ?? clocks[0]?.serial ?? "";
  const visibleClocks = selected ? [selected] : clocks;

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
          {clocks.length > 0 && (
            <ITSearchSelect
              name="timeClockDashboardClock"
              label={t("dashboard.clock")}
              options={[
                ...(clocks.length > 1 ? [{ value: ALL_CLOCKS, label: t("dashboard.allClocks") }] : []),
                ...clocks.map((c) => ({ value: c.serial, label: c.name ?? c.serial })),
              ]}
              value={selected ? picked : ALL_CLOCKS}
              onChange={(value) => setPicked(String(value))}
              className="min-w-[240px]"
            />
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

      {fx.data && section === "status" && (
        <Body
          data={fx.data}
          visibleClocks={visibleClocks}
          serial={serial}
          onSeeAll={() => setSection("people")}
          onOpenPerson={(serial, employeeNumber) => setOpenPerson({ serial, employeeNumber })}
        />
      )}
      {openPerson && (
        <PersonDetailCard clockSerial={openPerson.serial} employeeNumber={openPerson.employeeNumber} onClose={() => setOpenPerson(null)} />
      )}
      {fx.data && section !== "status" && !serial && <ITText className="text-sm text-slate-400">{t("dashboard.noClocks")}</ITText>}
      {serial && section === "people" && <TimeClockPeopleView clockSerial={serial} />}
      {serial && section === "events" && <TimeClockInspectView clockSerial={serial} tabs={["events"]} />}
      {serial && section === "camera" && <TimeClockCameraView clockSerial={serial} />}
    </ITFlex>
  );
}
