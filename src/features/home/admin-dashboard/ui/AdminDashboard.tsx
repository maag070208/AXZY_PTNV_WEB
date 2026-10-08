import { useNavigate } from "react-router-dom";
import { ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import {
  FaBoxOpen,
  FaChevronRight,
  FaClock,
  FaFileSignature,
  FaTicketAlt,
  FaTrashAlt,
} from "react-icons/fa";
import { formatDateTime } from "@shared/utils/dates";
import type { DashboardActivity } from "@entities/dashboard";
import type { UseAdminDashboard } from "../model/useAdminDashboard";
import { activityHref } from "../model/activityLinks";
import { DonutChart } from "@shared/ui/charts";
import { KpiTile } from "@shared/ui/kpi-tile";

const SCOPE_ICON: Record<DashboardActivity["scope"], React.ReactNode> = {
  devices: <FaBoxOpen size={11} />,
  tickets: <FaTicketAlt size={11} />,
  custodyLetters: <FaFileSignature size={11} />,
  materialOutputs: <FaTrashAlt size={11} />,
  inventory: <FaFileSignature size={11} />,
};

const SCOPE_COLOR: Record<DashboardActivity["scope"], string> = {
  devices: "bg-blue-500",
  tickets: "bg-amber-500",
  custodyLetters: "bg-emerald-500",
  materialOutputs: "bg-rose-500",
  inventory: "bg-indigo-500",
};

const AGENT_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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
  const efficiencySegments = summary.ticketEfficiency.map((e, i) => ({
    label: e.user.name,
    value: e.resolved,
    color: AGENT_COLORS[i % AGENT_COLORS.length],
  }));

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITText className="text-[13px] font-black uppercase tracking-widest text-slate-600">
          {t("adminDashboard.title")}
        </ITText>
        <ITFlex align="center" gap={1.5}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <ITText className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            {t("adminDashboard.live")}
          </ITText>
        </ITFlex>
      </ITFlex>

      {error && <ITText className="text-[11px] font-bold text-red-600">{error}</ITText>}

      <div className="!grid gap-4 sm:!grid-cols-2 xl:!grid-cols-5">
        <KpiTile
          label={t("adminDashboard.devices")}
          value={summary.devices.total}
          icon={<FaBoxOpen size={16} />}
          tone="sky"
        />
        <KpiTile
          label={t("adminDashboard.activeCustodyLetters")}
          value={summary.custodyLetters.active}
          icon={<FaFileSignature size={16} />}
          tone="violet"
        />
        <KpiTile
          label={t("adminDashboard.damagedExits")}
          value={damaged}
          icon={<FaTrashAlt size={16} />}
          tone={damaged > 0 ? "rose" : "neutral"}
        />
        <KpiTile
          label={t("adminDashboard.avgResolution")}
          value={avgDays !== null ? `${avgDays} d` : "—"}
          icon={<FaClock size={16} />}
          tone="neutral"
        />
        <KpiTile
          label={t("adminDashboard.resolvedTickets")}
          value={summary.ticketMetrics.resolvedTasks}
          icon={<FaTicketAlt size={16} />}
          tone="emerald"
        />
      </div>

      {/* El donut va en una tarjeta angosta (antes ocupaba media pantalla para un
          gráfico de 128 px) y la actividad se queda con el resto del ancho. */}
      <div className="!grid gap-4 lg:!grid-cols-3">
        <ITCard className="!p-5 border border-slate-200">
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
            {t("adminDashboard.teamEfficiency")}
          </ITText>
          {efficiencySegments.length === 0 ? (
            <ITText className="text-[12px] font-bold text-slate-400">
              {t("adminDashboard.noEfficiency")}
            </ITText>
          ) : (
            <DonutChart segments={efficiencySegments} size={148} />
          )}
        </ITCard>

        <ITCard className="!p-5 border border-slate-200 lg:!col-span-2">
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
            {t("adminDashboard.recentActivity")}
          </ITText>
          {activity.length === 0 ? (
            <ITText className="text-[12px] font-bold text-slate-400">
              {t("adminDashboard.noActivity")}
            </ITText>
          ) : (
            <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
              {activity.map((a) => {
                const href = activityHref(a);
                const row = (
                  <>
                    <ITFlex
                      align="center"
                      justify="center"
                      className={`w-6 h-6 shrink-0 rounded-full text-white ${SCOPE_COLOR[a.scope]}`}
                    >
                      {SCOPE_ICON[a.scope]}
                    </ITFlex>
                    <ITFlex direction="column" gap={0} className="min-w-0 flex-1">
                      <ITText className="text-[11px] font-bold text-slate-700 truncate">
                        {a.message}
                      </ITText>
                      <ITText className="text-[9px] text-slate-400">
                        {formatDateTime(a.at)}
                      </ITText>
                    </ITFlex>
                    {href && <FaChevronRight size={9} className="text-slate-300 shrink-0" />}
                  </>
                );
                return href ? (
                  <button
                    key={a.id}
                    className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => navigate(href)}
                  >
                    {row}
                  </button>
                ) : (
                  <ITFlex key={a.id} align="center" gap={2}>
                    {row}
                  </ITFlex>
                );
              })}
            </div>
          )}
        </ITCard>
      </div>
    </ITFlex>
  );
}
