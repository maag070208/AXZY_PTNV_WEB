import { useAblyChannel } from "@shared/lib/ably";
import { store } from "@app/store";
import { prependNotification } from "@entities/notification";
import { i18n } from "@shared/i18n";

export const useAblyNotifications = (
  userId: string | undefined,
  onNotification?: (title: string) => void
) => {
  useAblyChannel(userId ? `user:${userId}` : undefined, {
    NOTIFICATION: (data: unknown) => {
      store.dispatch(prependNotification(data));
      onNotification?.(
        (data as { title?: string } | null)?.title ?? i18n.t("notifications:newNotification")
      );
    },
  });
};