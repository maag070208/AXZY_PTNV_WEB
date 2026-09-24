import { ITBadget, ITButton, ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaLock, FaSyncAlt } from "react-icons/fa";
import type { ChecadorImportacion, ChecadorStatus } from "@entities/checador";
import { formatFechaHora } from "@shared/utils/dates";
import type { UseChecador } from "../model/useChecador";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";
type Estado = "notConfigured" | "paused" | "running" | "error" | "ok" | "pending";
type EstadoImportacion = "running" | "ok" | "error";

const ESTADO_COLOR: Record<Estado, BadgeColor> = {
  notConfigured: "gray",
  paused: "danger",
  running: "info",
  error: "warning",
  ok: "success",
  pending: "gray",
};

const IMPORTACION_COLOR: Record<EstadoImportacion, BadgeColor> = {
  running: "info",
  ok: "success",
  error: "warning",
};

/** Estado de la sincronización automática (worker de la API). */
const estadoDe = (s: ChecadorStatus): Estado => {
  if (!s.configurado) return "notConfigured";
  if (s.pausadoPorCredenciales) return "paused";
  if (s.enCurso) return "running";
  if (s.ultimaCorrida && !s.ultimaCorrida.ok) return "error";
  return s.dispositivos.some((d) => d.sincronizadoEn) ? "ok" : "pending";
};

const estadoImportacionDe = (i: ChecadorImportacion): EstadoImportacion =>
  !i.finishedAt ? "running" : i.error ? "error" : "ok";

const numero = (n: number): string => n.toLocaleString("es-MX");

/** Día `YYYY-MM-DD` → `DD/MM/AAAA` (es una clave, no un instante). */
const dia = (key: string): string => key.split("-").reverse().join("/");

export default function ChecadorStatusCard({ fx }: { fx: UseChecador }) {
  const { t, status, importando, starting, handleSyncToday } = fx;
  if (!status) return null;

  const estado = estadoDe(status);

  const mensaje = ((): string | null => {
    const progreso = status.enCurso;
    switch (estado) {
      case "notConfigured":
        return t("status.messages.notConfigured");
      case "paused":
        return t("status.messages.paused");
      case "running":
        if (!progreso) return null;
        return progreso.restantes != null
          ? t("status.messages.running", {
              leidos: numero(progreso.leidos),
              nuevas: numero(progreso.nuevas),
              restantes: numero(progreso.restantes),
            })
          : t("status.messages.runningNoTotal", {
              leidos: numero(progreso.leidos),
              nuevas: numero(progreso.nuevas),
            });
      case "error":
        return status.ultimaCorrida?.error ?? null;
      case "pending":
        return t("status.messages.pending");
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

  return (
    <ITCard title={t("status.title")} className="!p-5 border border-slate-200">
      <ITFlex direction="column" gap={3}>
        <ITFlex align="center" wrap="wrap" gap={2}>
          <ITBadget color={ESTADO_COLOR[estado]} size="lg">
            {t(`status.states.${estado}`)}
          </ITBadget>
          {mensaje && <ITText className="text-[12px] text-slate-600">{mensaje}</ITText>}
          <span className="ml-auto" title={t("sync.hint")}>
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
              disabled={importando || starting || !status.configurado}
              onClick={handleSyncToday}
            >
              <ITFlex align="center" gap={1}>
                <FaSyncAlt size={11} className={importando ? "animate-spin" : undefined} />
                <ITText className="font-bold text-[11px]">{t("sync.button")}</ITText>
              </ITFlex>
            </ITButton>
          </span>
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

        {status.dispositivos.map((d) => (
          <ITGrid key={d.dispositivoSerie} container columns={12} spacing={4}>
            <Dato
              label={t("status.device")}
              value={[d.modelo, d.dispositivoSerie].filter(Boolean).join(" · ")}
            />
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
        ))}

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
