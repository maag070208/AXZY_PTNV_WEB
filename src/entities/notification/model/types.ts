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