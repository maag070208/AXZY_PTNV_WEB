import { ITButton, ITFlex, ITStack, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaComment, FaPaperPlane } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { UseDeviceDetail } from "../model/useDeviceDetail";

export default function DeviceCommentBox({ fx }: { fx: UseDeviceDetail }) {
  const { t: tt } = useTranslation(["device"]);
  return (
    <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
      <ITStack direction="column" spacing={4} className="w-full">
        <ITFlex align="center" gap={2}>
          <FaComment size={14} className="text-slate-400" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {tt("comment.title")}
          </ITText>
        </ITFlex>

        <ITTextarea
          name="comment"
          value={fx.commentText}
          onChange={(v) => fx.setCommentText(v)}
          placeholder={tt("comment.placeholder")}
          rows={3}
          className="w-full"
        />
        <ITFlex justify="end">
          <ITButton
            variant="filled"
            color="primary"
            size="small"
            onClick={fx.handleAddComment}
            disabled={fx.sendingComment || !fx.commentText.trim()}
          >
            <FaPaperPlane size={12} />
          </ITButton>
        </ITFlex>
      </ITStack>
    </ITFlex>
  );
}