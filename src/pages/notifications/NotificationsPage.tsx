import { ITButton, ITPage, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaBell, FaCheckDouble } from "react-icons/fa";
import { NotificationItem, useNotificationsList } from "@features/notification/list";

export default function NotificationsPage() {
  const fx = useNotificationsList();

  return (
    <ITPage
      title="Notificaciones"
      description="Centro de notificaciones y alertas"
      icon={<FaBell size={20} />}
      maxWidth="3xl"
      actions={
        fx.unreadCount > 0 ? (
          <ITButton
            variant="outlined"
            color="primary"
            size="small"
            onClick={fx.handleMarkAll}
          >
            <FaCheckDouble size={12} className="mr-1" />
            Marcar todo como leido
          </ITButton>
        ) : undefined
      }
    >
      <ITStack direction="column" spacing={2}>
        {fx.loading && fx.items.length === 0 && (
          <ITText className="text-[12px] text-slate-400 italic text-center py-8">
            Cargando...
          </ITText>
        )}

        {!fx.loading && fx.items.length === 0 && (
          <ITText className="text-[12px] text-slate-400 italic text-center py-8">
            Sin notificaciones
          </ITText>
        )}

        {fx.items.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onSlotClick={fx.handleSlotClick}
            onDelete={fx.handleDelete}
          />
        ))}
      </ITStack>
    </ITPage>
  );
}