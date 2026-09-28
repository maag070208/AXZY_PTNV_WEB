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
/** Pantalla que abre una notificación: su ticket o, si es de la auditoría de inventario, el tablero. */
export const notificationRoute = (n: Partial<Pick<Notification, "ticketId" | "type">>): string | null => {
  if (n.ticketId) return `/tickets/${n.ticketId}`;
  if (n.type === "INVENTORY_AUDIT") return "/inventory";
  return null;
};
