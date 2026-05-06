import { useState, useEffect, useCallback } from 'react';
import { logger } from 'logging-middleware';
import { fetchNotifications } from '../api/notifications';
import { getViewedIds, markViewed } from '../utils/viewed';
import type { Notification, NotificationType } from '../types';
import NotificationCard from '../components/NotificationCard';

const PAGE_SIZE = 10;
const TYPES: Array<NotificationType | ''> = ['', 'Placement', 'Result', 'Event'];

export default function AllNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationType | ''>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewedIds, setViewedIds] = useState<Set<string>>(getViewedIds());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      logger.info('page', `AllNotifications load page:${page} filter:${filter || 'all'}`);
      const data = await fetchNotifications({ limit: PAGE_SIZE, page, notification_type: filter });
      setNotifications(data);
      markViewed(data.map((n) => n.ID));
      setViewedIds(getViewedIds());
    } catch (e: any) {
      logger.error('page', `AllNotifications load failed: ${e.message}`);
      setError('Could not load notifications. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (val: NotificationType | '') => {
    setFilter(val);
    setPage(1);
    logger.info('component', `Filter changed to: ${val || 'all'}`);
  };

  return (
    <>
      <div className="toolbar">
        <h1>All Notifications</h1>
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as NotificationType | '')}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t || 'All Types'}</option>
          ))}
        </select>
        <button className="refresh-btn" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications found.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((n) => (
            <NotificationCard key={n.ID} notification={n} isNew={!viewedIds.has(n.ID)} />
          ))}
        </div>
      )}

      <div className="pagination">
        <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
          ← Prev
        </button>
        <button className="page-btn active">{page}</button>
        <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={notifications.length < PAGE_SIZE || loading}>
          Next →
        </button>
      </div>
    </>
  );
}
