import { ITBadget, ITButton, ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaCog, FaLock, FaSyncAlt } from "react-icons/fa";
import {
  CLOCK_STATUS_COLOR,
  clockStatus,
  type TimeClockDevice,
  type TimeClockImport,
  type TimeClockState,
  type TimeClockStatus,
} from "@entities/time-clock";
import { formatDateTime } from "@shared/utils/dates";
import type { UseTimeClock } from "../model/useTimeClock";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";
type OverallState = "notConfigured" | "withoutClocks" | TimeClockState;
type ImportStatus = "running" | "ok" | "error";

const STATUS_COLOR: Record<OverallState, BadgeColor> = {
  notConfigured: "gray",
  withoutClocks: "gray",
  ...CLOCK_STATUS_COLOR,
};

const IMPORT_COLOR: Record<ImportStatus, BadgeColor> = {
  running: "info",
  ok: "success",
  error: "warning",
};

/** El estado general es el del reloj que más atención pide. */
const PRIORITY: TimeClockState[] = ["running", "paused", "error", "pending", "ok"];

const statusOf = (s: TimeClockStatus): OverallState => {
  if (!s.configured) return "notConfigured";
  if (s.devices.length === 0) return "withoutClocks";
  const statuses = new Set(s.devices.map(clockStatus));
  return PRIORITY.find((e) => statuses.has(e)) ?? "ok";
};

const importStatusOf = (i: TimeClockImport): ImportStatus =>
  !i.finishedAt ? "running" : i.error ? "error" : "ok";

const number = (n: number): string => n.toLocaleString("es-MX");

/** Día `YYYY-MM-DD` → `DD/MM/AAAA` (es una clave, no un instante). */
const day = (key: string): string => key.split("-").reverse().join("/");

/** Segundos → texto corto para el ETA ("2 h 5 min", "3 min", "45 s"). */
const duration = (seconds: number): string => {
  if (seconds < 60) return `${seconds} s`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
};

interface Props {
  fx: UseTimeClock;
  /** Solo para quien puede administrar los relojes (ADMIN). */
  onManageClocks?: () => void;
}

