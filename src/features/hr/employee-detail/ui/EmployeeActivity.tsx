import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaClipboardCheck, FaExchangeAlt, FaHistory, FaTicketAlt, FaTools } from "react-icons/fa";
import { ITText } from "@axzydev/axzy_ui_system";
import { personalApi, type EmployeeOverview } from "@entities/hr";
import { KpiTile } from "@shared/ui/kpi-tile";
import { dyn } from "@shared/i18n";
import { formatDateTime } from "@shared/utils/dates";

const STATUS_TONE: Record<string, string> = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  IN_REVIEW: "border-violet-200 bg-violet-50 text-violet-700",
  CLOSED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-sky-200 bg-sky-50 text-sky-700",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-700",
  RETURNED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
};

function Pill({ value, label }: { value: string; label: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[value] ?? "border-slate-200 text-slate-600"}`}>
      {label}
    </span>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-10 text-slate-300">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

/** Tarjeta de una sección de actividad: encabezado con ícono y conteo, cuerpo con altura máxima. */
function Card({ icon, tone, title, count, children, wide = false }: { icon: React.ReactNode; tone: string; title: string; count: number; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-[var(--it-card-bg)] shadow-sm ${wide ? "lg:col-span-2" : ""}`}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{count}</span>
      </header>
      <div className="max-h-[22rem] overflow-y-auto px-3 py-1">{children}</div>
    </section>
  );
}

/** Actividad de la persona: indicadores y tarjetas de equipo prestado, tickets, tareas y kardex. */
export default function EmployeeActivity({ userId }: { userId: string }) {
  const { t } = useTranslation("employees");
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    personalApi
      .overview(userId)
      .then((d) => !cancelled && setData(d))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : t("detail.activity.error")));
    return () => {
      cancelled = true;
    };
  }, [userId, t]);

  if (error) return <p role="alert" className="text-sm text-red-600">{error}</p>;
  if (!data) return <ITText className="text-sm text-slate-400">{t("detail.activity.loading")}</ITText>;
  const { summary, inventory } = data;
  const openLoans = inventory ? inventory.loans.filter((l) => l.status === "ACTIVE" || l.status === "PARTIAL") : [];
  const label = (key: string) => dyn(t)(`detail.activity.status.${key}`);
  // Abiertos primero: lo que requiere atención no se pierde entre el historial.
  const tickets = [...data.tickets].sort((a, b) => Number(a.status === "CLOSED") - Number(b.status === "CLOSED"));
  const tasks = [...data.tasks].sort((a, b) => Number(a.status === "COMPLETED") - Number(b.status === "COMPLETED"));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:!grid-cols-4">
        {inventory && (
          <>
            <KpiTile icon={<FaBoxOpen size={14} />} tone="sky" label={t("detail.activity.kpi.units")} value={inventory.summary.borrowedUnits} hint={t("detail.activity.kpi.unitsHint", { count: inventory.summary.activeLoans })} />
            <KpiTile icon={<FaClipboardCheck size={14} />} tone="violet" label={t("detail.activity.kpi.letters")} value={inventory.summary.activeLoans} hint={t("detail.activity.kpi.lettersHint")} />
          </>
        )}
        <KpiTile icon={<FaTicketAlt size={14} />} tone={summary.openTickets ? "amber" : "neutral"} label={t("detail.activity.kpi.tickets")} value={summary.openTickets} hint={t("detail.activity.kpi.ticketsHint")} />
        <KpiTile icon={<FaTools size={14} />} tone={summary.pendingTasks ? "orange" : "neutral"} label={t("detail.activity.kpi.tasks")} value={summary.pendingTasks} hint={t("detail.activity.kpi.tasksHint")} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:!grid-cols-2">
        {inventory && (
        <Card icon={<FaBoxOpen size={14} />} tone="bg-sky-50 text-sky-600" title={t("detail.activity.tabs.loans")} count={openLoans.length}>
          <ul className="divide-y divide-slate-100">
            {openLoans.map((l) => (
              <li key={l.id} className="px-2 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{l.number}</p>
                  <Pill value={l.status} label={label(l.status)} />
                </div>
                <p className="text-xs text-slate-500">{formatDateTime(l.date)}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {l.items.map((i, idx) => (
                    <li key={idx} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                      <span className="font-bold text-slate-900">{i.quantity - i.returned}×</span>
                      <span className="truncate">{i.device}</span>
                      {i.returned > 0 && <span className="ml-auto text-xs text-emerald-600">{t("detail.activity.returnedCount", { count: i.returned })}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {openLoans.length === 0 && <Empty icon={<FaBoxOpen />} text={t("detail.activity.empty.loans")} />}
          </ul>
        </Card>
        )}

        <Card icon={<FaTicketAlt size={14} />} tone="bg-amber-50 text-amber-600" title={t("detail.activity.tabs.tickets")} count={tickets.length}>
          <ul className="divide-y divide-slate-100">
            {tickets.map((tk) => (
              <li key={tk.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50" onClick={() => navigate(`/tickets/${tk.id}`)}>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{tk.title}</p>
                  <p className="text-xs text-slate-500">{dyn(t)(`detail.activity.relation.${tk.relation}`)} · {formatDateTime(tk.createdAt)}</p>
                </div>
                <Pill value={tk.status} label={label(tk.status)} />
              </li>
            ))}
            {tickets.length === 0 && <Empty icon={<FaTicketAlt />} text={t("detail.activity.empty.tickets")} />}
          </ul>
        </Card>

        <Card icon={<FaTools size={14} />} tone="bg-orange-50 text-orange-600" title={t("detail.activity.tabs.tasks")} count={tasks.length}>
          <ul className="divide-y divide-slate-100">
            {tasks.map((tk) => (
              <li key={tk.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50" onClick={() => navigate(`/tickets/${tk.ticketId}`)}>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{tk.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {tk.ticketTitle}{tk.dueDate ? ` · ${t("detail.activity.due", { date: formatDateTime(tk.dueDate) })}` : ""}
                  </p>
                </div>
                <Pill value={tk.status} label={label(tk.status)} />
              </li>
            ))}
            {tasks.length === 0 && <Empty icon={<FaTools />} text={t("detail.activity.empty.tasks")} />}
          </ul>
        </Card>

        {inventory && (
        <Card icon={<FaHistory size={14} />} tone="bg-violet-50 text-violet-600" title={t("detail.activity.tabs.kardex")} count={inventory.kardex.length}>
          <ul className="relative ml-4 border-l border-slate-200 py-2">
            {inventory.kardex.map((k, idx) => (
              <li key={`${k.number}-${idx}`} className="relative py-3 pl-6">
                <span className={`absolute -left-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${k.type === "LOAN" ? "bg-sky-100 text-sky-600" : "bg-emerald-100 text-emerald-600"}`}>
                  <FaExchangeAlt size={11} />
                </span>
                <p className="font-semibold text-slate-900">
                  {dyn(t)(`detail.activity.kardex.${k.type}`)} · {k.number}
                  {k.loanNumber ? <span className="font-normal text-slate-500"> ({k.loanNumber})</span> : null}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(k.date)}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {k.items.map((i) => `${i.quantity}× ${i.device}${i.condition ? ` · ${i.condition}` : ""}`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
          {inventory.kardex.length === 0 && <Empty icon={<FaHistory />} text={t("detail.activity.empty.kardex")} />}
        </Card>
        )}
      </div>
    </div>
  );
}
