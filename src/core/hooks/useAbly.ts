import { useEffect, useRef } from "react";
import * as Ably from "ably";
import { store } from "@core/store/store";
import { prependNotification } from "@core/store/notifications/notifications.slice";

let ablyClient: Ably.Realtime | null = null;

const getAblyClient = (): Ably.Realtime => {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      key: "yuJ-ow.7iF_wA:tuWolCDo1xBN4tpDEbZFD7A60KNnT_AsTNvhxkII-go",
    });
  }
  return ablyClient;
};

export const useAblyTicket = (
  ticketId: string | undefined,
  onComment?: (data: any) => void,
  onUpdate?: (data: any) => void
) => {
  const onCommentRef = useRef(onComment);
  const onUpdateRef = useRef(onUpdate);
  onCommentRef.current = onComment;
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!ticketId) return;
    const client = getAblyClient();
    const channel = client.channels.get(`tickets:${ticketId}`);

    const handleComment = (message: Ably.Message) => {
      onCommentRef.current?.(message.data);
    };

    const handleUpdate = (message: Ably.Message) => {
      onUpdateRef.current?.(message.data);
    };

    channel.subscribe("COMMENT", handleComment);
    channel.subscribe("UPDATED", handleUpdate);

    return () => {
      channel.unsubscribe("COMMENT", handleComment);
      channel.unsubscribe("UPDATED", handleUpdate);
    };
  }, [ticketId]);
};

export const useAblyNotifications = (userId: string | undefined, onNotification?: (title: string) => void) => {
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    if (!userId) return;
    const client = getAblyClient();
    const channel = client.channels.get(`user:${userId}`);

    const handleNotification = (message: Ably.Message) => {
      store.dispatch(prependNotification(message.data));
      onNotificationRef.current?.(message.data?.title ?? "Nueva notificacion");
    };

    channel.subscribe("NOTIFICATION", handleNotification);

    return () => {
      channel.unsubscribe("NOTIFICATION", handleNotification);
    };
  }, [userId]);
};
