export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  detail?: string | null;
  ticketId?: string | null;
  read: boolean;
  createdAt: string;
}
/** Pantalla que abre una notificación: su ticket, si tiene. */
export const notificationRoute = (n: Pick<Notification, "ticketId">): string | null =>
  n.ticketId ? `/tickets/${n.ticketId}` : null;
