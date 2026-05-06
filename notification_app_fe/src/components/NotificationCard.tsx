import type { Notification } from '../types';

interface Props {
  notification: Notification;
  isNew: boolean;
  rank?: number;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationCard({ notification, isNew, rank }: Props) {
  return (
    <div className={`notification-card${isNew ? ' is-new' : ''}`}>
      <div className={`type-badge badge-${notification.Type}`} />
      <div className="card-body">
        <div className="card-header">
          <span className={`type-pill pill-${notification.Type}`}>{notification.Type}</span>
          {isNew && <span className="new-dot" title="New" />}
        </div>
        <div className="card-message">{notification.Message}</div>
        <div className="card-time">{timeAgo(notification.Timestamp)}</div>
      </div>
      {rank !== undefined && <div className="priority-rank">#{rank}</div>}
    </div>
  );
}
