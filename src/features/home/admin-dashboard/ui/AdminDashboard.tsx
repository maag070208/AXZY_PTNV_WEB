import { useNavigate } from "react-router-dom";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import {
  LuBox,
  LuChartPie,
  LuChevronRight,
  LuClock,
  LuFileText,
  LuListChecks,
  LuTicket,
  LuTrash2,
  LuActivity,
} from "react-icons/lu";
import { formatDate, formatTimeInTZ } from "@shared/utils/dates";
import type { DashboardActivity } from "@entities/dashboard";
import type { UseAdminDashboard } from "../model/useAdminDashboard";
import { activityHref } from "../model/activityLinks";
import { DonutChart, GaugeArc, WaveFill } from "@shared/ui/charts";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { KPI_TONES, KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";

const SCOPE_ICON: Record<DashboardActivity["scope"], React.ReactNode> = {
  devices: <LuBox size={14} />,
  tickets: <LuTicket size={14} />,
  custodyLetters: <LuFileText size={14} />,
  materialOutputs: <LuTrash2 size={14} />,
  inventory: <LuFileText size={14} />,
};

/** Tono pastel de cada tipo de actividad (coincide con el de su indicador). */
const SCOPE_TONE: Record<DashboardActivity["scope"], KpiTone> = {
  devices: "sky",
  tickets: "amber",
  custodyLetters: "violet",
  materialOutputs: "rose",
  inventory: "emerald",
};

/** Paleta de segmentos del equipo, tomada de los tokens del tema (sigue la marca y la apariencia). */
const AGENT_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
];

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Panel de operación del inicio (`dashboard.view`).
 *
 * A propósito NO repite lo que ya muestran los tableros de Tickets y Tareas (sus
 * contadores, los tickets por estado y los más viejos salían aquí dos y tres
 * veces). Lo que queda es lo que solo vive aquí: el inventario, la resolución
 * promedio, la eficiencia del equipo y la actividad reciente.
 */
