import { ITBadget, ITButton, ITCard, ITFlex, ITGrid, ITSelect, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaPen } from "react-icons/fa";
import { formatDateTime } from "@shared/utils/dates";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { PRIORITY_BADGE, STATUS_BADGE } from "@entities/ticket";
import { calculateEfficacy } from "../model/timeline";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  attachments: React.ReactNode;
  /** Abre el diálogo de edición; sin él (cerrado o sin permiso) no se pinta. */
  onEdit?: () => void;
  /** Permite elegir el responsable aquí mismo, sin pasar por el diálogo. */
  canAssign?: boolean;
}

export default function TicketInfoCard({ fx, attachments, onEdit, canAssign }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const efficacy = calculateEfficacy(ticket);

  return (
    <ITCard>
      <ITStack direction="column" spacing={5} className="w-full">
        <ITFlex align="center" justify="between" gap={2} wrap="wrap">
          <ITFlex gap={2} wrap="wrap">
            <ITBadget color={(STATUS_BADGE[ticket.status]?.color as any) ?? "default"} size="lg">
              {dyn(tt)(`statusLabels.${ticket.status}`)}
            </ITBadget>
            <ITBadget color={(PRIORITY_BADGE[ticket.priority]?.color as any) ?? "default"} size="lg">
              {dyn(tt)(`priorityLabels.${ticket.priority}`)}
            </ITBadget>
            <ITBadget color="primary" size="lg">
              {ticket.category?.name ?? "—"}
            </ITBadget>
            {ticket.deletedAt && (
              <ITBadget color="gray" size="lg">
                {tt("detail.deletedBadge")}
              </ITBadget>
            )}
          </ITFlex>
          {onEdit && (
            // El testid va en el envoltorio: `ITButton` no reenvía props sueltas.
            <span data-testid="editar-ticket" className="inline-flex">
              <ITButton variant="outlined" color="secondary" size="sm" onClick={onEdit} title={tt("detail.editTitle")}>
                <ITFlex align="center" gap={1}>
                  <FaPen size={10} />
                  <ITText className="!text-[11px] font-bold">{tt("detail.edit")}</ITText>
                </ITFlex>
              </ITButton>
            </span>
          )}
        </ITFlex>

        <ITStack direction="column" spacing={2}>
          <ITText className="text-[12px] font-semibold text-slate-500">
            {tt("detail.description")}
          </ITText>
          <ITText className="text-[13px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
            {ticket.description}
          </ITText>
        </ITStack>

        {attachments}

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} sm={6} md={4}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[12px] font-bold text-slate-400">
                {tt("detail.createdBy")}
              </ITText>
              <ITText className="text-[12px] font-bold text-slate-700 truncate">
                {ticket.createdBy?.name ?? "—"}
              </ITText>
              <ITText className="text-[9px] text-slate-400">
                {formatDateTime(ticket.createdAt)}
              </ITText>
            </ITStack>
          </ITGrid>
          <ITGrid item xs={12} sm={6} md={4}>
            {canAssign ? (
              <ITSelect
                name="responsible"
                label={tt("detail.responsible")}
                options={[{ value: "", label: tt("detail.noResponsible") }, ...fx.assigneeOptions]}
                value={ticket.assignedToId ?? ""}
                onChange={(e) => fx.handleResponsibleChange(e.target.value)}
              />
            ) : (
              <ITStack direction="column" spacing={1}>
                <ITText className="text-[12px] font-bold text-slate-400">
                  {tt("detail.assignedTo")}
                </ITText>
                <ITText className="text-[12px] font-bold text-slate-700 truncate">
                  {ticket.assignedTo?.name ?? tt("detail.unassigned")}
                </ITText>
              </ITStack>
            )}
          </ITGrid>
          <ITGrid item xs={12} sm={6} md={4}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[12px] font-bold text-slate-400">
                {tt("detail.department")}
              </ITText>
              <ITText className="text-[12px] font-bold text-slate-700 truncate">
                {ticket.department?.name ?? "—"}
              </ITText>
            </ITStack>
          </ITGrid>
        </ITGrid>

        {efficacy && (
          <ITFlex align="center" wrap="wrap" gap={3} className="rounded-xl bg-slate-50 px-3 py-2">
            <ITText className="text-[12px] font-semibold text-slate-500">{tt("detail.efficacyTitle")}</ITText>
            <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${efficacy.score}%`,
                  backgroundColor:
                    efficacy.score >= 80 ? "var(--color-success)" : efficacy.score >= 60 ? "var(--color-warning)" : "var(--color-danger)",
                }}
              />
            </div>
            <span className="text-[13px] font-bold tabular-nums text-slate-800">{efficacy.score}%</span>
            <ITText className="text-[12px] text-slate-500">{tt("detail.resolvedIn", { hours: efficacy.hours })}</ITText>
          </ITFlex>
        )}
      </ITStack>
    </ITCard>
  );
}