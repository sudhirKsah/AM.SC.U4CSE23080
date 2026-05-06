import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { logger } from 'logging-middleware';
import notificationRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/notifications', notificationRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('handler', `Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('route', `Server started on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
