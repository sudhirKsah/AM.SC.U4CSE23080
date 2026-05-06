import { useState, useEffect, useCallback } from 'react';
import { logger } from 'logging-middleware';
import { fetchPriorityNotifications } from '../api/notifications';
import { getViewedIds, markViewed } from '../utils/viewed';
import type { Notification } from '../types';
import NotificationCard from '../components/NotificationCard';

const N_OPTIONS = [10, 15, 20, 25];

export default function PriorityInboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [topN, setTopN] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewedIds, setViewedIds] = useState<Set<string>>(getViewedIds());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      logger.info('page', `PriorityInbox load topN:${topN}`);
      const data = await fetchPriorityNotifications(topN);
      setNotifications(data);
      markViewed(data.map((n) => n.ID));
      setViewedIds(getViewedIds());
    } catch (e: any) {
      logger.error('page', `PriorityInbox load failed: ${e.message}`);
      setError('Could not load priority inbox. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [topN]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="priority-toolbar">
        <h1>Priority Inbox</h1>
        <span className="top-n-label">Show top</span>
        <select
          className="limit-select"
          value={topN}
          onChange={(e) => {
            setTopN(Number(e.target.value));
            logger.info('component', `Priority topN changed to ${e.target.value}`);
          }}
        >
          {N_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button className="refresh-btn" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Ranked by: <strong style={{ color: 'var(--accent)' }}>Placement (3pts) &gt; Result (2pts) &gt; Event (1pt)</strong> + recency bonus
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          {Array.from({ length: topN > 10 ? 8 : 5 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state"><p>No notifications found.</p></div>
      ) : (
        <div className="notification-list">
          {notifications.map((n, i) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isNew={!viewedIds.has(n.ID)}
              rank={i + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}
