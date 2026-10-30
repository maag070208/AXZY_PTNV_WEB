import { ITButton, ITFlex, ITTextarea } from "@axzydev/axzy_ui_system";
import { LuMessageSquare, LuSend } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
}

/** Caja para comentar; los comentarios ya publicados salen en el feed del historial. */
export default function TicketComments({ fx }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const isClosed = fx.isClosed;

  return (
    <PanelCard
      title={isClosed ? tt("detail.commentsReadonly") : tt("detail.addComment")}
      icon={<LuMessageSquare size={16} />}
    >
      <ITTextarea
        name="comment"
        value={fx.commentText}
        onChange={(v) => fx.setCommentText(v)}
        placeholder={isClosed ? tt("detail.commentClosedPlaceholder") : tt("detail.commentPlaceholder")}
        rows={3}
        disabled={isClosed}
      />

      {!isClosed && (
        <ITFlex align="center" justify="between" gap={2} className="mt-3">
          <span className="text-[12px] text-slate-500">
            {fx.commentText.trim().length > 0
              ? tt("detail.charCount", { count: fx.commentText.trim().length })
              : tt("detail.publicFollowup")}
          </span>
          <ITButton
            variant="filled"
            color="primary"
            size="sm"
            onClick={fx.handleAddComment}
            disabled={fx.sendingComment || !fx.commentText.trim()}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold">
              <LuSend size={12} />
              {fx.sendingComment ? tt("detail.sendingComment") : tt("detail.sendComment")}
            </span>
          </ITButton>
        </ITFlex>
      )}
    </PanelCard>
  );
}
