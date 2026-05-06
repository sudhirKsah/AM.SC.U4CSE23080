import axios from 'axios';
import { logger } from 'logging-middleware';
import type { Notification, NotificationType } from '../types';

const BASE = '/api/notifications';


export async function fetchNotifications(params: {
  limit?: number;
  page?: number;
  notification_type?: NotificationType | '';
}): Promise<Notification[]> {
  logger.info('api', `Fetching notifications page:${params.page || 1} type:${params.notification_type || 'all'}`);
  const query: Record<string, string> = {};
  if (params.limit) query.limit = String(params.limit);
  if (params.page) query.page = String(params.page);
  if (params.notification_type) query.notification_type = params.notification_type;

  const res = await axios.get(BASE, { params: query });
  return res.data.notifications || [];
}

export async function fetchPriorityNotifications(limit: number): Promise<Notification[]> {
  logger.info('api', `Fetching priority inbox topN:${limit}`);
  const res = await axios.get(`${BASE}/priority`, { params: { limit } });
  return res.data.notifications || [];
}