export default function TimeClockStatusCard({ fx, onManageClocks }: Props) {
  const { t, status, inProgress, progress, importing, starting, handleSyncAll } = fx;
  if (!status) return null;

  const overallState = statusOf(status);

  const message = ((): string | null => {
    switch (overallState) {
      case "notConfigured":
      case "withoutClocks":
      case "paused":
      case "error":
      case "pending":
        return t(`status.messages.${overallState}`);
      case "running": {
        if (!progress) return null;
        if (progress.total == null || progress.missing == null) {
          return t("status.messages.runningNoTotal", {
            readCount: number(progress.readCount),
            newCount: number(progress.newCount),
          });
        }
        const base = t("status.messages.running", {
          readCount: number(progress.readCount),
          total: number(progress.total),
          newCount: number(progress.newCount),
          remaining: number(progress.missing),
        });
        const item = [
          progress.percent != null ? t("sync.percent", { percent: number(progress.percent) }) : null,
          progress.rate != null ? t("sync.speed", { rate: number(Math.round(progress.rate)) }) : null,
          progress.eta != null ? t("sync.eta", { eta: duration(progress.eta) }) : null,
        ]
          .filter((s): s is string => s !== null)
          .join(" · ");
        return item ? `${base} · ${item}` : base;
      }
      default:
        return null;
    }
  })();

  const importJob = status.importJob;
  const importStatus = importJob ? importStatusOf(importJob) : null;
  const importMessage = ((): string | null => {
    if (!importJob) return null;
    const range = { from: day(importJob.from), to: day(importJob.to) };
    if (importStatus === "error") return importJob.error;
    if (importStatus === "ok") {
      return t("import.done", {
        ...range,
        newCount: number(importJob.newCount),
        readCount: number(importJob.readCount),
      });
    }
    return importJob.total != null
      ? t("import.progress", {
          ...range,
          readCount: number(importJob.readCount),
          total: number(importJob.total),
          newCount: number(importJob.newCount),
        })
      : t("import.progressNoTotal", range);
  })();

  /** Detalle de un reloj: su avance, su error o por qué está en pausa. */
  const itemOf = (d: TimeClockDevice): string | null => {
    switch (clockStatus(d)) {
      case "running":
        if (!d.inProgress) return null;
        return d.inProgress.total != null
          ? t("status.clock.running", {
              readCount: number(d.inProgress.readCount),
              total: number(d.inProgress.total),
              newCount: number(d.inProgress.newCount),
            })
          : t("status.clock.runningNoTotal", {
              readCount: number(d.inProgress.readCount),
              newCount: number(d.inProgress.newCount),
            });
      case "paused":
        return t("status.clock.paused");
      case "error":
        return d.lastRun?.error ?? null;
      case "pending":
        return t("status.clock.pending");
      default:
        return null;
    }
  };

  return (
    <ITCard title={t("status.title")} className="!p-5 border border-slate-200">
      <ITFlex direction="column" gap={3}>
        <ITFlex align="center" wrap="wrap" gap={2}>
          <ITBadget color={STATUS_COLOR[overallState]} size="lg">
            {t(`status.states.${overallState}`)}
          </ITBadget>
          {message && <ITText className="text-[12px] text-slate-600">{message}</ITText>}
          <ITFlex align="center" gap={2} className="ml-auto">
            {onManageClocks && (
              <ITButton variant="outlined" color="secondary" size="sm" onClick={onManageClocks}>
                <ITFlex align="center" gap={1}>
                  <FaCog size={11} />
                  <ITText className="font-bold text-[11px]">{t("status.manage")}</ITText>
                </ITFlex>
              </ITButton>
            )}
            <span title={t("sync.hint")}>
              <ITButton
                variant="filled"
                color="primary"
                size="sm"
                disabled={
                  inProgress || importing || starting || !status.configured || status.devices.length === 0
                }
                onClick={handleSyncAll}
              >
                <ITFlex align="center" gap={1}>
                  <FaSyncAlt size={11} className={inProgress || importing ? "animate-spin" : undefined} />
                  <ITText className="font-bold text-[11px]">{t("sync.button")}</ITText>
                </ITFlex>
              </ITButton>
            </span>
          </ITFlex>
        </ITFlex>

        {importJob && importStatus && (
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITBadget color={IMPORT_COLOR[importStatus]} size="lg">
              {t(`import.states.${importStatus}`)}
            </ITBadget>
            {importMessage && (
              <ITText className="text-[12px] text-slate-600">{importMessage}</ITText>
            )}
          </ITFlex>
        )}

        {status.devices.map((d) => {
          const clockState = clockStatus(d);
          const item = itemOf(d);
          return (
            <ITGrid
              key={d.clockSerial}
              container
              columns={12}
              spacing={4}
              className="border-t border-slate-100 pt-3"
            >
              <ITGrid item xs={12} md={3}>
                <ITFlex direction="column" gap={0.5} className="min-w-0">
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("status.device")}
                  </ITText>
                  <ITFlex align="center" wrap="wrap" gap={1}>
                    <ITText className="text-[12px] font-black text-slate-800">{d.name}</ITText>
                    <ITBadget color={CLOCK_STATUS_COLOR[clockState]} size="sm">
                      {t(`status.states.${clockState}`)}
                    </ITBadget>
                  </ITFlex>
                  <ITText className="text-[10px] font-bold text-slate-400 break-words">{d.url}</ITText>
                  {!d.countsAttendance && (
                    <ITText className="text-[10px] font-bold text-slate-500">{t("status.onlyAccess")}</ITText>
                  )}
                  {item && <ITText className="text-[11px] text-slate-600 break-words">{item}</ITText>}
                </ITFlex>
              </ITGrid>
              <Datum label={t("status.punches")} value={number(d.punches)} />
              <Datum
                label={t("status.lastPunch")}
                value={d.lastPunch ? formatDateTime(d.lastPunch) : t("status.empty")}
              />
              <Datum
                label={t("status.lastSync")}
                value={d.syncedAt ? formatDateTime(d.syncedAt) : t("status.empty")}
              />
            </ITGrid>
          );
        })}

        <ITFlex align="center" gap={1}>
          <FaLock size={10} className="text-slate-400" />
          <ITText className="text-[10px] font-bold text-slate-400">{t("status.readOnly")}</ITText>
        </ITFlex>
      </ITFlex>
    </ITCard>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <ITGrid item xs={12} md={3}>
      <ITFlex direction="column" gap={0.5} className="min-w-0">
        <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </ITText>
        <ITText className="text-[12px] font-bold text-slate-800 break-words">{value}</ITText>
      </ITFlex>
    </ITGrid>
  );
}
