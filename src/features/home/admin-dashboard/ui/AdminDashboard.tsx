import { useNavigate } from "react-router-dom";
import {
  ITBentoDonut,
  ITBentoFeed,
  ITBentoGauge,
  ITBentoGrid,
  ITBentoPill,
  ITBentoSegments,
  ITBentoTile,
  ITBentoWaves,
  ITBentoWeekBars,
  useITBentoCountUp,
} from "@axzydev/axzy_ui_system";
import {
  LuBox,
  LuChartPie,
  LuActivity,
  LuClock,
  LuFileText,
  LuListChecks,
  LuTicket,
  LuTrash2,
} from "react-icons/lu";
import { formatDate, formatTimeInTZ } from "@shared/utils/dates";
import type { DashboardActivity } from "@entities/dashboard";
import type { UseAdminDashboard } from "../model/useAdminDashboard";
import { activityHref } from "../model/activityLinks";
import { seriesColor } from "@shared/ui/charts";
import { InsightNote } from "@shared/ui/bento-bits";

const SCOPE_ICON: Record<DashboardActivity["scope"], React.ReactNode> = {
  devices: <LuBox size={13} />,
  tickets: <LuTicket size={13} />,
  custodyLetters: <LuFileText size={13} />,
  materialOutputs: <LuTrash2 size={13} />,
  inventory: <LuFileText size={13} />,
};

/** Número grande de una tarjeta: sube de 0 al valor al montar. */
function Big({ value, decimals = 0, suffix }: { value: number; decimals?: number; suffix?: string }) {
  const shown = useITBentoCountUp(value, 1400, decimals);
  return (
    <>
      {decimals > 0 ? shown.toFixed(decimals) : Math.round(shown).toLocaleString("es-MX")}
      {suffix}
    </>
  );
}

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Panel de operación del inicio (`dashboard.view`) con el mosaico bento: una
 * tarjeta principal oscura con medidor, olas para las cartas, el avance de tareas
 * en segmentos, la eficiencia del equipo y la actividad reciente. Solo datos
 * reales del resumen; si una proporción es cero, el visual no se dibuja.
 */
