import { Router, Request, Response } from 'express';
import axios from 'axios';
import pool from '../db';
import { logger } from 'logging-middleware';

const router = Router();

const NOTIFICATIONS_API = 'http://20.207.122.201/evaluation-service/notifications';

router.get('/', async (req: Request, res: Response) => {
  const { limit, page, notification_type } = req.query;

  try {
    logger.info('route', `Fetching notifications - type:${notification_type || 'all'} page:${page || 1}`);

    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    if (page) params.page = String(page);
    if (notification_type) params.notification_type = String(notification_type);

    const response = await axios.get(NOTIFICATIONS_API, { 
      params,
      headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` }
    });
    const notifications = response.data.notifications || [];

    logger.info('route', `Fetched ${notifications.length} notifications from upstream`);
    res.json({ notifications });
  } catch (err: any) {
    logger.error('route', `Failed to fetch notifications: ${err.message}`);
    res.status(502).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/priority', async (req: Request, res: Response) => {
  const { limit = '10', notification_type } = req.query;
  const topN = Math.min(Number(limit), 50);

  try {
    logger.info('service', `Building priority inbox - topN:${topN}`);

    const params: Record<string, string> = { limit: '100' };
    if (notification_type) params.notification_type = String(notification_type);

    const response = await axios.get(NOTIFICATIONS_API, { 
      params,
      headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` }
    });
    const notifications: any[] = response.data.notifications || [];

    const WEIGHT: Record<string, number> = {
      Placement: 3,
      Result: 2,
      Event: 1,
    };

    const now = Date.now();

    const scored = notifications.map((n) => {
      const weight = WEIGHT[n.Type] ?? 1;
      const ageMs = now - new Date(n.Timestamp).getTime();
      const recencyScore = 1 / (1 + ageMs / (1000 * 60 * 60));
      return { ...n, _score: weight + recencyScore };
    });

    scored.sort((a, b) => b._score - a._score);
    const top = scored.slice(0, topN).map(({ _score, ...n }) => n);

    logger.info('service', `Priority inbox built: ${top.length} notifications returned`);
    res.json({ notifications: top });
  } catch (err: any) {
    logger.error('service', `Priority inbox failed: ${err.message}`);
    res.status(502).json({ error: 'Failed to build priority inbox' });
  }
});

export default router;
