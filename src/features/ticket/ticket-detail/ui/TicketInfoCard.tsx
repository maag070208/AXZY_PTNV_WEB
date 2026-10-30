import { ITCard, ITText } from "@axzydev/axzy_ui_system";
import { LuFileText } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  attachments: React.ReactNode;
}

/** Descripción del ticket y sus archivos (el héroe lleva estado, personas y fechas). */
export default function TicketInfoCard({ fx, attachments }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  return (
    <ITCard>
      <div className="flex w-full flex-col gap-4">
        <ITText as="h3" className="m-0 flex items-center gap-2 !text-[16px] font-bold !text-slate-800">
          <ITText as="span" className="flex items-center text-slate-400">
            <LuFileText size={16} />
          </ITText>
          {tt("detail.description")}
        </ITText>
        <ITText className="m-0 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-slate-700">
          {ticket.description || tt("detail.noDescription")}
        </ITText>
        {attachments}
      </div>
    </ITCard>
  );
}
