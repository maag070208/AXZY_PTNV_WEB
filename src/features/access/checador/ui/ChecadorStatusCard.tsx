import { ITBadget, ITButton, ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaCog, FaLock, FaSyncAlt } from "react-icons/fa";
import {
  ESTADO_RELOJ_COLOR,
  estadoDelReloj,
  type ChecadorDispositivo,
  type ChecadorImportacion,
  type ChecadorRelojEstado,
  type ChecadorStatus,
} from "@entities/checador";
import { formatFechaHora } from "@shared/utils/dates";
import type { UseChecador } from "../model/useChecador";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";
type Estado = "notConfigured" | "sinRelojes" | ChecadorRelojEstado;
type EstadoImportacion = "running" | "ok" | "error";

const ESTADO_COLOR: Record<Estado, BadgeColor> = {
  notConfigured: "gray",
  sinRelojes: "gray",
  ...ESTADO_RELOJ_COLOR,
};

const IMPORTACION_COLOR: Record<EstadoImportacion, BadgeColor> = {
  running: "info",
  ok: "success",
  error: "warning",
};

/** El estado general es el del reloj que más atención pide. */
const PRIORIDAD: ChecadorRelojEstado[] = ["running", "paused", "error", "pending", "ok"];

const estadoDe = (s: ChecadorStatus): Estado => {
  if (!s.configurado) return "notConfigured";
  if (s.dispositivos.length === 0) return "sinRelojes";
  const estados = new Set(s.dispositivos.map(estadoDelReloj));
  return PRIORIDAD.find((e) => estados.has(e)) ?? "ok";
};

const estadoImportacionDe = (i: ChecadorImportacion): EstadoImportacion =>
  !i.finishedAt ? "running" : i.error ? "error" : "ok";

const numero = (n: number): string => n.toLocaleString("es-MX");

/** Día `YYYY-MM-DD` → `DD/MM/AAAA` (es una clave, no un instante). */
const dia = (key: string): string => key.split("-").reverse().join("/");

