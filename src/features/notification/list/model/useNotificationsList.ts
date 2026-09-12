import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@app/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsApi,
  type Notification,
} from "@entities/notification";

export const useNotificationsList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, unreadCount, loading } = useSelector(
    (s: RootState) => s.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications(false));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleSlotClick = useCallback(
    (n: Notification) => {
      if (!n.read) dispatch(markNotificationRead(n.id));
      if (n.ticketId) navigate(`/tickets/${n.ticketId}`);
    },
    [dispatch, navigate]
  );

  const handleMarkAll = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await notificationsApi.remove(id);
      dispatch(fetchNotifications(false));
      dispatch(fetchUnreadCount());
    },
    [dispatch]
  );

  return {
    items,
    unreadCount,
    loading,
    handleMarkAll,
    handleDelete,
    handleSlotClick,
  };
};

export type UseNotificationsList = ReturnType<typeof useNotificationsList>;