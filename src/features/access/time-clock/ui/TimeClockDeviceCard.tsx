import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ITBadget, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaCircleInfo } from "react-icons/fa6";
import { FaChevronDown, FaChevronUp, FaRedoAlt } from "react-icons/fa";
import {
  CLOCK_STATUS_COLOR,
  clockStatus,
  type TimeClockDevice,
  type TimeClockState,
} from "@entities/time-clock";
import { dateLocale, formatAgo } from "@shared/i18n";
import { formatDateTime, formatTimeInTZ } from "@shared/utils/dates";
import ClockHistoryDialog from "./ClockHistoryDialog";

/** Punto de color del encabezado: el mismo lenguaje que las insignias. */
const DOT: Record<TimeClockState, string> = {
  ok: "bg-emerald-500",
  running: "bg-sky-500",
  error: "bg-rose-500",
  paused: "bg-rose-500",
  pending: "bg-slate-300",
};

/** `https://192.168.1.130` → `192.168.1.130`: el mock muestra solo el host. */
const host = (url: string): string => {
  if (!url) return "";
  try {
    return new URL(url).host || url;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
};

/** `true` si el instante cae hoy (entonces la hora basta y no hace falta la fecha). */
const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const number = (n: number): string => n.toLocaleString(dateLocale());

interface Props {
  device: TimeClockDevice;
  /**
   * Reintentar la conexión. La API solo expone la sincronización de todos los
   * relojes (`POST /time-clock/sync`), así que reintenta con todos: cada uno
   * sigue desde su cursor y el que falló es el que tiene algo que traer.
   */
  onRetry: () => void;
  /** Hay una sincronización en curso (el botón se bloquea). */
  retrying: boolean;
}

/**
 * Un reloj con su estado: encabezado (nombre, host e insignia), el aviso cuando
 * no conecta, sus tres indicadores y el detalle técnico plegable. El color de
 * fondo solo aparece cuando el reloj no conecta, como el resto del sistema.
 */
export default function TimeClockDeviceCard({ device, onRetry, retrying }: Props) {
  const { t } = useTranslation(["time-clock", "common"]);
  const [abierto, setAbierto] = useState(false);
  const [historial, setHistorial] = useState(false);

  const state = clockStatus(device);
  /** No está conectando: el último intento falló o rechazó la contraseña. */
  const desconectado = state === "error" || state === "paused";
  const run = device.lastRun;
  const direccion = host(device.url);

  const alerta =
    state === "paused"
      ? { titulo: t("status.clock.paused"), texto: t("status.messages.paused") }
      : { titulo: t("status.offlineTitle"), texto: t("status.offlineText") };

  const ultimaChecada = device.lastPunch
    ? isToday(device.lastPunch)
      ? formatTimeInTZ(device.lastPunch)
      : formatDateTime(device.lastPunch)
    : t("status.empty");

  const sincronizado = formatAgo("time-clock:status", device.syncedAt) ?? t("status.empty");

  const progreso = device.inProgress
    ? device.inProgress.total != null
      ? t("status.clock.running", {
          readCount: number(device.inProgress.readCount),
          total: number(device.inProgress.total),
          newCount: number(device.inProgress.newCount),
        })
      : t("status.clock.runningNoTotal", { newCount: number(device.inProgress.newCount) })
    : null;

  return (
    <article
      data-testid="clock-card"
      className={`flex h-full flex-col rounded-2xl border p-5 ${
        desconectado ? "border-rose-200 !bg-rose-50" : "border-slate-200 !bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[state]}`} />
            <p className="truncate text-[13px] font-black text-slate-800">{device.name}</p>
          </div>
          {direccion && (
            <p className="mt-1 truncate pl-4 text-[11px] font-bold text-slate-400">{direccion}</p>
          )}
        </div>
        <ITBadget color={CLOCK_STATUS_COLOR[state]} size="sm">
          {t(`status.states.${state}`)}
        </ITBadget>
      </div>

      {desconectado && (
        <div className="mt-4 rounded-xl border border-rose-200 !bg-white p-3">
          <p className="text-[12px] font-black text-rose-700">{alerta.titulo}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{alerta.texto}</p>
          {run?.error && (
            <p className="mt-2 break-words font-mono text-[10px] font-bold text-rose-600">
              {run.error}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 !grid !grid-cols-3 gap-3">
        <Dato label={t("status.lastPunch")} value={ultimaChecada} />
        <Dato label={t("status.lastSync")} value={sincronizado} />
        <Dato label={t("status.punches")} value={number(device.punches)} />
      </div>

      {progreso && <p className="mt-3 text-[11px] break-words text-slate-600">{progreso}</p>}

      {!device.countsAttendance && (
        <p className="mt-2 text-[10px] font-bold text-slate-500">{t("status.onlyAccess")}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        {desconectado && (
          <ITButton variant="outlined" color="secondary" size="sm" disabled={retrying} onClick={onRetry}>
            <ITFlex align="center" gap={1}>
              <FaRedoAlt size={11} className={retrying ? "animate-spin" : undefined} />
              <ITText className="font-bold text-[11px]">{t("status.retry")}</ITText>
            </ITFlex>
          </ITButton>
        )}
        <ITButton variant="text" color="gray" size="sm" className="!px-0" onClick={() => setAbierto((o) => !o)}>
          <ITFlex align="center" gap={1}>
            <FaCircleInfo size={11} />
            <ITText className="text-[10px] font-bold">{t("status.technical")}</ITText>
            {abierto ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
          </ITFlex>
        </ITButton>
      </div>

      {abierto && (
        <div className="mt-3 rounded-xl border border-slate-200 !bg-white p-3">
          <div className="!grid !grid-cols-2 gap-3">
            <Dato
              label={t("status.lastRunAt")}
              value={run?.finishedAt ? formatDateTime(run.finishedAt) : t("status.empty")}
            />
            <Dato
              label={t("status.cursor")}
              value={String(run?.lastSerialNo ?? device.lastSerialNo)}
            />
            <Dato
              label={t("status.readEvents")}
              value={run ? number(run.readCount) : t("status.empty")}
            />
            <Dato
              label={t("status.newPunches")}
              value={run ? number(run.newCount) : t("status.empty")}
            />
          </div>
          <ITButton
            variant="text"
            size="sm"
            className="!px-0 mt-2"
            title={t("history.open")}
            onClick={() => setHistorial(true)}
          >
            <ITFlex align="center" gap={1}>
              <FaCircleInfo size={11} />
              <ITText className="text-[10px] font-bold">{t("history.open")}</ITText>
            </ITFlex>
          </ITButton>
        </div>
      )}

      <ClockHistoryDialog device={historial ? device : null} onClose={() => setHistorial(false)} />
    </article>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-[12px] font-bold break-words text-slate-800">{value}</p>
    </div>
  );
}