export default function AdminDashboard({ fx }: { fx: UseAdminDashboard }) {
  const { t, summary, activity, error } = fx;
  const navigate = useNavigate();

  if (!summary) return null;

  const avgDays = summary.ticketMetrics.avgResolutionDays;
  const damaged = summary.materialOutputs.damaged;
  const { resolvedTasks, pendingTasks } = summary.ticketMetrics;
  const efficiencySegments = summary.ticketEfficiency.map((e, i) => ({
    label: e.user.name,
    value: e.resolved,
    color: AGENT_COLORS[i % AGENT_COLORS.length],
  }));
  // Proporciones reales del resumen; sin total no hay visual (nunca se inventa).
  const devicesTotal = summary.devices.total;
  const custodyTotal = summary.custodyLetters.total;
  const tasksTotal = resolvedTasks + pendingTasks;
  const efficiencyTotal = efficiencySegments.reduce((acc, e) => acc + e.value, 0);

  // Actividad agrupada por día (el orden viene del servidor, más reciente primero).
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
    <ITFlex direction="column" gap={5}>
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <h2 className="m-0 !text-lg font-bold tracking-tight !text-slate-800">
          {t("adminDashboard.title")}
        </h2>
        <ITFlex align="center" gap={1.5} className="rounded-full bg-[var(--color-success-soft)] px-2.5 py-0.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]" />
          </span>
          <ITText className="text-[11px] font-semibold text-[color:color-mix(in_srgb,var(--color-success)_55%,#000)]">
            {t("adminDashboard.live")}
          </ITText>
        </ITFlex>
      </ITFlex>

      {error && <ITText className="text-[11px] font-bold text-red-600">{error}</ITText>}

      <div className="!grid gap-4 sm:!grid-cols-2 xl:!grid-cols-5">
        <KpiTile
          label={t("adminDashboard.devices")}
          value={devicesTotal}
          icon={<LuBox size={16} />}
          tone="sky"
          hint={t("adminDashboard.devicesAvailable", { available: summary.devices.available })}
          visual={
            devicesTotal > 0 ? (
              <GaugeArc value={summary.devices.available / devicesTotal} color={KPI_TONES.sky.accent} />
            ) : undefined
          }
        />
        <KpiTile
          label={t("adminDashboard.activeCustodyLetters")}
          value={summary.custodyLetters.active}
          icon={<LuFileText size={16} />}
          tone="violet"
          hint={t("adminDashboard.custodyOfTotal", { total: custodyTotal })}
          backdrop={
            custodyTotal > 0 ? (
              <WaveFill level={summary.custodyLetters.active / custodyTotal} color={KPI_TONES.violet.accent} />
            ) : undefined
          }
        />
        <KpiTile
          label={t("adminDashboard.damagedExits")}
          value={damaged}
          icon={<LuTrash2 size={16} />}
          tone={damaged > 0 ? "rose" : "neutral"}
          hint={t("adminDashboard.damagedOfTotal", { total: summary.materialOutputs.total })}
        />
        <KpiTile
          label={t("adminDashboard.avgResolution")}
          value={avgDays !== null ? `${avgDays} d` : "—"}
          icon={<LuClock size={16} />}
          tone="amber"
        />
        <KpiTile
          label={t("adminDashboard.resolvedTickets")}
          value={resolvedTasks}
          icon={<LuListChecks size={16} />}
          tone="emerald"
          hint={t("adminDashboard.resolvedPending", { pending: pendingTasks })}
          visual={
            tasksTotal > 0 ? (
              <GaugeArc value={resolvedTasks / tasksTotal} color={KPI_TONES.emerald.accent} />
            ) : undefined
          }
        />
      </div>

      {/* Dona angosta con su leyenda propia (avatar, conteo y barra por persona) y la
          actividad con el resto del ancho; ambas tarjetas se estiran a la misma altura. */}
      <div className="!grid items-stretch gap-4 lg:!grid-cols-3">
        <PanelCard
          title={t("adminDashboard.teamEfficiency")}
          icon={<LuChartPie size={18} />}
          onOpen={() => navigate("/tickets")}
          className="h-full"
        >
          {efficiencySegments.length === 0 ? (
            <ITText className="text-[12px] font-bold text-slate-400">
              {t("adminDashboard.noEfficiency")}
            </ITText>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <DonutChart
                segments={efficiencySegments}
                size={160}
                showLegend={false}
                caption={t("adminDashboard.resolvedCaption")}
              />
              <ul className="m-0 flex w-full list-none flex-col gap-3 p-0">
                {efficiencySegments.map((sec) => {
                  const pct = efficiencyTotal > 0 ? Math.round((sec.value / efficiencyTotal) * 100) : 0;
                  return (
                    <li key={sec.label} className="flex items-center gap-3">
                      <ProfileAvatar size="sm" name={sec.label} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">
                            {sec.label}
                          </span>
                          <span className="text-[13px] font-bold tabular-nums text-slate-800">{sec.value}</span>
                          <span className="w-9 text-right text-[11px] tabular-nums text-slate-400">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: sec.color }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </PanelCard>

        <PanelCard
          title={t("adminDashboard.recentActivity")}
          icon={<LuActivity size={18} />}
          className="h-full lg:!col-span-2"
        >
          {activity.length === 0 ? (
            <ITText className="text-[12px] font-bold text-slate-400">
              {t("adminDashboard.noActivity")}
            </ITText>
          ) : (
            <div className="relative">
              <div className="flex max-h-[380px] flex-col gap-0.5 overflow-y-auto pb-6 pr-1">
                {activityGroups.map((group) => (
                  <section key={group.key} className="flex flex-col gap-0.5">
                    <h4 className="m-0 px-2 pb-1 pt-3 !text-[11px] font-semibold !text-slate-400 first:pt-0">
                      {group.label}
                    </h4>
                    {group.items.map((a) => {
                      const href = activityHref(a);
                      const tone = KPI_TONES[SCOPE_TONE[a.scope]];
                      const row = (
                        <>
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: tone.bg, color: tone.accent }}
                          >
                            {SCOPE_ICON[a.scope]}
                          </span>
                          <ITFlex direction="column" gap={0} className="min-w-0 flex-1">
                            <ITText className="truncate text-[13px] font-semibold text-slate-800">
                              {a.message}
                            </ITText>
                            <ITText className="text-[11px] text-slate-400">{formatTimeInTZ(a.at)}</ITText>
                          </ITFlex>
                          {href && <LuChevronRight size={14} className="shrink-0 text-slate-300" />}
                        </>
                      );
                      return href ? (
                        <button
                          key={a.id}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
                          onClick={() => navigate(href)}
                        >
                          {row}
                        </button>
                      ) : (
                        <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                          {row}
                        </div>
                      );
                    })}
                  </section>
                ))}
              </div>
              {/* Desvanecido inferior: avisa que la lista sigue al hacer scroll. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--it-card-bg,#ffffff)] to-transparent" />
            </div>
          )}
        </PanelCard>
      </div>
    </ITFlex>
  );
}
