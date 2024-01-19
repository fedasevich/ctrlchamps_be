import { Notification } from 'src/common/entities/notification.entity';

export interface UnreadNotificationsResponse {
  data: Notification[];
  count: number;
}

export type NotificationsQuery = {
  limit?: number;
  offset?: number;
};

export type NotificationsListResponse = {
  data: Notification[];
  count: number;
};
