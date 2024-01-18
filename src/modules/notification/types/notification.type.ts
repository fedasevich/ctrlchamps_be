import { Notification } from 'src/common/entities/notification.entity';

export type NotificationsQuery = {
  limit?: number;
  offset?: number;
};

export type NotificationsListResponse = {
  data: Notification[];
  count: number;
};
