import { ITBadget, ITFlex, ITGrid, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { formatFechaHora } from "@shared/utils/dates";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { PRIORITY_BADGE, STATUS_BADGE } from "@entities/ticket";
import { calculateEfficacy } from "../model/timeline";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  attachments: React.ReactNode;
}

export default function TicketInfoCard({ fx, attachments }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const efficacy = calculateEfficacy(ticket);

  return (
    <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
      <ITStack direction="column" spacing={5} className="w-full">
        <ITFlex gap={2} wrap="wrap">
          <ITBadget color={(STATUS_BADGE[ticket.status]?.color as any) ?? "default"} size="lg">
            {dyn(tt)(`statusLabels.${ticket.status}`)}
          </ITBadget>
          <ITBadget color={(PRIORITY_BADGE[ticket.priority]?.color as any) ?? "default"} size="lg">
            {dyn(tt)(`priorityLabels.${ticket.priority}`)}
          </ITBadget>
          <ITBadget color="primary" size="lg">
            {ticket.category?.nombre ?? "—"}
          </ITBadget>
          {ticket.deletedAt && (
            <ITBadget color="gray" size="lg">
              {tt("detail.deletedBadge")}
            </ITBadget>
          )}
        </ITFlex>

        <ITStack direction="column" spacing={2}>
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {tt("detail.description")}
          </ITText>
          <ITText className="text-[13px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
            {ticket.descripcion}
          </ITText>
        </ITStack>

        {attachments}

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} sm={6} md={4}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("detail.createdBy")}
              </ITText>
              <ITText className="text-[12px] font-bold text-slate-700 truncate">
                {ticket.creadoPor?.name ?? "—"}
              </ITText>
              <ITText className="text-[9px] text-slate-400">
                {formatFechaHora(ticket.creadoEn)}
              </ITText>
            </ITStack>
          </ITGrid>
          <ITGrid item xs={12} sm={6} md={4}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("detail.assignedTo")}
              </ITText>
              <ITText className="text-[12px] font-bold text-slate-700 truncate">
                {ticket.asignadoA?.name ?? tt("detail.unassigned")}
              </ITText>
            </ITStack>
          </ITGrid>
          <ITGrid item xs={12} sm={6} md={4}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("detail.department")}
              </ITText>
              <ITText className="text-[12px] font-bold text-slate-700 truncate">
                {ticket.department?.name ?? "—"}
              </ITText>
            </ITStack>
          </ITGrid>
        </ITGrid>

        {efficacy && (
          <ITFlex className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <ITStack direction="column" spacing={1} className="flex-1">
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("detail.efficacyTitle")}
              </ITText>
              <ITFlex align="center" gap={2}>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      efficacy.score === 100
                        ? "bg-emerald-500"
                        : efficacy.score === 80
                        ? "bg-blue-500"
                        : efficacy.score === 60
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${efficacy.score}%` }}
                  />
                </div>
                <ITFlex align="center" gap={1}>
                  <ITText
                    className={`text-[13px] font-black ${
                      efficacy.score === 100
                        ? "text-emerald-600"
                        : efficacy.score === 80
                        ? "text-blue-600"
                        : efficacy.score === 60
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {efficacy.score}%
                  </ITText>
                  <ITText
                    className={`text-[9px] font-bold ${
                      efficacy.score === 100
                        ? "text-emerald-500"
                        : efficacy.score === 80
                        ? "text-blue-500"
                        : efficacy.score === 60
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}
                  >
                    {dyn(tt)(`detail.efficacyLabels.${efficacy.label}`)}
                  </ITText>
                </ITFlex>
              </ITFlex>
              <ITText className="text-[9px] text-slate-400">
                {tt("detail.resolvedIn", { hours: efficacy.hours })}
              </ITText>
            </ITStack>
          </ITFlex>
        )}
      </ITStack>
    </ITFlex>
  );
}