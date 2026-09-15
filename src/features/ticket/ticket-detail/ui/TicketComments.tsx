import { ITButton, ITFlex, ITStack, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaComment, FaPaperPlane } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
}

export default function TicketComments({ fx }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const isClosed = fx.isClosed;

  return (
    <div className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
      <ITStack direction="column" spacing={3} className="w-full">
        <ITFlex align="center" gap={2}>
          <FaComment size={14} className="text-slate-400" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {isClosed ? tt("detail.commentsReadonly") : tt("detail.addComment")}
          </ITText>
        </ITFlex>

        <div
          className={`w-full border border-slate-200 rounded-xl p-3 transition-all ${
            isClosed
              ? "bg-slate-50"
              : "bg-slate-50/70 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
          }`}
        >
          <ITTextarea
            name="comment"
            value={fx.commentText}
            onChange={(v) => fx.setCommentText(v)}
            placeholder={
              isClosed ? tt("detail.commentClosedPlaceholder") : tt("detail.commentPlaceholder")
            }
            rows={3}
            disabled={isClosed}
            className="w-full bg-transparent resize-none border-none p-0 focus:ring-0 text-[13px] text-slate-700 placeholder:text-slate-400"
          />

          {!isClosed && (
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-medium">
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
                className="px-4 py-1.5 h-auto rounded-lg shadow-sm font-semibold transition-all active:scale-95"
              >
                <ITFlex align="center" gap={1.5}>
                  <FaPaperPlane size={11} />
                  <span className="text-[11px]">
                    {fx.sendingComment ? tt("detail.sendingComment") : tt("detail.sendComment")}
                  </span>
                </ITFlex>
              </ITButton>
            </div>
          )}
        </div>
      </ITStack>
    </div>
  );
}