/** Segundos → texto corto para el ETA ("2 h 5 min", "3 min", "45 s"). */
const duracion = (segundos: number): string => {
  if (segundos < 60) return `${segundos} s`;
  const min = Math.round(segundos / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
};

interface Props {
  fx: UseChecador;
  /** Solo para quien puede administrar los relojes (ADMIN). */
  onAdministrarRelojes?: () => void;
}

export default function ChecadorStatusCard({ fx, onAdministrarRelojes }: Props) {
  const { t, status, enCurso, progreso, importando, starting, handleSyncAll } = fx;
  if (!status) return null;

  const estado = estadoDe(status);

  const mensaje = ((): string | null => {
    switch (estado) {
      case "notConfigured":
      case "sinRelojes":
      case "paused":
      case "error":
      case "pending":
        return t(`status.messages.${estado}`);
      case "running": {
        if (!progreso) return null;
        if (progreso.total == null || progreso.faltan == null) {
          return t("status.messages.runningNoTotal", {
            leidos: numero(progreso.leidos),
            nuevas: numero(progreso.nuevas),
          });
        }
        const base = t("status.messages.running", {
          leidos: numero(progreso.leidos),
          total: numero(progreso.total),
          nuevas: numero(progreso.nuevas),
          restantes: numero(progreso.faltan),
        });
        const detalle = [
          progreso.percent != null ? t("sync.percent", { percent: numero(progreso.percent) }) : null,
          progreso.rate != null ? t("sync.speed", { rate: numero(Math.round(progreso.rate)) }) : null,
          progreso.eta != null ? t("sync.eta", { eta: duracion(progreso.eta) }) : null,
        ]
          .filter((s): s is string => s !== null)
          .join(" · ");
        return detalle ? `${base} · ${detalle}` : base;
      }
      default:
        return null;
    }
  })();

  const importacion = status.importacion;
  const estadoImportacion = importacion ? estadoImportacionDe(importacion) : null;
  const mensajeImportacion = ((): string | null => {
    if (!importacion) return null;
    const rango = { desde: dia(importacion.desde), hasta: dia(importacion.hasta) };
    if (estadoImportacion === "error") return importacion.error;
    if (estadoImportacion === "ok") {
      return t("import.done", {
        ...rango,
        nuevas: numero(importacion.nuevas),
        leidos: numero(importacion.leidos),
      });
    }
    return importacion.total != null
      ? t("import.progress", {
          ...rango,
          leidos: numero(importacion.leidos),
          total: numero(importacion.total),
          nuevas: numero(importacion.nuevas),
        })
      : t("import.progressNoTotal", rango);
  })();

  /** Detalle de un reloj: su avance, su error o por qué está en pausa. */
  const detalleDe = (d: ChecadorDispositivo): string | null => {
    switch (estadoDelReloj(d)) {
      case "running":
        if (!d.enCurso) return null;
        return d.enCurso.total != null
          ? t("status.reloj.running", {
              leidos: numero(d.enCurso.leidos),
              total: numero(d.enCurso.total),
              nuevas: numero(d.enCurso.nuevas),
            })
          : t("status.reloj.runningNoTotal", {
              leidos: numero(d.enCurso.leidos),
              nuevas: numero(d.enCurso.nuevas),
            });
      case "paused":
        return t("status.reloj.paused");
      case "error":
        return d.ultimaCorrida?.error ?? null;
      case "pending":
        return t("status.reloj.pending");
      default:
        return null;
    }
  };

  return (
    <ITCard title={t("status.title")} className="!p-5 border border-slate-200">
      <ITFlex direction="column" gap={3}>
        <ITFlex align="center" wrap="wrap" gap={2}>
          <ITBadget color={ESTADO_COLOR[estado]} size="lg">
            {t(`status.states.${estado}`)}
          </ITBadget>
          {mensaje && <ITText className="text-[12px] text-slate-600">{mensaje}</ITText>}
          <ITFlex align="center" gap={2} className="ml-auto">
            {onAdministrarRelojes && (
              <ITButton variant="outlined" color="secondary" size="sm" onClick={onAdministrarRelojes}>
                <ITFlex align="center" gap={1}>
                  <FaCog size={11} />
                  <ITText className="font-bold text-[11px]">{t("status.administrar")}</ITText>
                </ITFlex>
              </ITButton>
            )}
            <span title={t("sync.hint")}>
              <ITButton
                variant="filled"
                color="primary"
                size="sm"
                disabled={
                  enCurso || importando || starting || !status.configurado || status.dispositivos.length === 0
                }
                onClick={handleSyncAll}
              >
                <ITFlex align="center" gap={1}>
                  <FaSyncAlt size={11} className={enCurso || importando ? "animate-spin" : undefined} />
                  <ITText className="font-bold text-[11px]">{t("sync.button")}</ITText>
                </ITFlex>
              </ITButton>
            </span>
          </ITFlex>
        </ITFlex>

        {importacion && estadoImportacion && (
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITBadget color={IMPORTACION_COLOR[estadoImportacion]} size="lg">
              {t(`import.states.${estadoImportacion}`)}
            </ITBadget>
            {mensajeImportacion && (
              <ITText className="text-[12px] text-slate-600">{mensajeImportacion}</ITText>
            )}
          </ITFlex>
        )}

        {status.dispositivos.map((d) => {
          const estadoReloj = estadoDelReloj(d);
          const detalle = detalleDe(d);
          return (
            <ITGrid
              key={d.dispositivoSerie}
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
                    <ITText className="text-[12px] font-black text-slate-800">{d.nombre}</ITText>
                    <ITBadget color={ESTADO_RELOJ_COLOR[estadoReloj]} size="sm">
                      {t(`status.states.${estadoReloj}`)}
                    </ITBadget>
                  </ITFlex>
                  <ITText className="text-[10px] font-bold text-slate-400 break-words">{d.url}</ITText>
                  {!d.asistencia && (
                    <ITText className="text-[10px] font-bold text-slate-500">{t("status.soloAcceso")}</ITText>
                  )}
                  {detalle && <ITText className="text-[11px] text-slate-600 break-words">{detalle}</ITText>}
                </ITFlex>
              </ITGrid>
              <Dato label={t("status.checadas")} value={numero(d.checadas)} />
              <Dato
                label={t("status.lastChecada")}
                value={d.ultimaChecada ? formatFechaHora(d.ultimaChecada) : t("status.empty")}
              />
              <Dato
                label={t("status.lastSync")}
                value={d.sincronizadoEn ? formatFechaHora(d.sincronizadoEn) : t("status.empty")}
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

function Dato({ label, value }: { label: string; value: string }) {
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
