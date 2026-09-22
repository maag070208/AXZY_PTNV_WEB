import { ITText } from "@axzydev/axzy_ui_system";
import {
  FaCheck,
  FaComment,
  FaFileUpload,
  FaTicketAlt,
  FaTrash,
  FaUserPlus,
  FaUserSlash,
} from "react-icons/fa";
import type { Notification } from "@entities/notification";
import { formatFechaHora } from "@shared/utils/dates";

const TYPE_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  COMMENT: { icon: <FaComment size={12} />, color: "bg-blue-500" },
  ASSIGNED: { icon: <FaTicketAlt size={12} />, color: "bg-violet-500" },
  TICKET_UPDATED: { icon: <FaTicketAlt size={12} />, color: "bg-amber-500" },
  TICKET_CREATED: { icon: <FaTicketAlt size={12} />, color: "bg-emerald-500" },
  USER_CREATED: { icon: <FaUserPlus size={12} />, color: "bg-emerald-500" },
  USER_DEACTIVATED: { icon: <FaUserSlash size={12} />, color: "bg-red-500" },
  EMPLOYEE_DOC_UPLOADED: { icon: <FaFileUpload size={12} />, color: "bg-blue-600" },
};

export default function NotificationItem({
  notification,
  onSlotClick,
  onDelete,
}: {
  notification: Notification;
  onSlotClick: (n: Notification) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const n = notification;
  const typeInfo = TYPE_STYLES[n.type] ?? TYPE_STYLES.TICKET_UPDATED;

  return (
    <div
      onClick={() => onSlotClick(n)}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
        n.read ? "bg-white hover:bg-slate-50" : "bg-blue-50/60 hover:bg-blue-50"
      } border ${n.read ? "border-slate-100" : "border-blue-100"}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${typeInfo.color}`}
      >
        {typeInfo.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <ITText
            className={`text-[11px] leading-tight ${
              n.read ? "text-slate-600" : "text-slate-800 font-bold"
            }`}
          >
            {n.title}
          </ITText>
          {!n.read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
          )}
        </div>
        {n.detail && (
          <ITText className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
            {n.detail}
          </ITText>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <ITText className="text-[9px] text-slate-400 tabular-nums">
            {formatFechaHora(n.createdAt)}
          </ITText>
          <div className="flex items-center gap-1">
            {n.read && <FaCheck size={8} className="text-emerald-400" />}
            <FaTrash
              size={10}
              className="text-slate-300 hover:text-red-400 cursor-pointer"
              onClick={(e) => onDelete(n.id, e)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}