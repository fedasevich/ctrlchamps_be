import { NotificationMessage } from 'src/common/enums/notification-message.enum';

export interface Notification {
  id: string;
  status: NotificationMessage;
  appointmentId: string;
  user: string;
  isRead: boolean;
}

export interface UnreadNotificationsResponse {
  data: Notification[];
  count: number;
}
