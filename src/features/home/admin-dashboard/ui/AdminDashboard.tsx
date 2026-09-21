import { useNavigate } from "react-router-dom";
import { ITBadget, ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import {
  FaBoxOpen,
  FaClock,
  FaFileSignature,
  FaHourglassHalf,
  FaTicketAlt,
  FaTrashAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFechaHora } from "@shared/utils/dates";
import type { DashboardActivity } from "@entities/dashboard";
import {
  RATING_ESPERA_COLOR,
  ratingEspera,
  type RatingEspera,
} from "@entities/ticket";
import type { UseAdminDashboard } from "../model/useAdminDashboard";
import BarChart from "./BarChart";

const SCOPE_ICON: Record<DashboardActivity["scope"], React.ReactNode> = {
  devices: <FaBoxOpen size={11} />,
  tickets: <FaTicketAlt size={11} />,
  cartas: <FaFileSignature size={11} />,
  salidas: <FaTrashAlt size={11} />,
  inventory: <FaFileSignature size={11} />,
};

const SCOPE_COLOR: Record<DashboardActivity["scope"], string> = {
  devices: "bg-blue-500",
  tickets: "bg-amber-500",
  cartas: "bg-emerald-500",
  salidas: "bg-rose-500",
  inventory: "bg-indigo-500",
};

const AGENT_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function KpiCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
}) {
  return (
    <ITCard className="!p-4 border border-slate-200 flex-1 min-w-[140px]">
      <ITFlex align="center" gap={3}>
        <ITFlex
          align="center"
          justify="center"
          className={`w-10 h-10 shrink-0 rounded-xl text-white ${iconBg}`}
        >
          {icon}
        </ITFlex>
        <ITFlex direction="column" gap={0}>
          <ITText className="text-[20px] font-black text-slate-800 leading-none">
            {value}
          </ITText>
          <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {label}
          </ITText>
        </ITFlex>
      </ITFlex>
    </ITCard>
  );
}

export default function AdminDashboard({ fx }: { fx: UseAdminDashboard }) {
  const { t, summary, activity, error } = fx;
  const navigate = useNavigate();
  const { t: ticketsT } = useTranslation("tickets");

  if (!summary) return null;

  const avgDias = summary.ticketMetricas.avgResolucionDias;
  const eficienciaBars = summary.ticketEficiencia.map((e, i) => ({
    label: e.user.name,
    value: e.resueltas,
    color: AGENT_COLORS[i % AGENT_COLORS.length],
  }));
  const urgente = (dias: number): RatingEspera => ratingEspera(dias);

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

      {error && (
        <ITText className="text-[11px] font-bold text-red-600">{error}</ITText>
      )}

      <ITFlex gap={3} wrap="wrap">
        <KpiCard
          icon={<FaTicketAlt size={16} />}
          iconBg="bg-gradient-to-br from-indigo-500 to-violet-600"
          label={t("adminDashboard.ticketsResueltos")}
          value={summary.ticketMetricas.tareasResueltas}
        />
        <KpiCard
          icon={<FaTicketAlt size={16} />}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          label={t("adminDashboard.openTickets")}
          value={summary.tickets.abierto + summary.tickets.enSeguimiento}
        />
        <KpiCard
          icon={<FaClock size={16} />}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          label={t("adminDashboard.avgResolucion")}
          value={avgDias !== null ? `${avgDias} d` : "—"}
        />
        <KpiCard
          icon={<FaHourglassHalf size={16} />}
          iconBg="bg-gradient-to-br from-rose-500 to-red-600"
          label={t("adminDashboard.tareasPendientes")}
          value={summary.ticketMetricas.tareasPendientes}
        />
      </ITFlex>

      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={12} md={7} className="flex flex-col gap-4">
          <ITCard className="!p-5 border border-slate-200">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
              {t("adminDashboard.teamEfficiency")}
            </ITText>
            {eficienciaBars.length === 0 ? (
              <ITText className="text-[12px] font-bold text-slate-400">
                {t("adminDashboard.noEfficiency")}
              </ITText>
            ) : (
              <BarChart bars={eficienciaBars} />
            )}
          </ITCard>

          <ITCard className="!p-5 border border-slate-200">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
              {t("adminDashboard.ticketsByStatus")}
            </ITText>
            <BarChart
              bars={[
                { label: t("adminDashboard.open"), value: summary.tickets.abierto, color: "#f59e0b" },
                { label: t("adminDashboard.following"), value: summary.tickets.enSeguimiento, color: "#3b82f6" },
                { label: t("adminDashboard.closed"), value: summary.tickets.cerrado, color: "#10b981" },
              ]}
            />
          </ITCard>
        </ITGrid>

        <ITGrid item xs={12} md={5} className="flex flex-col gap-4">
          <ITCard className="!p-5 border border-slate-200">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
              {t("adminDashboard.urgentTitle")}
            </ITText>
            {summary.ticketsUrgentes.length === 0 ? (
              <ITText className="text-[12px] font-bold text-slate-400">
                {t("adminDashboard.noUrgent")}
              </ITText>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {summary.ticketsUrgentes.map((u) => {
                  const rating = urgente(u.diasEnEspera);
                  return (
                    <button
                      key={u.id}
                      className="flex items-center gap-2 py-2 text-left hover:bg-slate-50"
                      onClick={() => navigate(`/tickets/${u.id}`)}
                    >
                      <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
                        <ITText className="text-[11px] font-bold text-slate-700 truncate">
                          {u.titulo}
                        </ITText>
                        <ITText className="text-[9px] text-slate-400">
                          {formatFecha(u.creadoEn)} · {u.asignado ?? "sin asignar"} ·{" "}
                          {u.prioridad}
                        </ITText>
                      </ITFlex>
                      <ITFlex align="center" gap={1} className="shrink-0">
                        <ITText className="text-[11px] font-black text-slate-700">
                          {u.diasEnEspera} d
                        </ITText>
                        <ITBadget
                          size="lg"
                          color={(RATING_ESPERA_COLOR[rating] as any) ?? "gray"}
                        >
                          {rating === "MALO" ? t("adminDashboard.urgentTag") : ticketsT(`list.esperaLabels.${rating}`)}
                        </ITBadget>
                      </ITFlex>
                    </button>
                  );
                })}
              </div>
            )}
          </ITCard>

          <ITCard className="!p-5 border border-slate-200 flex-1">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
              {t("adminDashboard.recentActivity")}
            </ITText>
            {activity.length === 0 ? (
              <ITText className="text-[12px] font-bold text-slate-400">
                {t("adminDashboard.noActivity")}
              </ITText>
            ) : (
              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                {activity.map((a) => (
                  <ITFlex key={a.id} align="center" gap={2}>
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
                        {formatFechaHora(a.at)}
                      </ITText>
                    </ITFlex>
                  </ITFlex>
                ))}
              </div>
            )}
          </ITCard>
        </ITGrid>
      </ITGrid>
    </ITFlex>
  );
}

const formatFecha = (iso: string): string => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};