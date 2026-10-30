import { ITBentoSegments, ITBentoTile, ITButton, ITCard, ITSelect } from "@axzydev/axzy_ui_system";
import { LuBuilding2, LuCalendarClock, LuClock, LuListChecks, LuPencil, LuTimer, LuUser } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { formatDateTime } from "@shared/utils/dates";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { PRIORITY_TONE, STATUS_TONE, TicketChip, daysOnHold } from "@entities/ticket";
import { calculateEfficacy } from "../model/timeline";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  /** Abre el diálogo de edición; sin él (cerrado o sin permiso) no se pinta. */
  onEdit?: () => void;
  /** Permite elegir el responsable aquí mismo, sin pasar por el diálogo. */
  canAssign?: boolean;
}

/**
 * Héroe del detalle (plantilla P3): folio, estado, prioridad, categoría y las
 * personas del ticket, más dos mosaicos con el avance de las tareas y el tiempo.
 */
export default function TicketHero({ fx, onEdit, canAssign }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const tasks = ticket.assignments;
  const done = tasks.filter((a) => a.status === "COMPLETED").length;
  const efficacy = calculateEfficacy(ticket);
  const days = daysOnHold(ticket.createdAt, ticket.closedAt);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <ITCard className="lg:col-span-6">
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="m-0 text-[12px] font-semibold text-slate-500">{tt("detail.folio")}</p>
              <p className="m-0 text-[26px] font-extrabold leading-tight tabular-nums text-slate-800">
                #{ticket.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            {onEdit && (
              // El testid va en el envoltorio: `ITButton` no reenvía props sueltas.
              <span data-testid="editar-ticket" className="inline-flex">
                <ITButton variant="outlined" color="secondary" size="sm" onClick={onEdit} title={tt("detail.editTitle")}>
                  <span className="flex items-center gap-1 text-[11px] font-bold">
                    <LuPencil size={12} />
                    {tt("detail.edit")}
                  </span>
                </ITButton>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <TicketChip tone={STATUS_TONE[ticket.status]} label={dyn(tt)(`statusLabels.${ticket.status}`)} />
            <TicketChip tone={PRIORITY_TONE[ticket.priority]} label={dyn(tt)(`priorityLabels.${ticket.priority}`)} />
            <TicketChip tone="primary" label={ticket.category?.name ?? "—"} />
            {ticket.deletedAt && <TicketChip label={tt("detail.deletedBadge")} />}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                <LuUser size={13} />
                {canAssign ? tt("detail.responsible") : tt("detail.assignedTo")}
              </span>
              {canAssign ? (
                <ITSelect
                  name="responsible"
                  options={[{ value: "", label: tt("detail.noResponsible") }, ...fx.assigneeOptions]}
                  value={ticket.assignedToId ?? ""}
                  onChange={(e) => fx.handleResponsibleChange(e.target.value)}
                />
              ) : ticket.assignedTo ? (
                <PersonLine name={ticket.assignedTo.name} sub={ticket.assignedTo.jobTitle} />
              ) : (
                <span className="text-[13px] font-semibold text-slate-400">{tt("detail.unassigned")}</span>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                <LuCalendarClock size={13} />
                {tt("detail.createdBy")}
              </span>
              <PersonLine name={ticket.createdBy?.name ?? "—"} sub={formatDateTime(ticket.createdAt)} />
            </div>
          </div>

          <p className="m-0 flex items-center gap-1.5 text-[12.5px] text-slate-500">
            <LuBuilding2 size={13} />
            {tt("detail.department")}: <span className="font-semibold text-slate-700">{ticket.department?.name ?? "—"}</span>
          </p>
        </div>
      </ITCard>

      <div className="flex min-w-0 lg:col-span-3">
        <ITBentoTile
          tone="mint"
          label={tt("detail.tasksTile")}
          icon={<LuListChecks size={14} />}
          value={`${done}/${tasks.length}`}
          caption={tasks.length === 0 ? tt("detail.noAssignmentsShort") : tt("detail.tasksDone")}
          className="min-h-[150px] flex-1 justify-between"
        >
          {tasks.length > 0 && (
            <div className="my-2">
              <ITBentoSegments total={tasks.length} done={done} />
            </div>
          )}
        </ITBentoTile>
      </div>

      <div className="flex min-w-0 lg:col-span-3">
        {efficacy ? (
          <ITBentoTile
            tone="lavender"
            label={tt("detail.efficacyTitle")}
            icon={<LuTimer size={14} />}
            value={`${efficacy.score}%`}
            caption={tt("detail.resolvedIn", { hours: efficacy.hours })}
            className="min-h-[150px] flex-1 justify-between"
          />
        ) : (
          <ITBentoTile
            tone="sun"
            label={tt("detail.daysOpen")}
            icon={<LuClock size={14} />}
            value={`${days} d`}
            caption={tt("detail.sinceCreated")}
            className="min-h-[150px] flex-1 justify-between"
          />
        )}
      </div>
    </div>
  );
}

function PersonLine({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ProfileAvatar name={name} size="md" />
      <div className="min-w-0">
        <p className="m-0 truncate text-[13px] font-bold text-slate-800">{name}</p>
        {sub && <p className="m-0 truncate text-[11.5px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}
