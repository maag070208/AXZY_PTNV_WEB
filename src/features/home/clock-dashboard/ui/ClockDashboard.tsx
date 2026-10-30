import { ITBentoFeed, ITBentoGauge, ITBentoGrid, ITBentoPill, ITBentoTile, useITBentoCountUp } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LuClock, LuDoorOpen, LuWrench } from "react-icons/lu";
import type { AccessTodayWidget, SetupGapsWidget } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { formatTimeInTZ } from "@shared/utils/dates";
import { MiniStat, Num } from "@shared/ui/bento-bits";
import { ProfileAvatar } from "@shared/ui/profile-avatar";

interface Props {
  access: AccessTodayWidget | null;
  setup: SetupGapsWidget | null;
}

/** Hueco vacío de una tarjeta: ícono tenue y una línea que explica qué falta. */
function Blank({ text }: { text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center">
      <LuClock size={26} className="opacity-25" />
      <p className="m-0 text-[12px] font-medium" style={{ color: "var(--it-bento-muted)" }}>
        {text}
      </p>
    </div>
  );
}

/**
 * Pestaña **Reloj y accesos** con el mosaico bento del inicio: los pendientes de
 * configuración (números sin vincular, personas sin reloj o sin horario), el
 * resumen de accesos del día con su medidor, quién sigue en sitio y los últimos
 * registros. Cada número abre la pantalla donde se atiende.
 */
export default function ClockDashboard({ access, setup }: Props) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const canAssign = useCan("schedules.view");
  const canLog = useCan("access.log");

  const entries = access?.entries ?? 0;
  const exits = access?.exits ?? 0;
  const onSite = access?.onSite.length ?? 0;
  const insideShare = entries > 0 ? onSite / entries : 0;
  const time = (iso: string) => (access ? formatTimeInTZ(iso, access.timezone) : "");
  const shown = useITBentoCountUp(onSite, 1200);

  const linked = () => navigate("/hr/time-clock/employees");

  return (
    <ITBentoGrid>
      {/* Pendientes de configuración: lo que impide calcular bien la asistencia */}
      <ITBentoTile cols={12} rows={2} wide icon={<LuWrench size={15} />} label={t("setup.title")}>
        <div className="mt-2 grid flex-1 !grid-cols-3 gap-2">
          <MiniStat
            label={t("setup.unlinkedClockNumbers")}
            value={<Num value={setup?.unlinkedClockNumbers ?? 0} />}
            color="var(--color-warning)"
            onClick={linked}
            hint={t("attendance.linkClocks")}
          />
          <MiniStat
            label={t("setup.personalWithoutClock")}
            value={<Num value={setup?.personalWithoutClock ?? 0} />}
            color="var(--color-warning)"
            onClick={linked}
            hint={t("attendance.linkClocks")}
          />
          <MiniStat
            label={t("setup.personalWithoutSchedule")}
            value={<Num value={setup?.personalWithoutSchedule ?? 0} />}
            color="var(--color-warning)"
            onClick={canAssign ? () => navigate("/schedules/assign") : undefined}
            hint={t("setup.assignSchedule")}
          />
        </div>
      </ITBentoTile>

      {/* Accesos de hoy: tarjeta oscura con medidor de quién sigue dentro */}
      <ITBentoTile
        tone="sea"
        cols={4}
        rows={3}
        wide
        icon={<LuDoorOpen size={15} />}
        label={t("access.title")}
        value={<>{Math.round(shown).toLocaleString("es-MX")}</>}
        caption={t("access.ofEntries", { total: entries })}
        onClick={canLog ? () => navigate("/access") : undefined}
      >
        <div className="relative z-[1] my-1 flex min-h-0 flex-1 flex-col justify-center">
          {entries > 0 ? (
            <ITBentoGauge value={insideShare} color="var(--color-warning)" trackColor="rgb(255 255 255 / 0.14)" />
          ) : (
            <p className="m-0 text-center text-[12px] font-medium" style={{ color: "rgba(234,246,248,.6)" }}>
              {t("access.noEntries")}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <ITBentoPill dot="var(--color-success)">{t("access.entries")} {entries}</ITBentoPill>
            <ITBentoPill dot="var(--color-warning)">{t("access.exits")} {exits}</ITBentoPill>
            <ITBentoPill dot="color-mix(in srgb,currentColor 40%,transparent)">{t("access.mine")} {access?.registeredByMe ?? 0}</ITBentoPill>
          </div>
        </div>
      </ITBentoTile>

      {/* Quién sigue en sitio */}
      <ITBentoTile cols={4} rows={3} wide icon={<LuClock size={15} />} label={t("access.onSite")}>
        {onSite === 0 ? (
          <Blank text={t("access.nobodyInside")} />
        ) : (
          <ul className="m-0 mt-2 flex min-h-0 list-none flex-col gap-1.5 overflow-y-auto p-0">
            {access?.onSite.map((p) => (
              <li key={p.employeeId} className="flex items-center gap-2">
                <ProfileAvatar size="sm" name={p.name ?? "—"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold">{p.name ?? "—"}</span>
                  <span className="block truncate text-[11px]" style={{ color: "var(--it-bento-muted)" }}>
                    {p.site ?? "—"}
                  </span>
                </span>
                <span className="shrink-0 text-[11px]" style={{ color: "var(--it-bento-muted)" }}>
                  {t("access.since", { time: time(p.since) })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ITBentoTile>

      {/* Últimos registros del día */}
      <ITBentoTile cols={4} rows={3} wide icon={<LuDoorOpen size={15} />} label={t("access.latest")}>
        {(access?.latest.length ?? 0) === 0 ? (
          <Blank text={t("access.noRecords")} />
        ) : (
          <div className="mt-1 min-h-0 flex-1">
            <ITBentoFeed
              maxHeight={232}
              groups={[
                {
                  key: "today",
                  label: t("attendance.today"),
                  items: (access?.latest ?? []).map((e) => ({
                    id: e.id,
                    icon: <LuDoorOpen size={13} />,
                    title: e.name ?? "—",
                    meta: [time(e.at), e.site].filter(Boolean).join(" · "),
                    tone: e.type === "ENTRY" ? "success" : "violet",
                  })),
                },
              ]}
            />
          </div>
        )}
      </ITBentoTile>
    </ITBentoGrid>
  );
}
