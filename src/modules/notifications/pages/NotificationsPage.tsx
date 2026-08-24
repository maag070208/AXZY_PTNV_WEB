import { ITButton, ITFlex, ITPage, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { useEffect } from "react";
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaComment,
  FaTicketAlt,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@core/store/notifications/notifications.slice";
import { formatFechaHora } from "@core/store/cartas/types";
import type { Notification } from "@core/api/notifications.api";
import { notificationsApi } from "@core/api/notifications.api";

const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  COMMENT: { icon: <FaComment size={12} />, color: "bg-blue-500" },
  ASSIGNED: { icon: <FaTicketAlt size={12} />, color: "bg-violet-500" },
  TICKET_UPDATED: { icon: <FaTicketAlt size={12} />, color: "bg-amber-500" },
  TICKET_CREATED: { icon: <FaTicketAlt size={12} />, color: "bg-emerald-500" },
};

export default function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, unreadCount, loading } = useSelector(
    (s: RootState) => s.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications(false));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleMarkRead = (n: Notification) => {
    if (!n.read) dispatch(markNotificationRead(n.id));
    if (n.ticketId) navigate(`/tickets/${n.ticketId}`);
  };

  const handleMarkAll = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsApi.remove(id);
    dispatch(fetchNotifications(false));
    dispatch(fetchUnreadCount());
  };

  return (
    <ITPage
      title="Notificaciones"
      description="Centro de notificaciones y alertas"
      icon={<FaBell size={20} />}
      maxWidth="3xl"
      actions={
        unreadCount > 0 ? (
          <ITButton
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleMarkAll}
          >
            <FaCheckDouble size={12} className="mr-1" />
            Marcar todo como leido
          </ITButton>
        ) : undefined
      }
    >
      <ITStack direction="column" spacing={2}>
        {loading && items.length === 0 && (
          <ITText className="text-[12px] text-slate-400 italic text-center py-8">
            Cargando...
          </ITText>
        )}

        {!loading && items.length === 0 && (
          <ITText className="text-[12px] text-slate-400 italic text-center py-8">
            Sin notificaciones
          </ITText>
        )}

        {items.map((n) => {
          const typeInfo = TYPE_ICONS[n.type] ?? TYPE_ICONS.TICKET_UPDATED;
          return (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n)}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                n.read
                  ? "bg-white hover:bg-slate-50"
                  : "bg-blue-50/60 hover:bg-blue-50"
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
                    {n.read && (
                      <FaCheck size={8} className="text-emerald-400" />
                    )}
                    <FaTrash
                      size={10}
                      className="text-slate-300 hover:text-red-400 cursor-pointer"
                      onClick={(e) => handleDelete(n.id, e)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </ITStack>
    </ITPage>
  );
}
