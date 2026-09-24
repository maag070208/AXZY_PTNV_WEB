import { ITAlert, ITBadget, ITButton, ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaPen, FaRedo, FaTrashAlt } from "react-icons/fa";
import {
  ESTADO_RELOJ_COLOR,
  estadoDelReloj,
  type ChecadorDispositivo,
  type ChecadorRelojConfig,
} from "@entities/checador";
import { formatFechaHora } from "@shared/utils/dates";
import type { ConfigDeReloj, UseChecadorRelojes } from "../model/useChecadorRelojes";

/** A partir de esta diferencia con el servidor se avisa que el reloj no está en hora. */
const DESFASE_AVISO_S = 60;

const numero = (n: number): string => n.toLocaleString("es-MX");

/** `2026-09-24T13:51:43-07:00` → `24/09/2026 13:51:43 (UTC-07:00)`, tal como lo marca el reloj. */
const horaDelReloj = (iso: string): string => {
  const offset = iso.slice(19);
  const base = `${iso.slice(0, 10).split("-").reverse().join("/")} ${iso.slice(11, 19)}`;
  return offset ? `${base} (UTC${offset === "Z" ? "" : offset})` : base;
};

/** Segundos → "45 s", "3 min 20 s", "2 h 5 min". */
const tiempo = (segundos: number): string => {
  const s = Math.abs(segundos);
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  if (min < 60) return s % 60 ? `${min} min ${s % 60} s` : `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
};

interface Props {
  fx: UseChecadorRelojes;
  reloj: ChecadorDispositivo;
  config: ConfigDeReloj | undefined;
}

/** Un reloj dado de alta: su sincronización y su configuración leída en vivo. */
export default function RelojCard({ fx, reloj, config }: Props) {
  const { t, cargarConfig, abrirEdicion, setBajaTarget } = fx;
  const estado = estadoDelReloj(reloj);

  const detalle = ((): string | null => {
    switch (estado) {
      case "running":
        if (!reloj.enCurso) return null;
        return reloj.enCurso.total != null
          ? t("status.reloj.running", {
              leidos: numero(reloj.enCurso.leidos),
              total: numero(reloj.enCurso.total),
              nuevas: numero(reloj.enCurso.nuevas),
            })
          : t("status.reloj.runningNoTotal", {
              leidos: numero(reloj.enCurso.leidos),
              nuevas: numero(reloj.enCurso.nuevas),
            });
      case "paused":
        return t("status.reloj.paused");
      case "error":
        return reloj.ultimaCorrida?.error ?? null;
      case "pending":
        return t("status.reloj.pending");
      default:
        return null;
    }
  })();

  return (
    <ITCard className="!p-5 border border-slate-200">
      <ITFlex direction="column" gap={4}>
        <ITFlex align="start" wrap="wrap" gap={3}>
          <ITFlex direction="column" gap={1} className="min-w-0">
            <ITFlex align="center" wrap="wrap" gap={2}>
              <ITText className="text-[15px] font-black text-slate-800">{reloj.nombre}</ITText>
              <ITBadget color={ESTADO_RELOJ_COLOR[estado]} size="sm">
                {t(`status.states.${estado}`)}
              </ITBadget>
              <ITBadget color={reloj.asistencia ? "info" : "gray"} variant="outlined" size="sm">
                {reloj.asistencia ? t("relojes.uso.asistencia") : t("relojes.uso.soloAcceso")}
              </ITBadget>
            </ITFlex>
            <ITText className="text-[11px] font-bold text-slate-400 break-words">{reloj.url}</ITText>
            {detalle && <ITText className="text-[12px] text-slate-600 break-words">{detalle}</ITText>}
          </ITFlex>
          <ITFlex align="center" gap={2} className="ml-auto">
            <ITButton
              variant="outlined"
              color="secondary"
              size="sm"
              disabled={config?.cargando}
              onClick={() => void cargarConfig(reloj.dispositivoSerie)}
            >
              <ITFlex align="center" gap={1}>
                <FaRedo size={10} className={config?.cargando ? "animate-spin" : undefined} />
                <ITText className="font-bold text-[11px]">{t("relojes.actions.actualizar")}</ITText>
              </ITFlex>
            </ITButton>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => abrirEdicion(reloj)}>
              <ITFlex align="center" gap={1}>
                <FaPen size={10} />
                <ITText className="font-bold text-[11px]">{t("relojes.actions.editar")}</ITText>
              </ITFlex>
            </ITButton>
            <ITButton variant="outlined" color="danger" size="sm" onClick={() => setBajaTarget(reloj)}>
              <ITFlex align="center" gap={1}>
                <FaTrashAlt size={10} />
                <ITText className="font-bold text-[11px]">{t("relojes.actions.baja")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>

        <Seccion titulo={t("relojes.sync.title")}>
          <Dato label={t("relojes.sync.checadas")} value={numero(reloj.checadas)} />
          <Dato
            label={t("relojes.sync.ultimaChecada")}
            value={reloj.ultimaChecada ? formatFechaHora(reloj.ultimaChecada) : t("status.empty")}
          />
          <Dato
            label={t("relojes.sync.ultimaSync")}
            value={reloj.sincronizadoEn ? formatFechaHora(reloj.sincronizadoEn) : t("status.empty")}
          />
          <Dato label={t("relojes.sync.consecutivo")} value={numero(reloj.ultimoSerialNo)} />
        </Seccion>

        <Seccion
          titulo={t("relojes.config.title")}
          nota={
            config?.data
              ? `${t("relojes.config.hint")} ${t("relojes.config.leidoEn", {
                  hora: new Date(config.data.leidoEn).toLocaleTimeString("es-MX"),
                })}`
              : t("relojes.config.hint")
          }
        >
          {config?.error ? (
            <ITGrid item xs={12}>
              <ITAlert variant="warning">{config.error}</ITAlert>
            </ITGrid>
          ) : config?.data ? (
            <Configuracion fx={fx} reloj={reloj} config={config.data} />
          ) : (
            <ITGrid item xs={12}>
              <ITText className="text-[12px] text-slate-500">{t("relojes.config.cargando")}</ITText>
            </ITGrid>
          )}
        </Seccion>
      </ITFlex>
    </ITCard>
  );
}

function Configuracion({
  fx,
  reloj,
  config,
}: {
  fx: UseChecadorRelojes;
  reloj: ChecadorDispositivo;
  config: ChecadorRelojConfig;
}) {
  const { t } = fx;
  const { dispositivo, hora, personas } = config;
  const modos: Record<string, string> = {
    manual: t("relojes.config.modos.manual"),
    NTP: t("relojes.config.modos.NTP"),
  };
  const desfase = hora?.desfaseSegundos ?? 0;
  const enHora = Math.abs(desfase) < DESFASE_AVISO_S;

  return (
    <>
      <Dato label={t("relojes.config.nombre")} value={dispositivo.nombre ?? t("status.empty")} />
      <Dato label={t("relojes.config.modelo")} value={dispositivo.modelo ?? t("status.empty")} />
      <Dato label={t("relojes.config.firmware")} value={dispositivo.firmware ?? t("status.empty")} />
      <Dato label={t("relojes.config.mac")} value={dispositivo.mac ?? t("status.empty")} />
      <Dato label={t("relojes.config.serie")} value={reloj.dispositivoSerie} md={6} />
      <Dato
        label={t("relojes.config.personas")}
        value={personas ? numero(personas.total) : t("status.empty")}
        detalle={
          personas
            ? t("relojes.config.personasDetalle", {
                conRostro: numero(personas.conRostro),
                conHuella: numero(personas.conHuella),
                conTarjeta: numero(personas.conTarjeta),
              })
            : undefined
        }
        md={6}
      />
      <Dato
        label={t("relojes.config.hora")}
        value={hora ? horaDelReloj(hora.horaLocal) : t("status.empty")}
        md={6}
      />
      <Dato
        label={t("relojes.config.modo")}
        value={hora?.modo ? (modos[hora.modo] ?? hora.modo) : t("status.empty")}
        detalle={hora?.zona ?? undefined}
        md={6}
      />
      {hora && (
        <ITGrid item xs={12}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITBadget color={enHora ? "success" : "warning"} size="lg">
              {enHora
                ? t("relojes.config.enHora")
                : t(desfase > 0 ? "relojes.config.adelantado" : "relojes.config.atrasado", {
                    tiempo: tiempo(desfase),
                  })}
            </ITBadget>
            <ITText className="text-[12px] text-slate-600">
              {enHora
                ? t("relojes.config.enHoraDetalle", { segundos: Math.abs(desfase) })
                : t("relojes.config.desfaseHint")}
            </ITText>
          </ITFlex>
        </ITGrid>
      )}
    </>
  );
}

function Seccion({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <ITFlex direction="column" gap={2} className="border-t border-slate-100 pt-3">
      <ITFlex align="baseline" wrap="wrap" gap={2}>
        <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">{titulo}</ITText>
        {nota && <ITText className="text-[11px] text-slate-400">{nota}</ITText>}
      </ITFlex>
      <ITGrid container columns={12} spacing={4}>
        {children}
      </ITGrid>
    </ITFlex>
  );
}

function Dato({
  label,
  value,
  detalle,
  md = 3,
}: {
  label: string;
  value: string;
  detalle?: string;
  md?: number;
}) {
  return (
    <ITGrid item xs={12} md={md}>
      <ITFlex direction="column" gap={0.5} className="min-w-0">
        <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</ITText>
        <ITText className="text-[12px] font-bold text-slate-800 break-words">{value}</ITText>
        {detalle && <ITText className="text-[11px] text-slate-500 break-words">{detalle}</ITText>}
      </ITFlex>
    </ITGrid>
  );
}