export default function AdminDashboard({ fx }: { fx: UseAdminDashboard }) {
  const { t, summary, activity, error } = fx;
  const navigate = useNavigate();

  if (!summary) return null;

  const avgDays = summary.ticketMetrics.avgResolutionDays;
  const damaged = summary.materialOutputs.damaged;
  const { resolvedTasks, pendingTasks } = summary.ticketMetrics;

  const devicesTotal = summary.devices.total;
  const available = summary.devices.available;
  const onLoan = summary.devices.assigned;
  const availablePct = devicesTotal > 0 ? Math.round((available / devicesTotal) * 100) : 0;

  const custodyTotal = summary.custodyLetters.total;
  const custodyActive = summary.custodyLetters.active;
  const custodyPct = custodyTotal > 0 ? custodyActive / custodyTotal : 0;

  const tasksTotal = resolvedTasks + pendingTasks;

  const efficiencySegments = summary.ticketEfficiency.map((e, i) => ({
    label: e.user.name,
    value: e.resolved,
    color: seriesColor(i),
  }));
  const efficiencyTotal = efficiencySegments.reduce((acc, e) => acc + e.value, 0);
  const topPerson = [...summary.ticketEfficiency].sort((a, b) => b.resolved - a.resolved)[0];
  const withoutTasks = summary.ticketEfficiency.filter((e) => e.resolved === 0).map((e) => e.user.name);

  // Actividad de los últimos 7 días (los mismos eventos del hilo de abajo).
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const key = dayKey(day.toISOString());
    const value = activity.filter((a) => dayKey(a.at) === key).length;
    return {
      label: WEEK_LABELS[(day.getDay() + 6) % 7],
      value,
      tone: i === 6 ? ("today" as const) : ("past" as const),
    };
  });

  // Dispositivos por categoría (tipo), de mayor a menor.
  const categories = fx.deviceTypes
    .map((type, i) => ({
      label: type.name,
      value: type.devices.reduce((acc, d) => acc + d.total, 0),
      color: seriesColor(i),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const categoryTotal = categories.reduce((acc, c) => acc + c.value, 0);
  const categoryMax = Math.max(1, ...categories.map((c) => c.value));

  // Actividad agrupada por día para el hilo.
  const todayKey = dayKey(new Date().toISOString());
  const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000).toISOString());
  const activityGroups: { key: string; label: string; items: DashboardActivity[] }[] = [];
  for (const a of activity) {
    const key = dayKey(a.at);
    let group = activityGroups[activityGroups.length - 1];
    if (!group || group.key !== key) {
      const label =
        key === todayKey ? t("adminDashboard.today") : key === yesterdayKey ? t("adminDashboard.yesterday") : formatDate(a.at);
      group = { key, label, items: [] };
      activityGroups.push(group);
    }
    group.items.push(a);
  }

  return (
    <>
      {error && <p className="m-0 text-[11px] font-bold text-red-600">{error}</p>}

      <ITBentoGrid>
        {/* Dispositivos: tarjeta oscura con medidor de disponibilidad */}
        <ITBentoTile
          tone="sea"
          cols={4}
          rows={3}
          wide
          icon={<LuBox size={15} />}
          label={t("adminDashboard.devices")}
          value={<Big value={devicesTotal} />}
          caption={t("adminDashboard.devicesAvailable", { available })}
          onClick={() => navigate("/inventory/devices")}
        >
          <div className="relative z-[1] my-1 flex min-h-0 flex-1 flex-col justify-center">
            {devicesTotal > 0 && (
              <ITBentoGauge value={available / devicesTotal} color="var(--color-warning)" trackColor="rgb(255 255 255 / 0.14)" />
            )}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <ITBentoPill dot="var(--color-warning)">{t("adminDashboard.availableShort", { pct: availablePct })}</ITBentoPill>
              <ITBentoPill dot="color-mix(in srgb,currentColor 40%,transparent)">{t("adminDashboard.onLoan", { count: onLoan })}</ITBentoPill>
            </div>
          </div>
        </ITBentoTile>

        {/* Cartas activas: olas animadas */}
        <ITBentoTile
          tone="lavender"
          cols={3}
          rows={2}
          icon={<LuFileText size={15} />}
          label={t("adminDashboard.activeCustodyLetters")}
          value={<Big value={custodyActive} />}
          caption={t("adminDashboard.custodyOfTotal", { total: custodyTotal })}
          onClick={() => navigate("/inventory/loans")}
        >
          <ITBentoWaves level={custodyPct} color="var(--color-violet-400, #a895e0)" />
        </ITBentoTile>

        {/* Salidas dañadas */}
        <ITBentoTile
          cols={2}
          rows={2}
          icon={<LuTrash2 size={15} />}
          label={t("adminDashboard.damagedExits")}
          value={
            <span style={{ color: damaged > 0 ? "var(--color-danger, #e11d48)" : "var(--color-success)" }}>
              <Big value={damaged} />
            </span>
          }
          caption={t("adminDashboard.damagedOfTotal", { total: summary.materialOutputs.total })}
          onClick={() => navigate("/inventory/movements")}
        >
          {damaged === 0 && (
            <span className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[color:var(--color-success)]">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4 12 5 5L20 6" />
              </svg>
              {t("adminDashboard.noDamage")}
            </span>
          )}
        </ITBentoTile>

        {/* Resolución promedio */}
        <ITBentoTile
          tone="sun"
          cols={3}
          rows={2}
          icon={<LuClock size={15} />}
          label={t("adminDashboard.avgResolution")}
          value={avgDays !== null ? <Big value={avgDays} decimals={1} suffix=" d" /> : "—"}
          caption={t("adminDashboard.perTask")}
        />

        {/* Tareas resueltas: segmentos que se levantan */}
        <ITBentoTile
          tone="mint"
          cols={5}
          rows={1}
          wide
          icon={<LuListChecks size={15} />}
        >
          <div className="flex h-full min-h-0 items-center gap-3">
            <div className="shrink-0">
              <h3 className="it-bento-tile__label">
                <LuListChecks size={15} />
                {t("adminDashboard.resolvedTickets")}
              </h3>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="it-bento-tile__value">
                  <Big value={resolvedTasks} />
                </span>
                <span className="text-[15px] font-semibold opacity-60">/ {tasksTotal}</span>
              </div>
            </div>
            <div className="max-h-[42px] min-h-0 flex-1">
              <ITBentoSegments total={tasksTotal} done={resolvedTasks} color="var(--color-success)" />
            </div>
            <div className="shrink-0 text-right">
              <div className="it-bento-tile__value !text-[22px]">{pendingTasks}</div>
              <small className="it-bento-tile__caption">{t("adminDashboard.pendingLabel")}</small>
            </div>
          </div>
        </ITBentoTile>

        {/* Actividad de la semana */}
        <ITBentoTile cols={3} rows={1} wide icon={<LuActivity size={15} />} label={t("adminDashboard.weekActivity")}>
          <div className="mt-1 h-[46px]">
            <ITBentoWeekBars items={week} color="var(--color-primary-500)" todayColor="var(--color-warning)" />
          </div>
        </ITBentoTile>

        {/* Eficiencia del equipo */}
        <ITBentoTile
          cols={4}
          rows={4}
          wide
          icon={<LuChartPie size={15} />}
          label={t("adminDashboard.teamEfficiency")}
          onClick={() => navigate("/tickets")}
        >
          {efficiencySegments.length === 0 ? (
            <p className="m-0 mt-3 text-[12px] font-semibold opacity-60">{t("adminDashboard.noEfficiency")}</p>
          ) : (
            <div className="mt-2 flex items-center gap-3.5">
              <div className="shrink-0">
                <ITBentoDonut
                  size={132}
                  segments={efficiencySegments}
                  center={<Big value={efficiencyTotal} />}
                  caption={t("adminDashboard.resolvedCaption")}
                />
              </div>
              <div className="grid min-w-0 flex-1 gap-2.5">
                {efficiencySegments.slice(0, 4).map((sec) => {
                  const pct = efficiencyTotal > 0 ? Math.round((sec.value / efficiencyTotal) * 100) : 0;
                  return (
                    <div key={sec.label} className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1 text-[12.5px] font-medium">
                      <span className="truncate">{sec.label}</span>
                      <span>
                        {sec.value} <span className="opacity-60">{pct}%</span>
                      </span>
                      <div className="it-bento-bar col-span-2">
                        <i style={{ "--it-bento-w": `${pct}%`, background: sec.color } as React.CSSProperties} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <InsightNote className="mt-auto">
            {topPerson
              ? withoutTasks.length > 0
                ? t("adminDashboard.efficiencyNote", { top: topPerson.user.name, none: withoutTasks[0] })
                : t("adminDashboard.efficiencyNoteAll")
              : t("adminDashboard.noEfficiency")}
          </InsightNote>
        </ITBentoTile>

        {/* Dispositivos por categoría */}
        <ITBentoTile
          cols={4}
          rows={4}
          wide
          icon={<LuBox size={15} />}
          label={t("adminDashboard.devicesByCategory")}
          onClick={() => navigate("/inventory/device-types")}
        >
          {categories.length === 0 ? (
            <p className="m-0 mt-3 text-[12px] font-semibold opacity-60">{t("adminDashboard.noCategories")}</p>
          ) : (
            <div className="it-bento-bars mt-4 flex-1 content-around">
              {categories.map((row) => (
                <div key={row.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 text-[12.5px] font-medium">
                  <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: row.color }} />
                  <span className="truncate lowercase first-letter:uppercase">{row.label}</span>
                  <span>
                    {row.value} <span className="opacity-60">{Math.round((row.value / Math.max(1, categoryTotal)) * 100)}%</span>
                  </span>
                  <div className="it-bento-bar col-span-3">
                    <i style={{ "--it-bento-w": `${(row.value / categoryMax) * 100}%`, background: row.color } as React.CSSProperties} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ITBentoTile>

        {/* Actividad reciente */}
        <ITBentoTile cols={4} rows={4} wide icon={<LuActivity size={15} />} label={t("adminDashboard.recentActivity")}>
          {activityGroups.length === 0 ? (
            <p className="m-0 mt-3 text-[12px] font-semibold opacity-60">{t("adminDashboard.noActivity")}</p>
          ) : (
            <div className="mt-1 min-h-0 flex-1">
              <ITBentoFeed
                maxHeight={236}
                groups={activityGroups.map((g) => ({
                  key: g.key,
                  label: g.label,
                  items: g.items.map((a) => ({
                    id: a.id,
                    icon: SCOPE_ICON[a.scope],
                    title: a.message,
                    meta: formatTimeInTZ(a.at),
                    tone: a.scope === "custodyLetters" ? "violet" : "success",
                    href: activityHref(a) ?? undefined,
                  })),
                }))}
                onItemClick={(item) => {
                  if (item.href) navigate(item.href);
                }}
              />
            </div>
          )}
        </ITBentoTile>
      </ITBentoGrid>
    </>
  );
}
